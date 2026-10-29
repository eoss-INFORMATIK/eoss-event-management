# Entscheidungen

**Was hier hineingehört:** jede Entscheidung, die Einfluss auf die Arbeit hat —
eine Zeile, Stichwort zuerst, mit Verweis auf die ausführliche Begründung.

**Warum es diese Datei gibt:** die Begründungen stehen in den
Pull-Request-Beschreibungen, und die liest niemand, der neu dazukommt. Ein Agent
sieht das Repo, nicht die PR-Historie. Ohne diesen Feed wären die Entscheidungen
praktisch verloren — und mehrere stehen ohnehin in keinem PR, weil sie keine
Codeänderung hatten.

**Wie man sie benutzt:** überfliegen, die zwei oder drei Stichworte heraussuchen,
die die aktuelle Aufgabe betreffen, und nur dort nachlesen. Neueste oben.
Anhängen, nie umschreiben — eine überholte Entscheidung bekommt eine neue Zeile,
die auf die alte verweist.

## 2026-10

- **E-Mail steht vorne, in Tabelle und Export.** Sie identifiziert die Anmeldung
  und ist immer gesetzt, der Name ist optional. Ausgelöst durch einen Test: die
  macOS-Vorschau hört an der ersten Zeile mit leerer erster Spalte auf zu lesen
  und zeigte 3 von 15 Teilnehmern, obwohl die Datei vollständig war. Die
  Textsuche hängt jetzt an der Spalte `email`. Test „beginnt jede Zeile mit
  einer Zelle“ in `tests/participants-export.test.ts`.
- **Teilnehmer filtern im Browser (TASK-41).** Suche, Status und Kategorie
  filtern die bereits geladenen Zeilen mit TanStack, der Export nimmt dieselbe
  Auswahl (`selectedRows`, also `getFilteredRowModel()`, nie die angezeigte
  Seite). Die Suche geht auf Name **und** E-Mail, weil der Name optional ist.
  Filteroptionen kommen aus den Anmeldungen, mit Anzahl, nicht aus den
  Kategorien des Events: eine Option ohne Treffer hilft niemandem.
  Pagination ab 51 Treffern, 50 pro Seite. Ein Button „N Teilnehmer
  exportieren“ statt Menü; eine gefilterte Datei heisst `…-auswahl-…`. Filter
  stehen nicht in der URL — nach Neuladen ist die Liste vollständig. Test:
  `tests/participants-filter.test.ts`.
- **Teilnehmerexport im Browser, als .xlsx (TASK-39).** Erzeugt aus den Zeilen
  der TanStack-Tabelle, nicht über eine Server-Route: der gefilterte Export
  (Folgetask) nimmt dann `getFilteredRowModel()` statt den Filterzustand an den
  Server zu schicken; die Daten sind beim Laden schon durch RLS gegangen. .xlsx
  statt .csv wegen **Formel-Injection** — Namen kommen aus dem öffentlichen
  Formular, jede Textzelle ist ausdrücklich `type: String`. Bibliothek
  `write-excel-file`, beim Klick nachgeladen; nicht `xlsx` (SheetJS, auf npm
  eingefroren mit bekannten Lücken), nicht `exceljs` (schwer, Node-lastig,
  ruht). Zeitstempel werden auf Zürcher Ortszeit umgerechnet, weil Excel keine
  Zeitzone kennt. Test: `tests/participants-export.test.ts`.
