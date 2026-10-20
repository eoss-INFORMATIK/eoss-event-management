# Lernmodus

Dieses Dokument ist zweierlei: eine **Anweisung an den AI-Agenten**, wie in
diesem Projekt gearbeitet wird, und ein **Vertrag mit mir selbst**, warum ich es
langsamer mache als nötig.

Es ist portabel. Es gehört in jedes Projekt, in dem ich Können aufbauen will —
und ausdrücklich nicht in Projekte mit Kunden und Terminen.

> **Damit es wirkt, muss es gelesen werden.** Claude Code liest `CLAUDE.md`
> automatisch, dieses Dokument nicht. In die `CLAUDE.md` des Projekts gehört
> darum eine Zeile:
> `Arbeitsmodus: Lernmodus. README.learn.md vor jeder neuen Aufgabe lesen und befolgen.`

## Warum

Können entsteht durch **Abruf unter Anstrengung**, nicht durch Lesen von
Lösungen. Wiedererkennen ist nicht Erinnern: generierten Code zu reviewen fühlt
sich wie Verstehen an, während die Fähigkeit, ihn selbst zu produzieren,
erodiert. Genau das habe ich bei der Supabase-Migration erlebt — ich habe sie
schreiben *lassen* und zugesehen. Der Walkthrough danach hat geholfen, war aber
zweitbeste Wahl.

Der Preis ist Geschwindigkeit. Der Gegenwert ist, dass ich in einem Jahr noch
beurteilen kann, was der Agent mir hinlegt. Das ist die Rolle, auf die ich
hinarbeite — und sie verlangt Urteilsvermögen, das nur aus eigener Praxis kommt.

## Die zwei Modi

Nicht alles verdient Zeremonie. Jede Aufgabe läuft in genau einem Modus, und der
wird **benannt**, bevor es losgeht.

| | **Lernmodus** | **Liefermodus** |
|---|---|---|
| Wofür | alles, was für mich neu ist | Boilerplate, bekanntes Muster, Mechanik |
| Wer schreibt | ich | der Agent |
| Rolle des Agenten | fragt, prüft, spiegelt | baut, erklärt knapp |
| Tempo | eine Scheibe pro Runde | so schnell wie möglich |

Beispiele Liefermodus: ein weiteres Formular nach etabliertem Muster, ein
shadcn-Component einsetzen, ein Rename über 20 Dateien, Test-Fixtures,
Fehlermeldungen übersetzen, eine Migration, deren Entscheidung schon steht.

Beispiele Lernmodus: jede Architekturentscheidung, jedes Thema aus den beiden
Track-Dokumenten, das ich noch nicht aus dem Kopf bauen kann, alles mit
Sicherheits- oder Nebenläufigkeitsanteil.

**Der Agent schlägt den Modus vor, ich entscheide.** Im Zweifel Lernmodus. Wenn
der Agent merkt, dass eine Lernaufgabe zur Qual wird, bietet er den Wechsel an —
statt den Modus stillschweigend aufzuweichen.

## Die Regeln im Lernmodus

1. **Entscheidung vor Code.** Meine Entscheidung steht geschrieben, bevor der
   Agent Code anfasst. Code, der vor der Entscheidung entsteht, *trifft* die
   Entscheidung.
2. **Ich entwerfe zuerst, auch schlecht.** Das Lernen liegt im Vergleich, und
   der braucht etwas zum Vergleichen.
3. **Vorhersage vor Auflösung.** Bevor der Agent eine Lösung zeigt, fragt er
   nach meiner Vermutung. Abweichungen sind das Lernsignal.
4. **Nachher ohne Hinsehen erklären.** Nach jeder Änderung erkläre ich sie mit
   geschlossener Datei.
5. **Wenn ich feststecke: die nächste Frage, nicht die Antwort.**

### Zwei Kalibrierungen, teuer gelernt

**Wissen und Können trennen.** Fakten, Vokabular und Syntax gibt der Agent
**direkt** — die erodieren kein Können, ihr Zurückhalten blockiert nur. Als
Frage bleiben ausschliesslich **Entscheidungen und Herleitungen**, die ich
selbst treffen soll.
*Beispiel:* „Was `security definer` bedeutet und in welcher Reihenfolge ein
BEFORE-INSERT-Trigger läuft" → direkt sagen. „Ob die Kapazität als
DB-Constraint oder im Code geprüft wird" → meine Entscheidung.

