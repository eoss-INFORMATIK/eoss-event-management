# Lern-Track Frontend

Ergänzt [`README.learn.md`](./README.learn.md) — dort steht *wie* gearbeitet
wird, hier *woran*.

**Zielbild:** Frontend-Architekt, der die Brücke zu UX und Product schlägt und
AI-Workflows in Frontend-Teams einführen kann. Das ist nicht „React können".
Das ist: begründen können, warum eine Oberfläche so geschnitten ist, und das
gegenüber Design, Product und dem eigenen Team vertreten.

## Wie dieses Dokument benutzt wird

Jeder Block hat vier Teile:

- **Warum für die Rolle** — wofür ich das brauche, nicht nur dass es existiert
- **Können heisst** — beobachtbar, nicht „verstanden haben"
- **Übung** — am laufenden Projekt, nicht im Tutorial
- **Prüffrage** — die Frage, die der Agent mir stellt, bevor er etwas zeigt

Hinter jedem Block führe ich die Stufe mit: `1 erkannt` / `2 reproduziert` /
`3 aus dem Kopf`. Stand: alles unmarkiert = nie geprüft.

---

## 1. Rendering- und Datenmodell

**Warum für die Rolle:** Das ist die Architekturentscheidung im modernen
Frontend. Wo Daten geholt werden, entscheidet über Ladezeit, Komplexität und
darüber, wie viel Zustand überhaupt im Client existieren muss. Wer das nicht
begründen kann, ist kein Architekt, sondern Komponentenschreiber.

**Können heisst:** Für jede Route sagen können, was auf dem Server rendert, was
im Client lebt und warum; einen Request-Wasserfall im Netzwerk-Tab erkennen und
auflösen; erklären, wann Streaming/Suspense etwas bringt und wann es nur
Komplexität ist; Caching- und Revalidierungsverhalten benennen, statt zu hoffen.

**Übung:** Eine bestehende Seite vor dem Umbau auf einer halben Seite
beschreiben — Server/Client-Grenze, jede Datenquelle, jeder Ladezustand. Dann
umbauen und vergleichen, wo ich falsch lag.

**Prüffrage:** *Welcher Teil dieser Seite braucht den Browser — und was bleibt
übrig, wenn ich diesen Teil isoliere?*

## 2. Komponentenarchitektur und Design System

**Warum für die Rolle:** Die Abstraktion, die ich wähle, bestimmt, was das Team
ein Jahr später noch ändern kann. Falsche Abstraktionen sind teurer als
Duplikation — das ist eine Architektenentscheidung, keine Geschmacksfrage.

**Können heisst:** Komposition gegen Props-Explosion abwägen; Varianten über
Tokens statt über Boolean-Flags lösen; erkennen, wann drei ähnliche Komponenten
*nicht* zusammengeführt werden sollten; begründen, warum shadcn als
Copy-in-Code und nicht als Dependency funktioniert — und was das für Upgrades
bedeutet.

**Übung:** Eine Komponente, die mehr als vier Boolean-Props hat, neu schneiden.
Vorher aufschreiben, welche Aufrufstellen sich ändern.

**Prüffrage:** *Welche zwei dieser drei Komponenten gehören wirklich zusammen —
und woran erkennst du es, ohne auf die Optik zu schauen?*

## 3. Zustand und Datenfluss

**Warum für die Rolle:** Die meisten Frontend-Bugs sind Zustand am falschen Ort.
Vier Sorten Zustand sauber zu trennen ist das, was gute von mittelmässigen
Frontends unterscheidet.

**Können heisst:** Server-State, Client-State, **URL-State** und Formular-State
auseinanderhalten und jeweils begründen; wissen, dass Filter, Sortierung,
Pagination und offene Dialoge fast immer in die URL gehören (teilbar,
zurück-fähig, serverlesbar); Zustand so weit nach oben ziehen wie nötig und
nicht weiter.

**Übung:** Eine gefilterte Liste vollständig auf URL-State umbauen. Akzeptanz:
Link kopieren, in neuem Tab öffnen, identische Ansicht; Zurück-Button
funktioniert.

**Prüffrage:** *Wenn jemand diesen Bildschirm per Link teilt — was geht
verloren?*

## 4. Formulare und Validierung

**Warum für die Rolle:** Formulare sind der Ort, an dem Frontend, Backend,
Typen und UX zusammenstossen. Wer hier ein sauberes Muster etabliert, spart dem
Team dauerhaft Arbeit.

