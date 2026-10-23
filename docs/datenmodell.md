# Datenmodell und Sicherheitsmodell

Der **Stand**, nicht die Geschichte. Wer wissen will, _warum_ etwas so ist, findet
die Begründung hier in einem Satz und die ausführliche Fassung im verlinkten
Pull Request.

Was hier **nicht** steht: Produktentscheidungen, Roadmap, Aufgaben — die liegen
in Notion. Konventionen und Fallstricke der Codebasis stehen in
[`CLAUDE.md`](../CLAUDE.md).

Stand: 2026-10-23, nach zwölf Migrationen.

## Das Besitzmodell in einem Satz

> Ein Event gehört einer **Organisation**, nicht einer Person. Wer es angelegt
> oder geändert hat, ist Zusatzinformation und darf verschwinden.

Daraus folgt alles Übrige: Policies prüfen Mitgliedschaft, Teilnehmer tragen die
Organisation ihres Events, Bilder liegen im Ordner der Organisation.

## Tabellen

| Tabelle              | Zweck                  | Besonderheit                                                       |
| -------------------- | ---------------------- | ------------------------------------------------------------------ |
| `organizations`      | Mandant                | `name` und Zeitstempel, sonst nichts                               |
| `organization_user`  | Mitgliedschaft         | `unique(organization_id, user_id)` **und** `unique(user_id)`       |
| `profiles`           | Profil zu `auth.users` | wird bei der Anmeldung angelegt, nie überschrieben                 |
| `events`             | Event                  | `organization_id` **not null**, `created_by`/`updated_by` nullable |
| `event_participants` | Anmeldung              | `organization_id` **not null**, per Trigger gesetzt                |

**`unique(user_id)` auf `organization_user` ist eine Schritt-1-Krücke:** ein
Nutzer ist derzeit in genau einer Organisation. Sie fällt mit den Einladungen
weg. Zwei Dinge hängen daran und müssen dann mitgeändert werden —
`getMyOrganizationId()` (es gibt dann eine _aktive_ Organisation, die gewählt
werden muss) und jeder Backfill, der aus `user_id` auf eine Organisation
schliesst.

## Löschverhalten

Der subtilste Teil des Modells. Pro Fremdschlüssel bewusst entschieden:

| Von                                    | Nach            | Verhalten                                    | Warum                                                           |
| -------------------------------------- | --------------- | -------------------------------------------- | --------------------------------------------------------------- |
| `organization_user.user_id`            | `auth.users`    | **cascade**                                  | Mitgliedschaft ohne Nutzer ist sinnlos                          |
| `organization_user.organization_id`    | `organizations` | **cascade**                                  | ebenso ohne Organisation                                        |
| `profiles.id`                          | `auth.users`    | **cascade**                                  | Profil ohne Nutzer ist sinnlos                                  |
| `events.organization_id`               | `organizations` | **cascade**                                  | Event ohne Organisation wäre unerreichbar                       |
| `events.created_by`                    | `auth.users`    | **set null**                                 | das Event gehört der Organisation und überlebt die Person       |
| `events.updated_by`                    | `auth.users`    | **set null**                                 | ebenso                                                          |
| `event_participants` (zusammengesetzt) | `events`        | **cascade** on delete, **cascade** on update | Anmeldung ohne Event ist sinnlos; bei Org-Wechsel zieht sie mit |

**Gemessen, nicht angenommen:** solange `events.organizer_id` existierte und von
`auth.users` kaskadierte, nahm ein gelöschter Nutzer seine Events mit — fünf
Events wurden zu einem. Das `set null` auf `created_by` kam erst mit dem
Entfernen der Spalte zur Wirkung. Festgehalten im Test
„Löschen eines Nutzers nimmt keine Events mit".

**Bekannte Lücke:** löscht man den letzten Nutzer einer Organisation, bleibt die
Organisation ohne Mitglieder zurück — und ist durch RLS für niemanden sichtbar.
Aufräumen gehört zur Mitgliederverwaltung.

## Sicherheitsmodell

**RLS ist die Grenze.** Die Prüfungen in den Server Actions liefern nur lesbare
Fehlermeldungen; fehlt eine Policy, hilft kein Anwendungscode.