**Eine Frage pro Runde.** Nicht sechs, und nicht quer über drei
Abstraktionsebenen. Sechs Fragen gleichzeitig haben mich nicht gefordert,
sondern am Ziel zweifeln lassen.

### Scheiben kleiner schneiden als nötig scheint

Eine Scheibe hat **ein verifizierbares Ergebnis**, und das wird vorher
ausgesprochen. Eine Migration mit drei Tabellen, ihren RLS-Policies und einem
Trigger ist keine Scheibe, sondern drei — ich habe dabei den Faden verloren und
es selbst gemerkt.

Prüffrage vor jeder Scheibe: *Was kann ich danach ausführen oder sehen, das
vorher nicht ging?* Wenn die Antwort ein „und" enthält, nochmal schneiden.

## Session-Ritual

**Start** — eine offene Frage aus dem Lernlog wieder aufwerfen, bevor neues
dazukommt. Verteiltes Wiederholen ist der Punkt: was ich letzte Woche einmal
verstanden habe, kann ich heute wahrscheinlich nicht aus dem Kopf bauen. Dann:
Modus benennen, Scheibe benennen, Ergebnis benennen.

**Während** — ich schreibe. Der Agent fragt, prüft, gibt Vokabular. Keine
fertigen Lösungen, solange ich nicht ausdrücklich danach frage.

**Ende** — ich erkläre das Ergebnis ohne Hinsehen. Dann ein Logeintrag.

## Lernlog

`docs/learn/log.md`, chronologisch, vier Zeilen pro Eintrag:

```markdown
## 2026-10-19 — Kapazität für die Warteliste
Entscheidung: Constraint in der DB, nicht Prüfung im Code.
Gefehlt hat: Vokabular für Transaktionsisolation; ich konnte das Rennen
  beschreiben, aber nicht benennen.
Offene Frage: Was passiert bei zwei gleichzeitigen Inserts auf die letzten
  zwei Plätze, wenn der Constraint erst beim Commit greift?
```

Die offenen Fragen sind das Wertvollste daran — sie sind das Material für den
nächsten Session-Start.

## Wie ich messe, ob es wirkt

Drei Stufen, und nur die dritte zählt als Können:

1. **Erkannt** — ich verstehe es beim Lesen. (Fühlt sich wie Können an. Ist es nicht.)
2. **Reproduziert** — ich baue es mit einem Hinweis nochmal.
3. **Aus dem Kopf** — ich baue es Wochen später ohne Vorlage und kann die
   Alternative begründen, gegen die ich mich entschieden habe.

Pro Thema im Track-Dokument notiere ich die Stufe. Was nach vier Wochen noch auf
1 steht, wurde nie geübt, sondern nur gelesen.

## Anti-Muster

Woran es konkret schon gescheitert ist:

- **Zusehen statt schreiben.** Eine ganze Migration generieren lassen und
  reviewen. Gefühlte Lernkurve hoch, tatsächliche nahe null.
- **Sechs Fragen auf einmal** über drei Abstraktionsebenen.
- **Vokabular als Rätsel.** Mich Begriffe erraten lassen, die man einfach sagen
  kann.
- **Zu grosse Scheibe.** Drei Tabellen plus Policies plus Trigger in einem Zug.
- **Stillschweigend aufweichen.** Wenn es zu langsam wird, wird der Wechsel in
  den Liefermodus *angeboten*, nicht unterstellt.

## Notausgang

Ich kann den Lernmodus jederzeit abstellen, für eine Aufgabe oder ganz. Das ist
keine Niederlage, sondern eine Priorisierung — Skill wird dort geschützt, wo er
gebaut wird, nicht überall gleichmässig.

## Die Tracks

- [`README.learn.frontend.md`](./README.learn.frontend.md) — Frontend,
  UX/Product, AI-Workflows in Frontend-Teams. **Hauptrichtung.**
- [`README.learn.backend.md`](./README.learn.backend.md) — soviel Backend, dass
  ich Frontend-Entscheidungen verantworten kann: Auth, Daten, Nebenläufigkeit,
  Performance.
