# Deployment und Zusammenarbeit

**Was hier hineingehört:** wie Code nach Produktion kommt, welche Tore es dabei
gibt, und was sich ändert, sobald mehr als eine Person am Projekt arbeitet.

## Branches und Deployment

**`main` ist der Production-Branch — ein Commit dorthin ist ein Release.** Vercel
deployt jeden Push auf `main` nach Produktion. Deshalb:

- **Nie direkt auf `main` committen.** Jede Änderung über einen Branch und einen
  Pull Request, auch Einzeiler. Ein Ruleset auf GitHub erzwingt das.
- Branchnamen `<typ>/<kurz>`: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`.
- Gemerged wird erst, wenn **beide Checks grün** sind: der Vercel-Preview-Build
  und `CI / verify`.
- Keine Review-Pflicht — Sh arbeitet allein, und eine Pflicht, die man selbst
  abnickt, ist Zeremonie.

**Funktionsregion `fra1`** (Frankfurt), gesetzt in `vercel.json`. Die Datenbank
steht in Zürich; ohne Angabe liefen die Funktionen in Washington und jede
Abfrage kostete ~100 ms. Prüfen: der Header `x-vercel-id` einer dynamischen
Seite beginnt mit `fra1::fra1::`.

### Was welcher Check abdeckt

|                    | Vercel   | `verify`                | `rls`          | `migration` |
| ------------------ | -------- | ----------------------- | -------------- | ----------- |
| Build              | ✓        | — (nicht doppelt)       | —              | —           |
| TypeScript         | ✓        | ✓ (`npm run typecheck`) | —              | —           |
| ESLint             | **nein** | ✓ (`npm run lint`)      | —              | —           |
| RLS-Policies       | nein     | nein                    | ✓ (`npm test`) | —           |
| Migration in Prod? | nein     | nein                    | nein           | ✓           |

Alle sind im Ruleset **erforderlich**. `rls` faehrt den Supabase-Stack in
Docker hoch und braucht ein paar Minuten; das ist der Preis dafuer, dass eine
kaputte Policy nicht nach Produktion kommt -- die einzige Fehlerklasse hier, die
im UI unsichtbar bleibt, bis sie jemand ausnutzt.

**`migration` vergleicht die Migrationen des Branch mit denen, die in
Produktion angewendet sind**, und blockiert den Merge, solange eine fehlt. Er
liest die Supabase-Management-API mit dem Secret `SUPABASE_ACCESS_TOKEN` --
nur Token, kein Datenbankpasswort. Laeuft nur auf Pull Requests.

Beim **Verschaerfen und Entfernen** gehoert die Migration absichtlich erst nach
dem Merge nach Produktion. Dort setzt man das Label **`migration-nach-merge`**
an den Pull Request, dann wird der Job uebersprungen. Zwei Dinge dazu, beide
gemessen an PR #43:

- **Das Label wirkt erst beim naechsten Push.** `on: pull_request` horcht
  standardmaessig nicht auf das Setzen von Labels, der Check bleibt also auf
  seinem alten Ergebnis stehen. Label setzen, dann committen.
- **Ein uebersprungener Job gilt als erfuellt**, auch wenn der Check
  erforderlich ist -- er blockiert den Merge nicht.

`next build` lintet seit Next 15 nicht mehr mit — ein Lint-Fehler würde ohne den
CI-Workflow unbemerkt nach Produktion gehen.

### Einen Check erforderlich machen: vorher offene PRs schliessen

Ein erforderlicher Status-Check wirkt **sofort auf alle offenen Pull Requests**.
Branches, die aelter sind als der Workflow, definieren den Job nicht -- der
Check meldet dort also nie etwas, und der PR wartet dauerhaft auf einen Status,
der nicht kommt. Das ist kein Fehler, sondern das erwartete Verhalten, und es
sieht wie ein kaputter PR aus.

Beim Einfuehren von `rls` war genau ein PR betroffen. Reihenfolge deshalb immer:
erst offene PRs mergen oder schliessen, dann den Check im Ruleset ergaenzen.

### Pre-commit-Hook

`husky` + `lint-staged` formatieren und linten **nur die gestageten Dateien**.
Bewusst keine Tests und kein Typecheck im Hook: der Hook muss unter zwei
Sekunden bleiben, sonst wird er mit `--no-verify` umgangen und ist Theater. Und
er schützt ohnehin nur den lokalen Rechner — die Grenze, die wirklich hält, ist
der Status-Check am Pull Request, weil der serverseitig erzwungen wird.

## Migrationen nach Produktion

Der Merge deployt **nur Code**. Migrationen gehen von Hand:

```bash
npm run db:check   # welche Migration liegt wo
npm run db:push    # nicht rueckrollbar
```

Die Reihenfolge entscheidet, ob es bricht:

> **Erweitern heisst Migration zuerst. Verschärfen und Entfernen heissen Code
> zuerst.**

Beim Erweitern verträgt die laufende alte Version die neue Spalte. Beim
Verschärfen bricht sie daran, der Code muss also vorher live sein. Lässt sich
keine Reihenfolge finden, die beide Codeversionen verträgt, braucht es einen
Übergangszustand — so bei der Storage-Policy, wo alte Policy und neuer Code sich
gegenseitig ausschlossen.

## Fallstricke

- **Beweis fuer „Migration ist deployed" ist `npm run db:check`
  (`supabase migration list`), nicht `types/database.ts`.** So blieb
  `create_organization` einmal lokal haengen, waehrend die Typen sie auswiesen.

- **Committet wird, was `npm run db:types:hosted` (`--linked`) erzeugt.**
  `npm run db:types` (lokal) ist fuer die Entwicklung einer noch nicht
  gepushten Migration da und gehoert nicht in einen Commit. Zwei Gruende:
  1. Lokal ist _Migrationen plus Seed_. Alles im Schema `public` landet in den
     Typen — eine Hilfsfunktion aus `seed.sql` wuerde dort behaupten, sie gaebe
     es auch in Produktion. Deshalb liegt der Seed-Helfer im Schema `seed`,
     das `[api] schemas` nicht exponiert.
  2. Der lokale Generator laesst `__InternalSupabase.PostgrestVersion` weg, das
     der gehostete setzt. Mit der lokalen Fassung zu committen verliert diese
     Angabe.

  Reihenfolge bei einer Schemaaenderung: Migration schreiben → lokal anwenden →
  `db:types` zum Entwickeln → `db:push` → `db:types:hosted` → **die** Fassung
  committen.

## Mit mehreren Beteiligten

Was heute trägt, und zwar durch Mechanik statt Disziplin:

- **Drei erzwungene Checks.** Niemand merged an Lint, Typen oder RLS vorbei,
  Agent oder Mensch.
- **`CLAUDE.md` liest jeder Agent automatisch** — die Konventionen sind nicht
  Folklore.
- **Der `rls`-Job ist unbemerkt auch die Migrations-Reihenfolgenprüfung.** Er
  fährt den Stack von null hoch und spielt alle Migrationen ab. Zwei Personen,
  die unabhängig Migrationen schreiben, können textuell konfliktfrei mergen und
  semantisch kollidieren — dieser Job fängt das.

Was zuerst bricht, in dieser Reihenfolge:

1. **Preview zeigt auf die Produktionsdatenbank.** Mit einer Person tragbar, mit
   drei nicht: zwei Previews schreiben gleichzeitig in Kundendaten. Dann braucht
   es ein eigenes Supabase-Projekt für Preview.
2. **Wer pusht Migrationen?** Heute von Hand und lokal. Mit mehreren Beteiligten
   muss das **ein** Tor werden — CI bei Merge auf `main`, niemand sonst. Sonst
   entscheidet, wer zuerst tippt.
3. **Aufgabenbesitz.** Zwei Agenten auf derselben Notion-Aufgabe ist ein
   Prozessproblem. Der Status in Notion ist das Schloss und muss _vor_ dem Start
   gesetzt werden.
4. **Design.** „Figma ist die Quelle" bleibt Dekoration, solange die Tokens nicht
   verbunden sind. `app/globals.css` hat die Zwei-Ebenen-Struktur dafür; ohne
   Verbindung baut jeder sein eigenes Grau.

**Nicht ohne getrennte Worktrees:** zwei Agenten, die denselben lokalen
Supabase-Stack und dieselbe `.env.local` teilen, treten sich in genau der Art
unsichtbaren Zustand auf die Füsse, die hier schon zweimal einen halben Tag
gekostet hat.