**Können heisst:** Ein Schema als einzige Wahrheit für Client und Server;
wissen, dass Client-Validierung reine UX ist und die Server-Grenze immer
nochmal validiert; Fehler als Daten zurückgeben statt werfen; optimistische
Updates inklusive Rückabwicklung; Fehler am Feld statt in einer Sammelmeldung.

**Übung:** Ein Formular so umbauen, dass es ohne JavaScript funktioniert. Danach
JS wieder aktivieren und die Verbesserungen benennen, die *nur* mit JS gehen.

**Prüffrage:** *Welche dieser Validierungen darf der Client allein entscheiden —
und welche nie?*

## 5. Accessibility

**Warum für die Rolle:** Das ist der härteste Teil der Brücke zu UX, und in
Europa zunehmend regulatorisch. Ein Architekt, der Tastaturbedienung und
Fokusführung nicht beurteilen kann, wird im Designreview nicht ernst genommen.

**Können heisst:** Jede Oberfläche vollständig mit der Tastatur bedienen; Fokus
beim Öffnen und Schliessen von Dialogen bewusst setzen; semantisches HTML vor
ARIA (ARIA ist das letzte Mittel, nicht das erste); Formularfehler mit dem Feld
verknüpfen; Live-Regionen für asynchrone Ergebnisse; Kontrast und
Zielgrössen beurteilen, statt sie zu erraten.

**Übung:** Eine Woche lang eine Route pro Session nur mit der Tastatur
durchlaufen und jeden Bruch notieren, bevor etwas repariert wird.

**Prüffrage:** *Wo landet der Fokus, nachdem dieser Dialog sich schliesst — und
warum dort?*

## 6. Performance aus Frontend-Sicht

**Warum für die Rolle:** Performance ist die Disziplin, in der Frontend
messbar Geld bewegt. Sie ist auch der Hebel, mit dem sich Architekturarbeit
gegenüber Product begründen lässt.

**Können heisst:** LCP, INP und CLS benennen, je eine typische Ursache und je
eine Gegenmassnahme; vor der Optimierung messen; Bundle-Wachstum einer
Dependency zuordnen; Bilder und Fonts als häufigste echte Ursachen behandeln;
unterscheiden, was Labordaten (Lighthouse) und was Felddaten sagen.

**Übung:** Vor einem Feature eine Messung festhalten, danach dieselbe. Was sich
nicht messen lässt, wird nicht als Verbesserung verkauft.

**Prüffrage:** *Du vermutest, es liegt an X. Welche Messung würde dich vom
Gegenteil überzeugen?*

## 7. UX-Handwerk

**Warum für die Rolle:** Das ist die Brücke selbst. Wer Zustände und Mikro-Copy
beherrscht, diskutiert mit Design auf Augenhöhe statt Mockups abzuarbeiten.

**Können heisst:** **Vier Zustände für jede Ansicht** — leer, lädt, Fehler,
gefüllt — und zusätzlich den teilweise-gefüllten Fall. Fehlermeldungen, die
sagen, was zu tun ist, statt was kaputt ist. Bewusst gesetzte Wartemomente
(Skeleton vs. Spinner vs. gar nichts). Animation als Orientierungshilfe, nicht
als Dekoration. Und: das Problem hinter dem Mockup erkennen.

**Übung:** Für jede Liste im Projekt den Leerzustand bewusst gestalten — inklusive
der Frage, was der Nutzer dort als Nächstes tun soll.

**Prüffrage:** *Was sieht jemand, der dieses Konto heute zum ersten Mal öffnet?*

## 8. Product-Anteil

**Warum für die Rolle:** Das ist die Hälfte, die aus einem Senior-Entwickler
einen Architekten macht — und die ich laut `docs/EOS-20_Multi_Org_Setup` schon
kann. Hier geht es um Ausbau, nicht um Aufbau.

**Können heisst:** Problem vor Lösung formulieren; User Stories mit
Akzeptanzkriterien, die prüfbar sind; eine **explizite Abgrenzung** (was
bewusst *nicht* dazugehört); pro Story eine Metrik oder ein beobachtbares
Ergebnis; einen Schnitt in Schritt 1 / Schritt 2 begründen, der beide Schritte
lauffähig lässt.

**Übung:** Jedes Feature bekommt ein Dokument nach dem Muster von EOS-20 —
Stories, Abgrenzung, technische Grundlagen, Entscheidungen mit
Problem/Entscheidung/Wirkung. Das Dokument steht, bevor Code entsteht.

**Prüffrage:** *Woran merkst du in drei Monaten, dass dieses Feature gewirkt
hat?*

## 9. Testen, soweit es sich lohnt

