import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import checkFile from 'eslint-plugin-check-file';
import n from 'eslint-plugin-n';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    plugins: { 'check-file': checkFile, n },
    rules: {
      'no-console': 'warn',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      // Env vars are read and validated only in env/index.ts.
      'n/no-process-env': 'error',
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{js,ts,jsx,tsx}': 'KEBAB_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          // App Router directories may use [brackets] and (groups).
          '{app,components,features,lib,server,types}/**/!(\\[*\\]|\\(*\\))':
            'KEBAB_CASE',
        },
      ],
    },
  },
  {
    // react-hook-form and TanStack Table keep state in refs by design. The
    // React Compiler lint rules flag that as a render-time ref access, which is
    // a false positive here — not something to "fix" in our code.
    files: [
      'features/*/components/*-form.tsx',
      'features/participants/components/participants-table/**',
    ],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    // Tests lesen die Variablen des lokalen Supabase-Stacks (API_URL,
    // SERVICE_ROLE_KEY) direkt aus der Umgebung. Sie gehoeren bewusst NICHT in
    // env/index.ts -- sonst braeuchte die App sie zum Starten, obwohl sie nur
    // in einer lokalen Entwickler-Shell existieren.
    files: ['tests/**', 'scripts/**'],
    rules: { 'n/no-process-env': 'off', 'no-console': 'off' },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'supabase/**',
  ]),
]);

export default eslintConfig;
