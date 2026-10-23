import { type SupabaseClient, createClient } from '@supabase/supabase-js';

import type { Database } from '@/types';

/**
 * Testkonten gegen den LOKALEN Stack.
 *
 * Warum gegen eine echte Datenbank und nicht gegen Mocks: geprueft werden
 * RLS-Policies. Eine gemockte Policy beweist nichts -- der ganze Wert dieser
 * Tests liegt darin, dass Postgres selbst antwortet.
 *
 * Warum Passwort-Anmeldung, obwohl die App Magic Link und Google benutzt: der
 * Test braucht ein echtes JWT fuer `auth.uid()`, und das ist der kuerzeste Weg
 * dazu. Die Anmeldeart ist fuer die Policies unerheblich.
 */

const need = (name: string): string => {
  const value = process.env[name];

  if (!value)
    throw new Error(
      `${name} fehlt. Die Tests brauchen den laufenden lokalen Stack; ` +
        'starte ihn mit `npm run db:start` und benutze `npm test` ' +
        '(das Script liest die Keys aus `supabase status`).'
    );

  return value;
};

const url = () => need('API_URL');

/** Service-Role: umgeht RLS. Nur fuer Aufbau und Aufraeumen, nie fuer Behauptungen. */
export const admin = (): SupabaseClient<Database> =>
  createClient<Database>(url(), need('SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/** Anonymer Client: der oeffentliche Zugriff, so wie ein Besucher ihn hat. */
export const anonClient = (): SupabaseClient<Database> =>
  createClient<Database>(url(), need('PUBLISHABLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export type TestAccount = {
  email: string;
  userId: string;
  organizationId: string;
  /** Client mit echtem JWT dieses Nutzers. */
  client: SupabaseClient<Database>;
};

/**
 * Legt Nutzer plus Organisation an. Die Mitgliedschaft schreibt der Trigger
 * `set_organization_user` auf `organizations` -- nicht dieser Code.
 */
export const createTestAccount = async (
  label: string
): Promise<TestAccount> => {
  const email = `rls-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'test-passwort-1234';

  const { data: created, error: createError } =
    await admin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user)
    throw new Error(`Nutzer ${label} nicht angelegt: ${createError?.message}`);

  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError)
    throw new Error(`Anmeldung ${label}: ${signInError.message}`);

  const { data: org, error: orgError } = await client.rpc(
    'create_organization',
    {
      p_name: `Org ${label}`,
    }
  );

  if (orgError || !org)
    throw new Error(`Organisation ${label}: ${orgError?.message}`);

  return {
    email,
    userId: created.user.id,
    organizationId: org.id,
    client,
  };
};

/**
 * Raeumt auf. Organisationen muessen EXPLIZIT weg: beim Loeschen eines Nutzers
 * verschwindet nur seine Mitgliedschaft, die Organisation bleibt ohne Mitglieder
 * zurueck -- eine bekannte Luecke, dokumentiert in der Migration
 * organization_user_cascade. Events haengen per Cascade an der Organisation und
 * gehen mit ihr.
 */
export const cleanup = async (accounts: TestAccount[]): Promise<void> => {
  const a = admin();

  for (const account of accounts) {
    await a.from('organizations').delete().eq('id', account.organizationId);
    await a.auth.admin.deleteUser(account.userId);
  }
};

/** Ein Event in der Organisation dieses Kontos, angelegt von ihm selbst. */
export const createEvent = async (
  account: TestAccount,
  title: string
): Promise<string> => {
  const { data, error } = await account.client
    .from('events')
    .insert({
      title,
      date: new Date('2027-01-01').toISOString(),
      organization_id: account.organizationId,
      created_by: account.userId,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(`Event "${title}": ${error?.message}`);

  return data.id;
};
