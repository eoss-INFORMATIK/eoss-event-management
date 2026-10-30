import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ensureOrganization } from '@/features/auth/ensure-organization';

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
      // Die Spalte ist `not null` ohne Default, die generierten Typen verlangen
      // sie also auf jedem Insert-Pfad -- auch wenn der Trigger sie danach
      // unbedingt neu setzt. Hier der korrekte Wert; der Fall "Client luegt"
      // steht in einem eigenen Test.
      organization_id: b.organizationId,
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

  it('eine neue Anmeldung ist "registered", ohne dass der Code es setzt', async () => {
    // Der Status kommt aus dem Default der Spalte. `addParticipant` setzt ihn
    // nicht -- genau darauf beruht die Reihenfolge "Migration zuerst" in
    // `participant_status`.
    const { data, error } = await admin()
      .from('event_participants')
      .select('status')
      .eq('event_id', eventOfB)
      .eq('email', 'gast@example.com')
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe('registered');
  });

  it.each(['confirmed', 'pending', 'erfunden'])(
    'die Datenbank lehnt den Status "%s" ab, auch fuer die eigene Organisation',
    async (status) => {
      const { error } = await b.client
        .from('event_participants')
        .update({ status })
        .eq('event_id', eventOfB)
        .select('id');

      // 23514 = check_violation (event_participants_status_check)
      expect(error?.code).toBe('23514');
    }
  );

  it('die oeffentliche Anmeldung setzt keinen eigenen Status', async () => {
    // Vorher `with check (true)`: anonym liess sich direkt "attended"
    // eintragen. Policy "Anyone can register for an event" erlaubt seit
    // `participant_insert_status` nur noch `registered`.
    const { error } = await anonClient().from('event_participants').insert({
      event_id: eventOfB,
      email: 'selbsternannt@example.com',
      status: 'attended',
      organization_id: b.organizationId,
    });

    expect(error?.code).toBe('42501');
  });

  it('A setzt bei einem fremden Event keinen Status, nur die Anmeldung', async () => {
    const withStatus = await a.client.from('event_participants').insert({
      event_id: eventOfB,
      email: 'a-traegt-ein@example.com',
      status: 'invited',
      organization_id: b.organizationId,
    });
    expect(withStatus.error?.code).toBe('42501');
  });

  it('A aendert die Teilnehmer von B nicht', async () => {
    const { data, error } = await a.client
      .from('event_participants')
      .update({ status: 'attended' })
      .eq('event_id', eventOfB)
      .select('id');

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('B aendert die eigenen Teilnehmer', async () => {
    const { data, error } = await b.client
      .from('event_participants')
      .update({ status: 'attended' })
      .eq('event_id', eventOfB)
      .select('id');

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('B fuegt dem eigenen Event einen Teilnehmer mit beliebigem Status hinzu', async () => {
    const { data, error } = await b.client
      .from('event_participants')
      .insert({
        event_id: eventOfB,
        email: 'vor-ort@example.com',
        status: 'attended',
        organization_id: b.organizationId,
      })
      .select('status')
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe('attended');
  });

  it('eine Anmeldung bekommt die Organisation des Events, auch wenn der Client luegt', async () => {
    // Der oeffentliche Client liefert absichtlich die FREMDE Organisation mit.
    // Der Trigger muss sie unbedingt ueberschreiben -- niemand darf die
    // Organisation eines Teilnehmers bestimmen.
    const { error } = await anonClient().from('event_participants').insert({
      event_id: eventOfB,
      email: 'luegner@example.com',
      name: 'Luegner',
      organization_id: a.organizationId,
    });

    expect(error).toBeNull();

    const { data } = await admin()
      .from('event_participants')
      .select('organization_id')
      .eq('event_id', eventOfB)
      .eq('email', 'luegner@example.com')
      .single();

    expect(data?.organization_id).toBe(b.organizationId);
    expect(data?.organization_id).not.toBe(a.organizationId);
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

describe('profiles: nur das eigene', () => {
  /**
   * `createTestAccount` legt keine Profilzeile an -- das macht in der App
   * `ensureOrganization()`, also Anwendungscode, nicht die Datenbank. Hier
   * schreibt sie jedes Konto selbst, und genau das prueft schon die
   * INSERT-Policy mit.
   */
  /** Ziel fuer den Uebernahme-Versuch: ein Konto, das bewusst KEIN Profil hat. */
  let c: TestAccount;

  beforeAll(async () => {
    c = await createTestAccount('c');

    for (const account of [a, b]) {
      const { error } = await account.client
        .from('profiles')
        .insert({ id: account.userId, email: account.email, name: 'vorher' });

      if (error) throw new Error(`Profil ${account.email}: ${error.message}`);
    }
  });

  afterAll(async () => {
    await cleanup([c]);
  });

  it('A aendert den eigenen Namen', async () => {
    const { data, error } = await a.client
      .from('profiles')
      .update({ name: 'A neu' })
      .eq('id', a.userId)
      .select('name');

    expect(error).toBeNull();
    expect(data).toEqual([{ name: 'A neu' }]);
  });

  /**
   * Die eigentliche Behauptung der Profil-Scheibe.
   *
   * `ensureOrganization()` laeuft bei JEDER Anmeldung ueber `profiles`, nicht
   * nur bei der ersten -- aus /auth/callback und /auth/confirm. Dass es den
   * selbst gesetzten Namen nicht mit Provider-Metadaten ueberschreibt, steht
   * als Absicht im Code (`upsert` mit `ignoreDuplicates`). Hier laeuft die
   * echte Funktion gegen die echte Datenbank, damit es nicht bei der Absicht
   * bleibt.
   *
   * Der Cast ist noetig, weil die Funktion den Server-Client-Typ erwartet (der
   * `cookies()` liest). Zur Laufzeit braucht sie nur `auth.getUser`, `from` und
   * `rpc` -- das kann der Testclient auch, und er hat ein echtes JWT.
   */
  it('die erneute Anmeldung macht den geaenderten Namen nicht platt', async () => {
    await a.client
      .from('profiles')
      .update({ name: 'selbst gesetzt' })
      .eq('id', a.userId);

    const result = await ensureOrganization(
      a.client as unknown as Parameters<typeof ensureOrganization>[0]
    );

    expect(result.error).toBeUndefined();

    const { data } = await a.client
      .from('profiles')
      .select('name')
      .eq('id', a.userId)
      .single();

    expect(data?.name).toBe('selbst gesetzt');
  });

  it('A sieht das Profil von B nicht', async () => {
    const { data, error } = await a.client
      .from('profiles')
      .select('id')
      .eq('id', b.userId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('A aendert das Profil von B nicht', async () => {
    const { data, error } = await a.client
      .from('profiles')
      .update({ name: 'gekapert' })
      .eq('id', b.userId)
      .select('id');

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  /**
   * Der Test, fuer den `profiles_update_with_check` da ist.
   *
   * `using` sagt, WELCHE Zeile man anfassen darf -- nicht, wie sie danach
   * aussehen muss. Ohne `with check` darf A die eigene Zeile auf eine fremde
   * `id` schreiben und legt damit ein Profil fuer jemand anderen an: fremder
   * Name, fremde E-Mail. Unauffaellig, solange niemand fremde Profile liest --
   * mit der Mitgliederliste waere es ein gefaelschter Eintrag in einer fremden
   * Liste.
   *
   * Das Ziel braucht dafuer ein Konto OHNE Profilzeile. Der erste Anlauf nahm
   * B, und der Test war gruen, bevor die Migration existierte: das Update
   * scheiterte am Primaerschluessel, weil B schon ein Profil hatte. Das haette
   * ueber die Policy nichts bewiesen.
   */
  it('A schreibt die eigene Zeile nicht auf eine fremde id', async () => {
    const { error } = await a.client
      .from('profiles')
      .update({ id: c.userId, name: 'uebernommen' })
      .eq('id', a.userId)
      .select('id');

    expect(error).not.toBeNull();

    // Und fuer C ist nichts entstanden.
    const { data: profileOfC } = await admin()
      .from('profiles')
      .select('id')
      .eq('id', c.userId);

    expect(profileOfC).toEqual([]);
  });
});

describe('organizations: nur Mitglieder', () => {
  it('A benennt die eigene Organisation um', async () => {
    const { data, error } = await a.client
      .from('organizations')
      .update({ name: 'Org A, neu' })
      .eq('id', a.organizationId)
      .select('name');

    expect(error).toBeNull();
    expect(data).toEqual([{ name: 'Org A, neu' }]);
  });

  it('A sieht die Organisation von B nicht', async () => {
    const { data, error } = await a.client
      .from('organizations')
      .select('id')
      .eq('id', b.organizationId);

    // Genau darauf stuetzt sich die Settings-Seite: sie unterscheidet nicht
    // zwischen "gibt es nicht" und "du bist nicht Mitglied", weil die Policy es
    // auch nicht tut. Beides ist notFound().
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('A benennt die Organisation von B nicht um', async () => {
    const { data, error } = await a.client
      .from('organizations')
      .update({ name: 'gekapert' })
      .eq('id', b.organizationId)
      .select('id');

    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: orgOfB } = await admin()
      .from('organizations')
      .select('name')
      .eq('id', b.organizationId)
      .single();

    expect(orgOfB?.name).toBe('Org b');
  });

  it('A loescht die Organisation von B nicht', async () => {
    const { data, error } = await a.client
      .from('organizations')
      .delete()
      .eq('id', b.organizationId)
      .select('id');

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  /**
   * Die Liste auf der Profilseite laeuft ueber `organization_user` und joint
   * `organizations`. Beide Policies muessen greifen -- waere nur eine davon
   * offen, zeigte die Liste fremde Organisationen oder gar nichts.
   */
  it('die Liste von A enthaelt genau die eigene Organisation', async () => {
    // Bewusst OHNE Filter auf user_id: nur so haengt der Test an der Policy
    // und nicht an der where-Klausel. Mit Filter blieb er gruen, auch als RLS
    // auf organizations abgeschaltet war -- er bewies dann gar nichts. Der
    // Produktionscode filtert trotzdem, damit die Absicht im Code lesbar ist.
    const { data, error } = await a.client
      .from('organization_user')
      .select('organizations (id)');

    expect(error).toBeNull();
    expect(data?.map((row) => row.organizations?.id)).toEqual([
      a.organizationId,
    ]);
  });
});

describe('event_categories: der Client darf keine fremde Kategorie unterschieben', () => {
  let categoryOfA: string;
  let categoryOfB: string;

  beforeAll(async () => {
    const insert = async (
      account: TestAccount,
      eventId: string,
      label: string
    ) => {
      const { data, error } = await account.client
        .from('event_categories')
        .insert({ event_id: eventId, label })
        .select('id')
        .single();

      if (error || !data)
        throw new Error(`Kategorie "${label}": ${error?.message}`);

      return data.id;
    };

    categoryOfA = await insert(a, eventOfA, 'Einzelperson');
    categoryOfB = await insert(b, eventOfB, 'Firma');
  });

  it('A legt keine Kategorie am Event von B an', async () => {
    const { error } = await a.client
      .from('event_categories')
      .insert({ event_id: eventOfB, label: 'geschmuggelt' })
      .select('id');

    expect(error).not.toBeNull();
  });

  it('A haengt die eigene Kategorie nicht an das Event von B um', async () => {
    // Braucht das `with check` auf der UPDATE-Policy: `using` allein erlaubt,
    // die Zeile anzufassen, sagt aber nichts darueber, wie sie danach aussieht.
    const { error } = await a.client
      .from('event_categories')
      .update({ event_id: eventOfB })
      .eq('id', categoryOfA)
      .select('id');

    expect(error).not.toBeNull();
  });

  it('Kategorien sind oeffentlich lesbar -- das Anmeldeformular braucht sie', async () => {
    const { data, error } = await anonClient()
      .from('event_categories')
      .select('id')
      .eq('event_id', eventOfA);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  /**
   * Der Test, fuer den der zusammengesetzte Fremdschluessel da ist.
   *
   * Die Anmeldung ist oeffentlich. Ein Client kann eine beliebige
   * Kategorie-Id mitschicken -- auch eine, die zu einem fremden Event gehoert.
   * Ohne `(event_id, category_id)` -> event_categories(event_id, id) stuende
   * danach "Firma" in der Teilnehmerliste eines Events, das diese Kategorie
   * gar nicht anbietet.
   */
  /**
   * KEIN `.select()` nach dem anonymen Insert -- das macht daraus ein
   * `INSERT ... RETURNING` und verlangt damit auch Leserechte. Die hat ein
   * anonymer Client auf `event_participants` nicht (lesen duerfen nur
   * Mitglieder der Organisation), und der Test scheiterte dann an 42501 statt
   * an dem, was er pruefen soll. Erst gemessen, dann verstanden.
   */
  it('eine anonyme Anmeldung nimmt keine Kategorie eines fremden Events', async () => {
    const { error } = await anonClient().from('event_participants').insert({
      event_id: eventOfA,
      organization_id: a.organizationId,
      email: 'schmuggel@example.com',
      category_id: categoryOfB,
    });

    // 23503 = foreign_key_violation. Auf den Code pruefen, nicht auf den Text:
    // der kommt aus Postgres und ist nicht unser Vertrag.
    expect(error?.code).toBe('23503');

    const { data } = await admin()
      .from('event_participants')
      .select('id')
      .eq('email', 'schmuggel@example.com');

    expect(data).toEqual([]);
  });

  it('eine anonyme Anmeldung nimmt die eigene Kategorie des Events an', async () => {
    const { error } = await anonClient().from('event_participants').insert({
      event_id: eventOfA,
      organization_id: a.organizationId,
      email: 'ordentlich@example.com',
      category_id: categoryOfA,
    });

    expect(error).toBeNull();

    const { data } = await admin()
      .from('event_participants')
      .select('category_id')
      .eq('email', 'ordentlich@example.com')
      .single();

    expect(data?.category_id).toBe(categoryOfA);
  });

  /**
   * Gemessen, nicht angenommen: `restrict` auf category_id und `cascade` vom
   * Event koennten sich in die Quere kommen -- loescht Postgres beim Entfernen
   * des Events zuerst die Kategorien, schlaegt `restrict` zu und das Event
   * waere unloeschbar. Tut es nicht; die Anmeldungen gehen zuerst.
   */
  it('eine Kategorie mit Anmeldungen laesst sich nicht loeschen', async () => {
    const { error } = await a.client
      .from('event_categories')
      .delete()
      .eq('id', categoryOfA)
      .select('id');

    expect(error).not.toBeNull();
  });

  it('das Event laesst sich trotzdem loeschen, samt Kategorien und Anmeldungen', async () => {
    const eventToDelete = await createEvent(a, 'Event zum Loeschen');

    const { data: category } = await a.client
      .from('event_categories')
      .insert({ event_id: eventToDelete, label: 'mit Begleitung' })
      .select('id')
      .single();

    await anonClient().from('event_participants').insert({
      event_id: eventToDelete,
      organization_id: a.organizationId,
      email: 'mitkategorie@example.com',
      category_id: category!.id,
    });

    const { error } = await a.client
      .from('events')
      .delete()
      .eq('id', eventToDelete)
      .select('id');

    expect(error).toBeNull();

    const { data: reste } = await admin()
      .from('event_categories')
      .select('id')
      .eq('event_id', eventToDelete);

    expect(reste).toEqual([]);
  });
});

describe('Storage: Bilder gehoeren der Organisation', () => {
  const BUCKET = 'event-images';
  // Kleinstes gueltiges PNG -- der Bucket laesst nur Bild-Mimetypes zu.
  const png = () =>
    new Blob(
      [
        Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
          'base64'
        ),
      ],
      { type: 'image/png' }
    );

  it('A laedt nichts in den Ordner von B', async () => {
    const { error } = await a.client.storage
      .from(BUCKET)
      .upload(`${b.organizationId}/fremd.png`, png(), {
        contentType: 'image/png',
      });

    expect(error).toBeTruthy();
  });

  it('A laedt in den eigenen Organisationsordner', async () => {
    const path = `${a.organizationId}/eigen-${Date.now()}.png`;

    const { error } = await a.client.storage
      .from(BUCKET)
      .upload(path, png(), { contentType: 'image/png' });

    expect(error).toBeNull();

    await admin().storage.from(BUCKET).remove([path]);
  });

  it('A laedt nichts in einen Ordner mit der eigenen Nutzer-ID', async () => {
    // Bis zum Zusammenziehen der Uebergangs-Policy war das erlaubt. Der Test
    // haelt fest, dass der Pfad jetzt ausschliesslich an der Organisation
    // haengt -- sonst waechst wieder ein zweiter Ablageort heran.
    const { error } = await a.client.storage
      .from(BUCKET)
      .upload(`${a.userId}/nutzerordner.png`, png(), {
        contentType: 'image/png',
      });

    expect(error).toBeTruthy();
  });

  it('A loescht keine Datei im Ordner von B', async () => {
    // Datei mit Besitzerrechten anlegen, damit sie sicher existiert.
    const path = `${b.organizationId}/von-b-${Date.now()}.png`;
    await admin()
      .storage.from(BUCKET)
      .upload(path, png(), { contentType: 'image/png' });

    const { data } = await a.client.storage.from(BUCKET).remove([path]);

    // Die Storage-API meldet hier keinen Fehler, sie loescht nur nichts --
    // dieselbe Stille wie bei einem UPDATE ohne Treffer unter RLS.
    expect(data).toEqual([]);

    const { data: still } = await admin()
      .storage.from(BUCKET)
      .list(b.organizationId);

    expect(still?.some((f) => path.endsWith(f.name))).toBe(true);

    await admin().storage.from(BUCKET).remove([path]);
  });
});
