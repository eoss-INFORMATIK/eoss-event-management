import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Tests laufen gegen den LOKALEN Supabase-Stack, nicht gegen Mocks.
 *
 * Das ist Absicht: geprueft werden RLS-Policies, und eine gemockte Policy
 * beweist nichts. Die Keys kommen aus `supabase status -o env`, siehe das
 * npm-Script `test`.
 *
 * environment: 'node' -- hier wird keine Komponente gerendert, hier wird eine
 * Datenbank befragt.
 */
export default defineConfig({
  test: {
    environment: 'node',
    // Die Tests teilen sich eine Datenbank und legen Nutzer an. Parallel liefen
    // sie sich ins Gehege.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: { '@': resolve(import.meta.dirname, '.') },
  },
});
