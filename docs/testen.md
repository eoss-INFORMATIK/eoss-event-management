# Testen

**Was hier hineingehört:** was getestet wird, warum gerade das, und wie man es
ausführt. Keine Liste einzelner Testfälle — die stehen in `tests/`.

## Tests

```bash
npm test          # RLS-Tests gegen den laufenden lokalen Stack
npm run test:watch
```

**Die Tests laufen gegen eine echte Postgres-Instanz, nicht gegen Mocks.**
Geprüft werden RLS-Policies — eine gemockte Policy beweist nichts. Der lokale
Stack muss laufen (`npm run db:start`); die Keys holt das npm-Script selbst aus
`supabase status -o env`, es braucht keine eigene Konfigurationsdatei.

Was getestet wird und warum gerade das: RLS ist die Sicherheitsgrenze dieses
Projekts, und **eine kaputte Policy ist im UI unsichtbar**, bis sie jemand
ausnutzt. Das ist die einzige Fehlerklasse hier, die man beim Durchklicken nicht
findet. Komponententests kommen später und sind weniger wert.

Die Tests legen eigene Nutzer mit Passwort an (über die Admin-API) — die App
benutzt Magic Link und Google, aber für `auth.uid()` ist die Anmeldeart
unerheblich, und Passwort ist der kürzeste Weg zu einem echten JWT. Aufgeräumt
wird explizit: beim Löschen eines Nutzers verschwindet nur seine Mitgliedschaft,
die Organisation bleibt zurück (dokumentiert in der Migration
`organization_user_cascade`).

In CI läuft das als eigener Job `rls`, der den ganzen Stack in Docker hochfährt.
`verify` bleibt davon getrennt und schnell.

## Was abgedeckt ist

18 Behauptungen in `tests/rls.test.ts`, gegliedert in vier Gruppen:

| Gruppe               | Kern                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `events`             | fremdes Event nicht ändern, nicht löschen, nicht in fremder Organisation anlegen, nicht in eine fremde Organisation verschieben |
| `event_participants` | fremde Teilnehmer unsichtbar und unveränderbar, anonyme Anmeldung erlaubt, gelogene Organisation wird überschrieben             |
| Löschen              | ein gelöschter Nutzer nimmt keine Events mit                                                                                    |
| Storage              | nichts in fremde Ordner, nichts in den eigenen Nutzerordner, fremde Dateien nicht löschbar                                      |

Zwei Eigenheiten, die man beim Lesen der Tests kennen muss:

**Ein Update ohne Treffer ist unter RLS ein stilles Nichts** — kein Fehler,
keine Zeile. Die Tests behaupten deshalb `data === []` und nicht einen Fehler.
Genau deswegen prüfen die Server Actions das Ergebnis und melden „nicht gefunden
oder keine Berechtigung".

**Dasselbe gilt für die Storage-API beim Löschen**: sie meldet keinen Fehler,
sie löscht nur nichts.

Daneben zwei Dateien ohne Datenbank, die eine Regel festhalten statt einer
Policy: `tests/event-schema.test.ts` (Sponsor eingeschaltet verlangt einen
Namen) und `tests/participants-export.test.ts` — der Export schreibt einen
Namen wie `=1+1` als Text, nicht als Formel. Geprüft wird die echte Datei,
entpackt, ohne `<f>`-Element im Sheet. Gegenprobe gemacht: mit `type: 'Formula'`
auf der Namensspalte wird der Test rot.

`tests/participants-filter.test.ts` hält fest, dass der Export die ganze
gefilterte Auswahl nimmt, nicht die angezeigte Seite — mit derselben
Tabellenkonfiguration wie die Seite. Gegenprobe: mit `getRowModel()` statt
`getFilteredRowModel()` wird er rot.

## Wie neue Behauptungen entstehen

Beim Umbau wird von Hand gemessen — Impersonierung über `request.jwt.claims` in
`psql`, in Transaktionen mit `rollback`. Was sich dabei als haltbar erweist,
wird zum Test. Umgekehrt nicht: ein Test, der nie von Hand nachvollzogen wurde,
prüft meist die Implementierung statt das Verhalten.

**Beim Entfernen einer Absicherung einmal ohne sie prüfen.** Erst dann ist
belegt, was sie tatsächlich hält. So wurde nachgewiesen, dass bei den
Teilnehmern drei Schichten unabhängig greifen und nicht eine davon alles trägt.