| Tabelle              | Lesen                                                  | Schreiben                                          |
| -------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| `events`             | **öffentlich** — Events stehen auf öffentlichen Seiten | Mitglieder der Organisation                        |
| `event_participants` | nur Mitglieder der Organisation des Events             | INSERT **öffentlich** (Anmeldung), Rest Mitglieder |
| `organizations`      | Mitglieder                                             | INSERT für Angemeldete, Rest Mitglieder            |
| `organization_user`  | nur die eigenen Zeilen                                 | kein direktes Schreiben — nur über den Trigger     |
| `profiles`           | nur das eigene                                         | nur das eigene                                     |

Zwei Feinheiten, die man den Policies nicht ansieht:

**Beim UPDATE gehört ein `with check`, nicht nur ein `using`.** Ohne das kann man
ein eigenes Event per Update in eine fremde Organisation verschieben. Eigener
Test dafür.

**Keine Rekursion, und darum noch keine Definer-Funktion.** Eine Policy auf
`events` liest `organization_user`, dort greift `user_id = auth.uid()` — ein
Spaltenvergleich ohne Tabellenzugriff. `my_organization_ids()` aus EOS-20 wird
erst nötig, wenn eine Policy auf `organization_user` dieselbe Tabelle lesen muss,
also bei „zeig mir die anderen Mitglieder".

## Drei Schichten bei den Teilnehmern

Die Anmeldung ist öffentlich — ein Client, der die Organisation mitliefert, kann
sie falsch mitliefern. Deshalb drei unabhängige Schichten, jede einzeln
nachgewiesen:

| Schicht                                       | Aufgabe                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Server Action                                 | liest die Organisation aus dem Event; erlaubt „Event nicht gefunden" statt eines Fremdschlüsselfehlers |
| Trigger `event_participants_set_organization` | setzt sie **unbedingt** neu, bei INSERT **und** UPDATE, überschreibt Mitgeliefertes                    |
| Fremdschlüssel `(event_id, organization_id)`  | macht ein nicht zusammengehörendes Paar unmöglich, auch ohne Trigger                                   |

Der Trigger feuert auch bei UPDATE, weil ein Fremdschlüssel mit einer
null-Spalte unter `MATCH SIMPLE` nicht geprüft wird — ohne das wäre die Lücke
offen geblieben.

Die Funktion heisst `public.set_participant_organization()`, der Trigger
`event_participants_set_organization`.

- **`event_participants.organization_id` setzt ein Trigger, nicht der Code.**
  `event_participants_set_organization` (BEFORE INSERT **OR UPDATE**) liest die
  Organisation aus dem Eltern-Event und **ueberschreibt** jeden mitgelieferten
  Wert — die Anmeldung ist oeffentlich, ein Client darf die Organisation nicht
  bestimmen. Dazu ein zusammengesetzter Fremdschluessel
  `(event_id, organization_id)` auf `events(id, organization_id)`, der ein
  nicht zusammengehoerendes Paar auch auf Wegen unmoeglich macht, die den
  Trigger nicht nehmen. Die Spalte ist `not null` ohne Default, **die
  generierten Typen verlangen sie deshalb auf jedem Insert-Pfad** — auch wenn
  der Trigger sie danach neu setzt. `addParticipant` liest sie dafuer aus dem
  Event; das liefert zugleich eine lesbare Meldung bei unbekanntem Event statt
  eines Fremdschluesselfehlers.

## Storage

Bucket `event-images`, öffentlich lesbar, Dateien unter
`<organization_id>/<uuid>.<ext>`.

**Übergangszustand:** die Schreib-Policy akzeptiert derzeit _auch_ den eigenen
Nutzerordner. Grund: alte Policy und neuer Code schliessen sich gegenseitig aus,
es gibt keine Reihenfolge ohne Übergang. Eine Folge-Migration lässt die
Nutzer-ID-Variante fallen.

**Objekte lassen sich nicht per SQL verschieben** — `update storage.objects set
name` benennt nur die Metadatenzeile um, die Datei bleibt liegen und das Objekt
ist kaputt. Dafür gibt es `scripts/move-images-to-organization.mjs`.

## Was bewusst noch nicht da ist

- **Einladungen** und mehrere Organisationen pro Nutzer — erst damit wird der
  ganze Umbau sichtbar, weil dann zwei Personen dieselbe Organisation teilen
- **Rollen innerhalb einer Organisation** — jedes Mitglied darf alles
- **Profilseite** mit Organisation
- **Warteliste mit Kapazität** — bewusst als Lernaufgabe aufgespart, weil sie
  eine echte Nebenläufigkeitsentscheidung erzwingt
- **Aufräumen leerer Organisationen**
- **Storage-Policy zusammenziehen** (Nutzerordner entfernen)
