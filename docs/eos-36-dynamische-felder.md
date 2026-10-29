# EOS-36 Dynamische Felder am Event

Entscheidung vor Code, wie bei
[`eos-20-multi-org-setup.md`](./eos-20-multi-org-setup.md). Gilt für
[TASK-36](https://app.notion.com/p/403895158fe680a18f3de77b98fdfe07) und den
Folge-Task zu den Kategorien.

## Das Problem mit dem Namen

Der Task heisst „Dynamisches Anmeldeformular". Spezifiziert sind aber **zwei
feste optionale Blöcke**, deren Darstellung der Organisator ausdrücklich *nicht*
anpassen kann:

1. **Sponsor oder Ort** auf der Landingpage — Name, Zusatztext, Bild
2. **Kategorien** im Anmeldeformular — ein Select, dessen Werte der Organisator
   pro Event festlegt

Das ist kein Formularbaukasten. Einen zu bauen wäre an einer Stelle teuer, die
man im Formular nicht sieht: **Teilnehmerliste und Export müssten dann ebenfalls
dynamisch werden**, und die generierten Typen wüssten von keinem Feld mehr.

> **Entscheidung:** typisiert modellieren, nicht generisch. Kommt ein dritter
> Feldtyp dazu, ist das der Moment, diese Entscheidung zu überdenken — nicht
> vorher.

## Sponsor oder Ort: Spalten auf `events`

`sponsor_name`, `sponsor_text`, `sponsor_image_url`, alle nullable.

**Kein `sponsor_enabled`.** Ein Schalter neben den Daten ist ein zweiter
Zustand, der dem ersten widersprechen kann — aktiviert ohne Name, oder Name bei
deaktiviert. Der Block erscheint, wenn `sponsor_name` gesetzt ist. Der Schalter
im Formular blendet die Felder ein und leert sie beim Ausschalten; gespeichert
wird nur das Ergebnis.

Genau **ein** Sponsor pro Event, so entschieden. Mehrere wären eine Tabelle, und
der Umstieg darauf ist eine mechanische Migration — aber eine. Bei Events sind
mehrere Sponsoren eher Regel als Ausnahme, das ist der bewusst eingegangene
Einsatz.

## Kategorien: eigene Tabelle, nicht `text[]`

Tabelle `event_categories (id, event_id, organization_id, label, position)`, und
auf dem Teilnehmer `category_id` mit **zusammengesetztem Fremdschlüssel**
`(event_id, category_id)` auf `event_categories (event_id, id)`.

**Der Grund ist Sicherheit, nicht Ordnung.** Die Anmeldung ist öffentlich — der
Client bestimmt, was er schickt. Mit `text[]` am Event und einer Textspalte am
Teilnehmer könnte jemand „Gratis-VIP" eintragen, und es stünde in der
Teilnehmerliste des Organisators. Der zusammengesetzte Fremdschlüssel macht eine
Kategorie, die nicht zu diesem Event gehört, **unmöglich** — dasselbe Muster wie
bei `event_participants.organization_id`, nur dass hier kein Trigger nötig ist,
weil der Wert vom Client kommen *darf*, solange er zum Event passt.

Dafür braucht `event_categories` einen Unique-Index auf `(event_id, id)` — ein
zusammengesetzter Fremdschlüssel verlangt das, auch wenn `id` schon
Primärschlüssel ist. Diese Falle hat bei den Teilnehmern schon einmal Zeit
gekostet.

Zwei Dinge fallen nebenbei ab, die eine Textspalte verliert: eine umbenannte
Kategorie zieht bei bestehenden Anmeldungen mit, und die Reihenfolge ist eine
Spalte statt einer Array-Position.

**Löschverhalten:** `event_categories.event_id` → `events` **cascade** (eine
Kategorie ohne Event ist sinnlos). `event_participants.category_id` →
`event_categories` **restrict**: eine Kategorie zu löschen, auf die Anmeldungen
zeigen, muss scheitern statt die Anmeldung stillschweigend zu entwerten.

## Beschriftung und Pflicht

Der Organisator benennt das Feld selbst, Vorgabe „Kategorie" — für
„Einzelperson / mit Begleitung / Firma" ist „Kategorie" die falsche
Überschrift, „Teilnahme als" die richtige. Spalte `category_label` auf `events`.

Ob der Teilnehmer antworten *muss*, entscheidet der Organisator pro Event:
Spalte `category_required`.

## Reihenfolge

Beide Teile sind reines **Erweitern** — nullable Spalten, neue Tabelle. Also
**Migration zuerst**; die laufende alte Version ignoriert, was sie nicht kennt.

Ausnahme beim Verschärfen später: sollte `category_id` je zur Pflicht auf
Datenbankebene werden, gilt wieder Code zuerst.

## Abgrenzung

- **Kein Formularbaukasten**, kein zweiter Feldtyp, keine Mehrfachauswahl.
- Das Styling der Formulare bleibt wie es ist (so im Task abgegrenzt).
- Mehrere Sponsoren pro Event sind nicht vorgesehen.

## Zwei Scheiben

1. **Sponsor oder Ort** — kein öffentlicher Eingabepfad, keine neue Tabelle.
2. **Kategorien** — neue Tabelle, Fremdschlüssel, öffentliches Formular.

Scheibe 1 zuerst: sie etabliert den Schalter im Formular, den beide brauchen,
ohne gleichzeitig die Sicherheitskante zu öffnen.

## Abweichungen von der Vorlage

- Notion sagt **Checkbox**, Figma zeigt **Schalter**. Figma gilt.
- Notion sagt „Durchführungsort **oder** Sponsor", Figma beschriftet nur
  „Sponsor". Der Schalter heisst **„Sponsor oder Ort"**, sonst findet niemand
  den Durchführungsort.
- Der Figma-Screen zeigt für die Kategorien ein Select mit „Option 1/2/3". Das
  ist der Editor, nicht eine Vorschau: dort gibt der Organisator die Werte ein.
  Gebaut wird es als Liste von Textfeldern mit „Option hinzufügen" — dieselbe
  Absicht, ehrlicher gezeichnet, weil ein Dropdown nicht nach Eingabe aussieht.
