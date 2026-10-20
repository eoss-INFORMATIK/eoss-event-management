/**
 * Messages for the `error` codes the auth actions redirect with.
 *
 * Kept out of actions.ts: a 'use server' module may only export async
 * functions, so a plain object there breaks the build.
 */
export const AUTH_ERRORS: Record<string, string> = {
  invalid_email: 'Bitte eine gültige E-Mail-Adresse angeben',
  send_failed: 'Anmeldelink konnte nicht versendet werden',
  oauth_failed: 'Google-Anmeldung fehlgeschlagen',
  missing_code: 'Der Anmeldelink ist unvollständig',
  auth_failed: 'Der Anmeldelink ist abgelaufen oder ungültig',
  service_unavailable:
    'Der Anmeldedienst ist gerade nicht erreichbar. Bitte in einem Moment erneut versuchen.',
  setup_failed:
    'Dein Konto konnte nicht fertig eingerichtet werden. Bitte in einem Moment erneut versuchen.',
};