**Warum für die Rolle:** Ein Architekt verantwortet, wie viel Test genug ist.
Zu wenig ist bekannt teuer, zu viel bremst das Team und wird dann abgeschaltet.

**Können heisst:** Typen als billigste Absicherung begreifen; Verhalten testen,
nicht Implementierung; einen End-to-End-Pfad pro kritischem Flow statt
hundert Unit-Tests auf Komponenten; begründen, was *nicht* getestet wird.

**Übung:** Einen Test schreiben, der beim nächsten Refactoring *nicht* bricht,
obwohl sich das Markup ändert.

**Prüffrage:** *Welcher Fehler dieses Features würde einem Nutzer echten Ärger
machen — und fängt ihn irgendein Test?*

## 10. AI-Workflows in Frontend-Teams

**Warum für die Rolle:** Das ist der Unterschied zwischen „benutzt AI" und
„führt AI ein". Hier liegt mein Differenzierungsmerkmal — und es ist
unterrichtbar, weil ich den Weg selbst gehe, inklusive der Fehler.

**Können heisst:**

- **Konventionen maschinenlesbar machen.** Eine `CLAUDE.md`, die ein Agent
  tatsächlich befolgt: Muster, Verbote, Gotchas — nicht Prosa über die Firma.
- **Die Delegationsgrenze als Teamregel.** Was ein Team delegiert und was nicht
  (Architekturentscheidungen, Auth-Grenzen, Migrationen, Nebenläufigkeit), und
  warum das nicht Misstrauen ist, sondern Risikoverteilung.
- **Die Rückkopplungsschleife bauen.** Ein Agent ist nur so gut wie das Signal,
  das er bekommt: Lint, Typecheck, Tests, ein Build, der schnell fehlschlägt.
  Teams ohne diese Schleife bekommen plausiblen Müll.
- **Wiederholbar machen.** Wiederkehrende Aufgaben als Skill, Slash-Command
  oder Subagent festhalten, statt denselben Prompt neu zu erfinden.
- **Design → Code als Vertrag.** Tokens und Komponentenbindung (Figma MCP, Code
  Connect) als die Stelle, an der Design und Code sich treffen — nicht
  Screenshots.
- **Review-Kultur.** Die Frage im Diff ist nicht „läuft es", sondern „hätte ich
  das so geschrieben, und kann ich es morgen ändern".
- **Onboarding umdrehen.** Der Agent liest neuen Leuten die Codebasis vor,
  bevor er für sie schreibt.
- **Das Skill-Problem ansprechen.** Ein Team, das alles delegiert, verliert die
  Fähigkeit zu beurteilen. [`README.learn.md`](./README.learn.md) ist die
  Antwort, die ich an mir selbst teste — und damit das Einzige, worüber ich mit
  Erfahrung reden kann statt mit Meinung.

**Übung, in dieser Reihenfolge:**

1. Für das neue Projekt eine `CLAUDE.md` schreiben, bevor Code entsteht. Nach
   zwei Wochen prüfen, welche Regeln der Agent tatsächlich eingehalten hat —
   die ignorierten waren schlecht formuliert, nicht missachtet.
2. Eine wiederkehrende Aufgabe als Slash-Command oder Skill festhalten.
3. Eine Session komplett nach [`README.learn.md`](./README.learn.md) fahren und
   festhalten, wie viel langsamer sie war. Diese Zahl ist das Argument, mit dem
   ich später in einem Team auftrete.
4. Einen Agenten-PR reviewen und jede Änderung markieren, die ich *nicht* selbst
   so geschrieben hätte. Das Verhältnis ist meine Qualitätsmetrik.

**Prüffrage:** *Du führst das in einem Team mit fünf Leuten ein. Welche Regel
wird als Erstes gebrochen — und was sagt dir das über die Regel?*

---

## Reihenfolge

Nicht alles gleichzeitig. Vorschlag für die ersten Monate im neuen Projekt:

1. **Block 1 und 3** — Rendering-Modell und Zustand. Alles andere baut darauf auf.
2. **Block 7 und 8** — UX-Zustände und Product-Schnitt. Billig zu üben, sofort
   sichtbar, und die Brücke, die mich von anderen Frontend-Leuten unterscheidet.
3. **Block 5** — Accessibility. Früh, weil Nachrüsten teurer ist als Einbauen.
4. **Block 2, 4, 6** — Komponentenarchitektur, Formulare, Performance.
5. **Block 10** — AI-Workflows, laufend und parallel. Es ist das Thema, über
   das ich am Ende sprechen können will.

Block 9 kommt, sobald das Projekt gross genug ist, dass ein Refactoring weh tut.
