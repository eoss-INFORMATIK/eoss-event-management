# Lern-Track Backend

Ergänzt [`README.learn.md`](./README.learn.md) — dort steht *wie* gearbeitet
wird, hier *woran*.

**Zielbild ist nicht Backend-Entwickler.** Es ist: soviel Backend, dass ich
Frontend-Entscheidungen verantworten kann und im Gespräch mit Backend-Leuten
nicht nur zuhöre. Die Auswahl folgt deshalb einem Kriterium — **was blutet ins
Frontend durch?** Auth, Autorisierung, Datenmodell, Nebenläufigkeit, Latenz und
Fehlerform tun das. Message Queues und Infrastrukturbetrieb nicht, die fehlen
hier bewusst.

Aufbau wie im Frontend-Track: Warum für die Rolle / Können heisst / Übung /
Prüffrage. Stufe pro Block mitführen (`1 erkannt` / `2 reproduziert` /
`3 aus dem Kopf`).

---

## 1. Auth — die Mechanik

**Warum für die Rolle:** Auth ist das Thema, an dem Frontend-Leute am häufigsten
scheitern, weil es genau auf der Grenze liegt. Wer den Session-Fluss nicht
zeichnen kann, baut Login-Oberflächen auf Vermutungen.

**Können heisst:** Den Weg vom Klick auf „Anmelden" bis zur geschützten Seite
ohne Vorlage aufzeichnen — inklusive Redirect, Code-Austausch, Cookie-Setzung,
Session-Refresh. Session gegen Token abgrenzen. Cookie-Attribute benennen und
sagen, wovor jedes schützt (`httpOnly`, `SameSite`, `Secure`, Lebensdauer).
Wissen, dass ein Client-Check reine UX ist und die Entscheidung serverseitig
fällt. Erklären, warum ein Fragment in der URL (`#access_token=…`) von einem
serverseitigen Flow nicht gelesen werden kann — der Fehler, der die Magic Links
in diesem Projekt gekostet hat.

**Übung:** Im neuen Projekt Auth von Hand aufsetzen, ohne Copy-Paste aus dem
alten. Der Flow wird vorher gezeichnet, dann gebaut.

**Prüffrage:** *An welcher Stelle in diesem Fluss existiert die Session noch
nicht — und was passiert, wenn der Nutzer dort den Tab schliesst?*

## 2. Autorisierung

**Warum für die Rolle:** Der Unterschied zwischen „wer bist du" und „darfst du
das" ist die Stelle, an der Multi-Tenancy entweder trägt oder leckt. Und es ist
die Entscheidung, die man nicht nachträglich einziehen kann.

**Können heisst:** Eine Policy-Grenze in der Datenbank als Wahrheit begreifen
und den Check in der Anwendung als *Fehlermeldung* — nicht als Schutz.
Begründen, warum Mitgliedschaft per Lookup und nicht per JWT-Claim steht (und
wann die Gegenrichtung besser ist). Policy-Rekursion erkennen und mit einer
parameterlosen Definer-Funktion auflösen, inklusive der Begründung, warum ein
User-ID-Parameter dort ein Loch wäre. Eine neue Tabelle ohne aktive Policy als
Bug behandeln.

**Übung:** Im neuen Projekt eine zweite Mandantenebene einziehen und *vorher*
schreiben, welche Policy welchen Angriff verhindert. Dann versuchen, die eigenen
Policies mit einem zweiten Testkonto zu brechen.

**Prüffrage:** *Du entfernst diesen Check aus der Server Action. Welche Daten
sieht ein Angreifer jetzt — und welche nicht, und warum nicht?*

## 3. Datenmodell und Migrationen

**Warum für die Rolle:** Das Schema ist die langlebigste Entscheidung im ganzen
Projekt. Frontend-Arbeit, die gegen ein schlechtes Schema ankämpft, ist
dauerhaft teuer.

