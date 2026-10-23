> **Historischer Entwurf, Stand September 2026.** Dieses Dokument wurde _vor_
> der Umsetzung geschrieben und bewusst nicht nachgeführt — es zeigt, was
> geplant war. Den tatsächlichen Stand beschreibt
> [`datenmodell.md`](./datenmodell.md).
>
> Vier Stellen hat die Realität korrigiert:
>
> | hier geplant                                                              | tatsächlich                                                                                    |
> | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
> | „Der Organizer ist nicht mehr der User sondern die Org"                   | `organizer_id` ist ganz entfallen, dafür `created_by`/`updated_by`                             |
> | zusammengesetzter Fremdschlüssel auf `events(id, organization_id)`        | braucht zuerst einen Unique-Index auf genau diesen Spalten, sonst lehnt Postgres ihn ab        |
> | „Die generierten Typen verlangen sie trotzdem — dort steht ein Kommentar" | stattdessen liest die Action die Organisation aus dem Event; kein Kommentar nötig              |
> | Storage-Pfad wechseln                                                     | brauchte eine Übergangs-Policy und ein Skript, weil SQL Storage-Objekte nicht verschieben kann |
>
> Die RLS-Rekursionsanalyse und die Trigger-plus-Fremdschlüssel-Entscheidung
> haben der Umsetzung dagegen unverändert standgehalten.

# EOS-20 Multi Org Setup

Die Event App soll Organisationen erhalten. Dadurch kann die App nicht nur von Usern sondern auch von verschiedenen Organisationen genutzt werden.
Diese Anpassung bildet auch die Grundlage für die In-App-Bezahlung, das ist aber bewusst out of scope.

## User Stories

Ich als User (App-Admin) möchte eine Organisation erstellen und Events diesen Organisationen zuweisen können. Dadurch kann ich mit Kollegen an geteilten Events arbeietn, gleichzeitig aber in separaten Organisationen private Events verwalten.
Ich als User (App-Admin) möchte Kollegen zur Mitarbeit einladen können, damit sie auch mit mir Events bearbeiten und verwalten können.
Ich als User (App-Admin) möchte beim Signup direkt eine Organisation erstellen können und automatisch dieser Organisation angehören, damit das Signup nicht unnörig kompliziert wird.
Ich als User möchte zu einer Organisation eingeladen werden können. In dem Fall soll ich keine Organisation anlegen müssen, da ich bereits der Organisation aus der Einladung angehören soll.

## Abgrenzung

Der Umadng der Userstory 1 wird im ersten Schritt bewusst nicht voll abgedeckt. Im ersten Schritt soll nur eine Org möglich sein, dies aber nur zur vereinfachten Implementierung und wird noch vor den ersten Signups ausgebaut.

- Jeder User hat innerhalb einer Organisation die gleichen Berechtigungen. Das heisst, jeder User kann alle Aktionen ausführen und neue User zur Organisation einladen.
- Die Einladung von zusätzlichen Usern in die Org wird separat implementiert.
- Eine Seite zur Bearbeitung der Organisation ist noch nicht nötig.
- Jeder User kann im ersten Schritt nur eine Org angehören.
- Die Emails werden aktuell noch alle ab der gleichen Domain gesendet.

## Technische Grundlagen

Da Supabase keine nativ multi-org Unterstützung hat, wird eine benutzerdefinierte Lösung benötigt. Dazu soll eine Org-Tabelle im Public Schema angelegt werden. Die Tabelle heisst organization.
Die Org-Tabelle hat einen Namen und alle nötigen technischen Felder wie ID, Createad, Updated.
Die Verknüpfung zwischen User und Org wird durch eine Zwischentabelle realisiert, die Tabelle soll organization_user heissen und die ID des Users und der Org beinhalten.
Es soll bereits in Schritt 1 eine profiles tabelle angelegt werden, welche mit dem user verknüpft ist. Das Profil beinhaltet im ersten Schritt nur den Namen und die E-Mail und wird in weiteren Iterationen ergänzt. Die Daten stammen aktuell aus user_metadata, im Fall eines Magic Links bleiben sie leer. In Schritt 2 wird das behoben.
Die Mitgliedschaft eines Users in einer Org wird nicht per JWT sondern per Lookup gemacht. Im ersten Schritt soll eine userid unique auf einer Org sein. Schritt 2 löst dieses Problem auf.
Details:
unique (organization_id, user_id) -- niemand ist zweimal in derselben Org
-- dauerhaft richtig, bleibt in Schritt 2
unique (user_id) -- ein User ist in genau einer Org
-- die Schritt-1-Einschränkung, wird gelöscht

