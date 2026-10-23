import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  type TestAccount,
  admin,
  anonClient,
  cleanup,
  createEvent,
  createTestAccount,
} from './helpers';

/**
 * RLS ist laut CLAUDE.md die Sicherheitsgrenze dieses Projekts -- die Pruefungen
 * in den Server Actions liefern nur lesbare Fehlermeldungen. Eine kaputte Policy
 * ist im UI unsichtbar, bis sie jemand ausnutzt. Genau diese Fehlerklasse
 * halten diese Tests fest.
 *
 * Die Behauptungen sind dieselben, die beim Umbau von Scheibe 2c von Hand
 * geprueft wurden -- hier festgeschrieben, damit der naechste Policy-Umbau
 * (Einladungen) sie nicht wieder von Hand braucht.
 */

let a: TestAccount;
let b: TestAccount;
let eventOfA: string;
let eventOfB: string;

beforeAll(async () => {
  a = await createTestAccount('a');
  b = await createTestAccount('b');
  eventOfA = await createEvent(a, 'Event von A');
  eventOfB = await createEvent(b, 'Event von B');
});

afterAll(async () => {
  await cleanup([a, b]);
});

describe('events: Besitz ist die Organisation', () => {
  it('A aendert das Event von B nicht', async () => {
    const { data, error } = await a.client
      .from('events')
      .update({ title: 'gekapert' })
      .eq('id', eventOfB)
      .select('id');

    // Kein Fehler, aber auch keine Zeile: unter RLS ist ein Update, das keine
    // Zeile sieht, ein stilles Nichts. Genau deshalb pruefen die Actions das
    // Ergebnis und melden "nicht gefunden oder keine Berechtigung".
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('A loescht das Event von B nicht', async () => {
    const { data, error } = await a.client
      .from('events')
      .delete()
      .eq('id', eventOfB)
      .select('id');

    expect(error).toBeNull();
    expect(data).toEqual([]);

    // und es ist wirklich noch da
    const { data: still } = await admin()
      .from('events')
      .select('id')
      .eq('id', eventOfB);

    expect(still).toHaveLength(1);
  });

  it('A aendert das eigene Event', async () => {
    const { data, error } = await a.client
      .from('events')
      .update({ title: 'von A geaendert' })
      .eq('id', eventOfA)
      .select('id');

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('A legt kein Event in der Organisation von B an', async () => {
    const { error } = await a.client.from('events').insert({
      title: 'in fremder Organisation',
      date: new Date('2027-01-01').toISOString(),
      organization_id: b.organizationId,
      created_by: a.userId,
    });

    expect(error?.code).toBe('42501');
  });

  it('A verschiebt das eigene Event nicht in die Organisation von B', async () => {
    // Das ist der Fall, den ein `using` allein nicht abdeckt -- es braucht das
    // `with check` auf der UPDATE-Policy.
    const { error } = await a.client
      .from('events')
      .update({ organization_id: b.organizationId })
      .eq('id', eventOfA);

    expect(error?.code).toBe('42501');
  });

  it('Events sind oeffentlich lesbar, auch ohne Anmeldung', async () => {
    const { data, error } = await anonClient()
      .from('events')
      .select('id')
      .in('id', [eventOfA, eventOfB]);

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });

  it('ohne Anmeldung laesst sich kein Event anlegen', async () => {
    const { error } = await anonClient()
      .from('events')
      .insert({
        title: 'anonym',
        date: new Date('2027-01-01').toISOString(),
        organization_id: a.organizationId,
        created_by: a.userId,
      });

    expect(error?.code).toBe('42501');
  });
});

describe('event_participants: nur die Organisation des Events sieht sie', () => {
  beforeAll(async () => {
    // Anmeldung ist oeffentlich -- der anonyme Client muss das duerfen.
    const { error } = await anonClient().from('event_participants').insert({
      event_id: eventOfB,
      email: 'gast@example.com',
      name: 'Gast',
    });

    expect(error).toBeNull();
  });

  it('A sieht die Teilnehmer von B nicht', async () => {
    const { data, error } = await a.client
      .from('event_participants')
      .select('id')
      .eq('event_id', eventOfB);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('B sieht die eigenen Teilnehmer', async () => {
    const { data, error } = await b.client
      .from('event_participants')
      .select('id')
      .eq('event_id', eventOfB);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('A aendert die Teilnehmer von B nicht', async () => {
    const { data, error } = await a.client
      .from('event_participants')
      .update({ status: 'confirmed' })
      .eq('event_id', eventOfB)
      .select('id');

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('B aendert die eigenen Teilnehmer', async () => {
    const { data, error } = await b.client
      .from('event_participants')
      .update({ status: 'confirmed' })
      .eq('event_id', eventOfB)
      .select('id');

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('ohne Anmeldung sind Teilnehmer unsichtbar', async () => {
    const { data, error } = await anonClient()
      .from('event_participants')
      .select('id');

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe('Loeschen eines Nutzers nimmt keine Events mit', () => {
  it('das Event bleibt bei der Organisation, created_by wird null', async () => {
    // Eigenes Konto, damit der Test nichts von a oder b zerstoert.
    const c = await createTestAccount('c');
    const eventOfC = await createEvent(c, 'Event von C');

    await admin().auth.admin.deleteUser(c.userId);

    const { data } = await admin()
      .from('events')
      .select('id, organization_id, created_by')
      .eq('id', eventOfC)
      .single();

    // Das ist die Entscheidung aus Scheibe 2b, die erst mit dem Entfernen von
    // organizer_id in Kraft trat: vorher riss ein geloeschter Nutzer seine
    // Events mit.
    expect(data?.id).toBe(eventOfC);
    expect(data?.organization_id).toBe(c.organizationId);
    expect(data?.created_by).toBeNull();

    await admin().from('organizations').delete().eq('id', c.organizationId);
  });
});