**Können heisst:** Das Prinzip **unmöglich statt unbequem** anwenden — ein
Trigger macht es bequem, ein Fremdschlüssel macht es unmöglich falsch. Constraints
vor Anwendungslogik. Eindeutigkeiten bewusst setzen und wissen, welche eine
Schritt-1-Krücke ist und wieder verschwindet. Migrationen nur vorwärts, jede
einzeln ausführbar. Kaskadierendes Löschen bewusst entscheiden, nicht erben.

**Übung:** Ein Modell mit drei Tabellen entwerfen, bevor eine Zeile SQL
entsteht — als Skizze mit Schlüsseln, Eindeutigkeiten und Löschverhalten. Dann
in **drei** Migrationen umsetzen, nicht in einer.

**Prüffrage:** *Welcher ungültige Zustand ist in diesem Schema noch möglich —
und soll er möglich bleiben?*

## 4. Nebenläufigkeit

**Warum für die Rolle:** Der Bereich, in dem Code funktioniert, bis er
Nutzer hat. Und der Bereich, der im Frontend als „manchmal doppelt" oder
„Platz war doch frei" ankommt.

**Können heisst:** Ein Rennen beschreiben *und* benennen. Verstehen, warum
„lesen, prüfen, schreiben" in der Anwendung nicht hält und ein Constraint
schon. Transaktionsgrenzen erkennen. Idempotenz als Anforderung behandeln,
sobald etwas doppelt zugestellt werden kann — Webhooks und
Mehrfach-Klicks sind derselbe Fall. Wissen, dass Retry ohne Idempotenz eine
Fehlerverdopplung ist.

**Übung:** Der Wartelisten-Fall aus diesem Projekt, im neuen Projekt nochmal und
diesmal von mir entschieden: Kapazität als DB-Constraint oder als Prüfung im
Code. Beide Antworten sind vertretbar, die Begründung ist die Leistung. Danach
zwei gleichzeitige Anmeldungen auf den letzten Platz provozieren.

**Prüffrage:** *Zwei Requests sind gleichzeitig zwischen Zeile 3 und Zeile 4.
Was steht danach in der Datenbank?*

## 5. Serverseitige Grenzen und Geheimnisse

**Warum für die Rolle:** Ein Schlüssel im Browser-Bundle ist der Fehler, der
Projekte beendet. Die Grenze zu kennen ist nicht optional.

**Können heisst:** Jederzeit sagen, was im Client-Bundle landet und was nicht,
und es nachprüfen statt es zu glauben. Einen Service-Role-Client als etwas
behandeln, das Policies umgeht und darum nie in Client-Code importiert werden
darf — der Punkt, der in diesem Projekt für den Stripe-Webhook noch offen ist.
Env-Variablen validiert und getypt an einer Stelle halten.

**Übung:** Nach einem Feature das Produktions-Bundle nach den eigenen
Variablennamen durchsuchen. Einmal selbst gesehen zu haben, was durchsickert,
ersetzt jede Regel.

**Prüffrage:** *Dieser Code läuft ohne Session. Als wer fragt er die Datenbank —
und wer hat das entschieden?*

## 6. Performance von der Datenseite

**Warum für die Rolle:** Die Hälfte der langsamen Frontends ist langsames
Backend, und die Ursache liegt oft in einer Abfrage, die das Frontend so
angefordert hat.

**Können heisst:** N+1 erkennen, auch wenn es als Schleife über Komponenten
getarnt ist. Einen Index begründen, statt ihn zu raten — und wissen, dass ein
Index beim Schreiben Geld kostet. Payload-Form als Frontend-Entscheidung
begreifen: welche Spalten, welche Verschachtelung, wie viele Zeilen. Wissen,
welche Cache-Ebene gerade antwortet.

**Übung:** Die Abfragen einer Listenseite einmal zählen und protokollieren.
Dann so umbauen, dass die Zahl unabhängig von der Anzahl Zeilen konstant ist.