### Sichtbarkeit von Mitgliedern (RLS-Rekursion)

**Problem:** Eine Policy auf `organization_user`, die prüft „ist der Anfragende in derselben Org", muss dafür `organization_user` lesen — und löst damit erneut dieselbe Policy aus. Postgres bricht mit `infinite recursion detected in policy` ab.
**Entscheidung:** Eine `security definer`-Funktion `my_organization_ids()` durchbricht den Kreis. Policies auf `organization_user` und `profiles`fragen die Funktion statt der Tabelle. Erst in Schritt 2 nötig.
**Sicherheitsregel:** Die Funktion nimmt **keine Parameter**. Die Identitätkommt aus `auth.uid()` innerhalb der Funktion. Sie gibt ausschliesslich die Orgs des Aufrufers zurück. Zusätzlich `set search_path = ''`. Eine Variante mit User-ID als Parameter wäre ein Loch: sie liefe mit Besitzerrechten an allen Policies vorbei.
**Gilt nicht für:** „Zeig meine eigenen Mitgliedschaften" (`user_id = auth.uid()`) — ein Spaltenvergleich ohne Tabellenzugriff, also ohne Rekursion. Solange nur das gebraucht wird, ist die Funktion nicht nötig.

### organization_id bei Teilnehmern

**Problem:** Die Anmeldung ist öffentlich. Ein Client, der die Org mitliefert, kann sie falsch mitliefern.
**Entscheidung:** BEFORE-INSERT-Trigger füllt organization_id aus dem Event. Zusätzlich Fremdschlüssel (event_id, organization_id) auf events(id, organization_id) mit ON UPDATE CASCADE.
**Wirkung:** Der Trigger macht es bequem, der Fremdschlüssel macht es unmöglich falsch. Bei einem Org-Wechsel des Events ziehen die Teilnehmer automatisch mit.
**Sichtbar wo:** Die Action setzt organization_id nicht. Die generierten Typen verlangen sie trotzdem -- dort steht ein Kommentar. Ebenso in CLAUDE.md unter Gotchas.

## Updates

Es sind Updates an mehreren Stellen notwendig:

- Signup Flow: Beim Signup muss automatisch eine Organisation angelegt und mit dem neuen User verknüpft werden. Beim Signup und der Anmeldung soll immer ein Callback ausgeführt werden, welcher eine Org anlegt, falls noch keine existiert. /auth/callback (OAuth) und /auth/confirm (Magic Link) — beide brauchen es. Das schreit nach einem gemeinsamen Helfer, etwa ensureOrganization() in features/auth/, damit die Logik nicht zweimal dasteht und auseinanderläuft.
- Meine Events: Soll nur die Events der eignene Org angezeigt werden.
- Neue Events anlegen: Neue Events sollen immer in der Org des Users angelegt werden. Der Organizer (organizer_id) ist nicht mehr der User sondern die Org. Der User, welcher den Event angelegt oder angepasst hat, soll durch eine creadte_by und updaet_by Spalte ergänz werden.
- Event Anmeldung: Der Eintrag in event_participants soll auch die Org beinhalten, damit Anapssungen daran bezüglich Berechtigungen geprüft werden können und die Participants in Zukunft für andere Actions genutzt werden können.
- Bilder des Events sollen auf einem Ordner der Organisation und nicht dem User gespeichert werden. Der Pfad Pfad wechselt von <user-id>/ auf <organization_id>/, und die Storage-Policy vergleicht nicht mehr mit auth.uid() sondern prüft die Org-Mitgliedschaft.
- Profil: Ein Profil soll angezeigt werdne. Im Profil soll die Org angezeigt werden.

## Security

- editEvent: RLS: Der Check ob ein Event angepasst werden darf, basierend auf der Org des Users.
- deleteEvent: Gleiches Verhalten wir beim editEvent.
- getUserEvents: Soll die Events der Org des Users zurückgeben und auf RLS prüfen, ob der User zur Org passt.

## UX

- Der Check im Frontend soll nicht nur beinhalten, ob es ein User gibt sondern auch, ob der User zur Org des Events passt.
- Im Frontend soll der Check ebenfalls auf Ebene Org passieren.

## Migration

Es gibt keine zu migrierenden Daten.

## Next Steps

Organisationen fertig machen, Gruppenmitgliederzeigen, Einladen, Mehrere Organisationen, mehrere Orgs als User haben können.
