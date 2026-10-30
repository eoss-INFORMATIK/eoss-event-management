# Datenmodell und Sicherheitsmodell

Der **Stand**, nicht die Geschichte. Wer wissen will, _warum_ etwas so ist, findet
die Begründung hier in einem Satz und die ausführliche Fassung im verlinkten
Pull Request.

Was hier **nicht** steht: Produktentscheidungen, Roadmap, Aufgaben — die liegen
in Notion. Konventionen und Fallstricke der Codebasis stehen in
[`CLAUDE.md`](../CLAUDE.md).

Stand: 2026-10-30, nach achtzehn Migrationen.

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

**Die Reihenfolge ist hier umgekehrt zur Faustregel.** Die Constraint zu
entfernen ist ein Erweitern, also scheinbar Migration zuerst. Aber
`getMyOrganizationId()` benutzt `.maybeSingle()` und _wirft_ bei zwei
Mitgliedschaften, statt eine zu wählen. Gefährlich ist nicht die Migration,
sondern die erste zweite Mitgliedschaft. Also: erst Code, der mit mehreren
umgehen kann, dann die Constraint fallen lassen.

**Status einer Anmeldung** (`event_participants.status`, Check-Constraint
`event_participants_status_check`): `invited`, `registered`, `waitlisted`,
`cancelled`, `attended` — angezeigt als Eingeladen, Angemeldet, Warteliste,
Abgemeldet, Teilgenommen. Der Standard `registered` kommt aus dem Default der
Spalte; kein Code setzt ihn. `invited` hat noch keinen Ablauf (kommt mit den
Einladungen per Mail), `waitlisted` keinen (kommt mit der Kapazität). Check
statt Enum-Typ, weil sich ein Enum-Wert nicht entfernen lässt, ohne den Typ neu
zu bauen.

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
| `event_participants` | nur Mitglieder der Organisation des Events             | INSERT **öffentlich** nur als `registered`, Mitglieder mit jedem Status; Rest Mitglieder |
| `organizations`      | Mitglieder                                             | INSERT für Angemeldete, Rest Mitglieder            |
| `organization_user`  | nur die eigenen Zeilen                                 | kein direktes Schreiben — nur über den Trigger     |
| `profiles`           | nur das eigene                                         | nur das eigene                                     |

**Den Status bei der Anmeldung bestimmt nicht der Client.** Zwei
INSERT-Policies, die Postgres mit ODER verknüpft: „Anyone can register for an
event" erlaubt nur `status = 'registered'`, „Members can add participants with
any status" erlaubt Mitgliedern jeden Wert. Das öffentliche Formular setzt nie
einen Status, es bekommt `registered` über den Default. Gemessen vorher: mit
`with check (true)` legte ein anonymer API-Aufruf eine Anmeldung als
`attended` an.

Zwei Feinheiten, die man den Policies nicht ansieht:

**Beim UPDATE gehört ein `with check`, nicht nur ein `using`.** Ohne das kann man
ein eigenes Event per Update in eine fremde Organisation verschieben. Eigener
Test dafür.

Nur: **weglassen heisst nicht fehlen.** Fehlt `with check` ganz, wendet Postgres
das `using` auch auf die neue Zeile an. Auf `profiles`, `organizations` und den
Storage-UPDATE-Policies steht deshalb nur ein `using` — und sie sind trotzdem
dicht. Gemessen: der Versuch, die eigene Profilzeile auf eine fremde `id` zu
schreiben, scheitert mit `42501 new row violates row-level security policy`,
obwohl dort nie ein `with check` stand. Festgehalten im Test „A schreibt die
eigene Zeile nicht auf eine fremde id".

Ausgeschrieben gehört es trotzdem überall dorthin, wo es **anders** lauten muss
als das `using` daneben — bei `events` etwa, damit lesbar bleibt, dass auch die
Ziel-Organisation geprüft wird. Der gefährliche Fall ist nicht das Weglassen,
sondern ein `with check`, das schwächer ist als sein `using`.

**Eine Definer-Funktion gibt es: `event_organization_name(event_id)`.** Sie
liefert den Namen der Organisation eines Events, auch anonym — für die
Bestätigungsmail, die bei einer anonymen Anmeldung verschickt wird. Nur der
Name, nur über ein existierendes Event; die Tabelle `organizations` bleibt
anonym verschlossen. `set search_path = ''`, alle Namen voll qualifiziert.
Begründung in [`task-51-bestaetigungsmail.md`](./task-51-bestaetigungsmail.md).

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

**Der Übergangszustand ist aufgelöst.** Eine Zeit lang akzeptierte die
Schreib-Policy _auch_ den eigenen Nutzerordner, weil alte Policy und neuer Code
sich gegenseitig ausschlossen und es keine Reihenfolge ohne Übergang gab. Seit
`20261023083008_storage_policy_org_only` zählt nur noch die Organisation.
Voraussetzung war, dass keine Datei mehr in einem Nutzerordner liegt: eine solche
Datei bliebe öffentlich lesbar, wäre aber für niemanden mehr änderbar oder
löschbar — nur noch mit Service-Role.
Die Schreib-Policy prüft **ausschliesslich** die Mitgliedschaft in der
Organisation, deren ID der erste Pfadbestandteil ist. Lesen bleibt öffentlich.

Es gab dabei einen Übergangszustand, der zusätzlich den eigenen Nutzerordner
zuliess — nötig, weil alte Policy und neuer Code sich gegenseitig ausschlossen
und **keine** Reihenfolge ohne Übergang funktionierte. Das ist die Ergänzung zur
Regel „erweitern = Migration zuerst, verschärfen = Code zuerst": manchmal greift
keine der beiden Richtungen, und dann muss ein Zustand gebaut werden, der beide
Codeversionen verträgt.

Voraussetzung für das Zusammenziehen war, dass keine Datei mehr in einem
Nutzerordner liegt — danach wäre sie weiter öffentlich lesbar, aber für niemanden
mehr änderbar. Prüfung:

```sql
select count(*) from storage.objects
 where bucket_id = 'event-images'
   and split_part(name, '/', 1) not in (select id::text from public.organizations);
```

**Objekte lassen sich nicht per SQL verschieben** — `update storage.objects set
name` benennt nur die Metadatenzeile um, die Datei bleibt liegen und das Objekt
ist kaputt. Dafür gibt es `scripts/move-images-to-organization.mjs`.

## Was bewusst noch nicht da ist

- **Einladungen** und mehrere Organisationen pro Nutzer — erst damit wird der
  ganze Umbau sichtbar, weil dann zwei Personen dieselbe Organisation teilen
- **Rollen innerhalb einer Organisation** — jedes Mitglied darf alles
- **Warteliste mit Kapazität** — bewusst als Lernaufgabe aufgespart, weil sie
  eine echte Nebenläufigkeitsentscheidung erzwingt
- **Aufräumen leerer Organisationen**

Die **Profilseite** ist nicht mehr auf dieser Liste: sie ist gerade in Arbeit
(Profil Rebuild, Schritt 1).