**Prüffrage:** *Diese Seite hat statt 10 jetzt 10'000 Einträge. Was bricht
zuerst?*

## 7. Fehler, Logs, Beobachtbarkeit

**Warum für die Rolle:** Die Fehlerform ist eine API, und das Frontend lebt
davon. Gleichzeitig ist es die Stelle, an der versehentlich Interna an Nutzer
geraten.

**Können heisst:** Erwartete Fehler als Rückgabewert, unerwartete als Ausnahme,
und die Grenze bewusst ziehen. Trennen, was der Nutzer sieht und was ich
aufzeichne — ohne Datenbankdetails nach vorne durchzulassen. Statt einer
Sammelmeldung echte, unterscheidbare Fehler liefern (in diesem Projekt bereits
nachgeholt). Entscheiden, was überhaupt protokolliert wird — und dabei keine
personenbezogenen Daten.

**Übung:** Für ein Feature vorher festlegen: welche Fehlerfälle existieren, was
der Nutzer je Fall sieht, was im Log landet. Dann jeden Fall provozieren.

**Prüffrage:** *Dieser Fehler erreicht einen Nutzer. Weiss er danach, was er
tun soll?*

## 8. Integrationen von aussen

**Warum für die Rolle:** Zahlung und E-Mail sind die zwei Integrationen, die
fast jedes Produkt braucht, und beide haben Eigenheiten, die man einmal gelernt
haben muss.

**Können heisst:** Einen Webhook absichern — Signatur prüfen, Idempotenz,
schnell antworten und die Arbeit danach tun, und vor allem: er hat **keine
Session**, also auch keine Identität aus einem Cookie. Transaktionsmails von
Auth-Mails trennen und wissen, wer welche verschickt. Verstehen, wovon
Zustellbarkeit abhängt (Absenderdomain, SPF/DKIM) — sonst debuggt man Code,
während das Problem im DNS liegt.

**Übung:** Ein Abo-Modell anbinden: Checkout, Portal, Webhook, eigene Tabelle.
Vorher aufschreiben, welche Zustände das Abo haben kann und was die App in
jedem tut. Der Zustandsautomat ist die Arbeit, der API-Aufruf ist Mechanik.

**Prüffrage:** *Derselbe Webhook kommt zweimal an. Was passiert beim zweiten
Mal?*

---

## Reihenfolge

1. **Block 1 und 2** — Auth und Autorisierung. Nicht nachrüstbar, und der
   grösste Hebel für die eigene Glaubwürdigkeit.
2. **Block 3** — Datenmodell, parallel dazu, weil Policies ohne Schema nicht
   gehen.
3. **Block 5** — Grenzen und Geheimnisse, sobald der erste serverseitige
   Sonderfall auftritt.
4. **Block 4** — Nebenläufigkeit, am Wartelisten-Fall. Bewusst als
   Lernaufgabe gewählt, weil beide Antworten vertretbar sind.
5. **Block 7, 6, 8** — Fehlerform, Datenperformance, Integrationen, wenn das
   Produkt echte Nutzung hat.

## Was ein gutes Übungsprojekt braucht

Damit diese Blöcke überhaupt vorkommen, muss das neue Projekt ein paar
Eigenschaften haben — unabhängig vom Thema:

- **Echte Anmeldung**, nicht nur ein Passwortfeld (Block 1)
- **Mehrere Nutzer, die sich Daten teilen** — sonst fehlt Autorisierung ganz (Block 2)
- **Mindestens eine knappe Ressource**: Plätze, Termine, Vorräte (Block 4)
- **Eine öffentliche Oberfläche**, die Fremde ohne Konto benutzen (Block 2, 5)
- **Eine Liste, die gross werden kann** (Block 6)
- **Ein Formular, das wirklich wehtut**, wenn es falsche Daten durchlässt (Block 3, 7)

Ein Projekt, das nur mir selbst Daten zeigt, übt nichts davon.