- **Profil Rebuild: drei Figma-Elemente fallen weg.** „Passwort ändern"
  ersatzlos — die App kennt kein Passwort, Anmeldung läuft über Magic Link und
  Google. Das Rollen-Label („Admin") erst mit den Rollen: ein Label mit genau
  einem möglichen Wert ist Dekoration. Konto- und Datenlöschung wird eine eigene
  Epic **Datenschutz**, nicht MVP — sie hängt an Aufbewahrungsfristen und an den
  Teilnehmerdaten, nicht am Profilformular. Die User Story in TASK-34 sagte
  „löschen", das Design zeigte es nirgends. _Keine Codeänderung._
- **Profil Rebuild in zwei Schritten** — Schritt 1 baut Profil- und
  Organisationsseite auf dem heutigen Modell (eine Organisation, ein Nutzer);
  Einladungen, Rollen und mehrere Organisationen pro Nutzer werden ein eigener
  Task. Grund: ohne mehrere Nutzer pro Organisation ist „die Organisation
  abonniert" eine Zusage, die niemand einlösen kann — aber mehrere
  _Organisationen pro Nutzer_ bedienen den seltensten Fall zum höchsten Preis.
  Drei Leitplanken halten den Zwischenschritt billig: Route mit Organisations-Id,
  jede Liste als Liste, `getMyOrganizationId()` als einzige Auflösung. Ausführlich
  in [`CLAUDE.md`](../CLAUDE.md).
- **`unique(user_id)` fällt mit Code zuerst**, nicht Migration zuerst — die
  Ausnahme zur Faustregel. Das Entfernen der Constraint ist ein Erweitern, aber
  `getMyOrganizationId()` wirft bei zwei Mitgliedschaften. Nicht die Migration
  ist gefährlich, sondern die erste zweite Mitgliedschaft.
  [`datenmodell.md`](./datenmodell.md)
- **Doku-Struktur** — `CLAUDE.md` enthält nur, was vor dem Handeln bekannt sein
  muss; Details in `docs/`. Notion trägt Produkt und Aufgaben, Figma das UI, das
  Repo alles, was Code bindet. Was nur in Notion steht, existiert für einen
  Agenten nicht. [#17](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/17)
- **Storage-Pfad** — Bilder unter `<organization_id>/` statt `<user-id>/`. Das
  Bild gehört zum Event und das der Organisation; im Nutzerordner wäre es nach
  dem Ausscheiden der Person unerreichbar. Umzug per Skript, weil SQL
  Storage-Objekte nicht verschieben kann. [#16](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/16), [#18](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/18)
- **Teilnehmer-Organisation** — `organization_id` per Trigger aus dem Event,
  **immer überschreibend**, plus zusammengesetzter Fremdschlüssel. Die Anmeldung
  ist öffentlich, ein Client darf die Organisation nicht bestimmen.
  [#15](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/15)
- **`organizer_id` entfernt** — Besitz liegt bei `organization_id`, Autorschaft
  bei `created_by`. Setzt zugleich die Entscheidung von 2b in Kraft: ein Event
  überlebt die Löschung der Person. [#11](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/11), [#12](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/12)
- **Policies auf Mitgliedschaft** — beide Tabellen gleichzeitig, sonst bliebe
  `organizer_id` unkündbar. Beim UPDATE mit `with check`, sonst liesse sich ein
  Event in eine fremde Organisation verschieben. [#10](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/10)
- **`rls` als erforderlicher Check** — drei Minuten pro PR gegen einen Fehler,
  der im UI unsichtbar bleibt. [#14](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/14)
- **RLS-Tests gegen eine echte Datenbank**, nicht gegen Mocks — eine gemockte
  Policy beweist nichts. [#13](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/13)
- **Kein Direktpush auf `main`** — `main` ist der Production-Branch, ein Commit
  dorthin ist ein Release. Erzwungen per Ruleset, nicht verabredet.
  [#5](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/5)
- **Typen committen aus `--linked`**, nicht aus dem lokalen Stack. Lokal ist
  Migrationen _plus Seed_, und der lokale Generator lässt
  `__InternalSupabase.PostgrestVersion` weg. [#7](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/7)
- **Seed-Helfer im Schema `seed`**, nicht in `public` — sonst behaupten die
  generierten Typen, es gäbe die Funktion auch in Produktion. [#7](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/7)
- **`organization_user` kaskadiert** auf beiden Fremdschlüsseln — eine
  Mitgliedschaft ohne Nutzer oder ohne Organisation ist sinnlos. [#6](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/6)
- **Eigenes `Surface` statt shadcns `Card`** — shadcn bleibt für interaktive
  Primitive (Dialog, Select, Popover), wo Radix echte Arbeit macht. `Card` ist
  ein Div mit fremden Layoutannahmen; sein `CardHeader` ist ein Grid und hört
  auf, neutral zu sein, sobald ein Bild hineinkommt.
- **Komponenten in die Feature-Ordner**, `components/forms` aufgelöst — ein
  Ordner, der nach technischer Art benennt, gruppiert Dinge, die sich aus
  verschiedenen Gründen ändern. In `components/` bleibt nur
  Bereichsübergreifendes.
- **Theme auf zwei Token-Ebenen** — Marke (ein Farbton `--hue-brand`) und
  Rollen. Hex wäre nicht übersichtlicher: der Build schreibt ohnehin Hex, und in
  HSL sieht man, dass zwei Farben zusammengehören. Die Ursache für abweichende
  Shades war Duplikation, nicht die Notation.
- **Entwickelt wird lokal**, nicht gegen die Produktionsdatenbank. `db push` ist
  dort nicht rückrollbar, es gibt kein `reset`, und sobald echte Teilnehmer
  registriert sind, liegen dort Personendaten. _Keine Codeänderung._
- **Preview zeigt auf die Produktionsdatenbank** — bewusst, solange dort nur
  Testdaten liegen. **Vor den ersten Kunden neu zu entscheiden**, dann braucht
  Preview ein eigenes Supabase-Projekt. _Keine Codeänderung._
- **Redirect-URLs ohne Wildcard** — `https://**/auth/confirm` hätte
  Kontoübernahme ermöglicht: das Redirect-Ziel bestimmt der Aufrufer, nicht die
  App, und nur die Allow-List verhindert, dass ein echter Anmeldelink an einen
  fremden Server geht. _Keine Codeänderung._
- **Resend als Custom SMTP ist Voraussetzung**, nicht Kosmetik — der eingebaute
  Supabase-Versand ist nach wenigen Mails pro Stunde dicht, und der Magic Link
  funktioniert dann nicht mehr. _Keine Codeänderung._
- **eoss läuft im Liefermodus** — der Lernmodus ist nach `README.learn*.md`
  ausgezogen und gilt für Projekte ohne Kunden. Erhalten bleiben Entscheidung
  vor Code, kleine Scheiben, keine stillen Entscheidungen.

## 2026-09

- **Clerk verworfen, Supabase Auth bleibt** — `auth.users` fiele als Anker weg
  (Clerk-IDs sind Strings, alle uuid-Fremdschlüssel und das Cascade-Delete
  brächen), Org-Mitgliedschaft läge im JWT statt per Lookup, und die fertige
  Auth-Phase wäre Wegwerfarbeit. Billing löst Clerk ohnehin nur halb.
  _Keine Codeänderung._
- **Bezahlmodell Fall A** — Organisationen abonnieren die App, kein Ticketing
  und damit kein Stripe Connect. Offener Punkt: der Webhook hat keine Session,
  `auth.uid()` ist null, also braucht `server/supabase/` einen dritten Client
  mit Service-Role, der nie ins Browser-Bundle darf. _Keine Codeänderung._
- **Mitgliedschaft per Lookup, nicht per JWT-Claim** — ein Claim veraltet
  zwischen zwei Anmeldungen, ein Lookup nicht. Begründung in
  [`eos-20-multi-org-setup.md`](./eos-20-multi-org-setup.md).
- **Magic Link über `token_hash`**, nicht über `{{ .ConfirmationURL }}` —
  dessen Code-Tausch braucht das PKCE-Cookie des anfordernden Browsers und
  scheitert, sobald die Mail auf einem anderen Gerät geöffnet wird.
- **Supabase statt Neon, Drizzle und next-auth** — ein Anbieter für Auth,
  Datenbank und Storage; kein ORM, SQL-Migrationen über die Supabase-CLI.
  [#2](https://github.com/eoss-INFORMATIK/eoss-event-management/pull/2)
