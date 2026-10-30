# TASK-51 Bestätigungsmail mit QR-Ticket

Auftrag: [Bestätigungs E-Mail](https://app.notion.com/p/409895158fe680898551f03bcf6ebe8d).
Entschieden 2026-10-30, **vor** der Umsetzung. Den umgesetzten Stand beschreibt
[`datenmodell.md`](./datenmodell.md).

## Problem

Drei Dinge, die nur die Sonde gezeigt hat:

1. **Offenes Mail-Relais.** `sendConfirmationEmail` war eine öffentliche
   Server Action mit Empfänger und Event als Parametern, aufgerufen vom
   Browser _nach_ der Anmeldung. Jeder konnte sie beliebig oft mit beliebiger
   Adresse aufrufen und über die Absenderdomain Mails verschicken.
2. **Die anonyme Anmeldung darf nichts zurücklesen.** RLS zeigt einem
   anonymen Client weder die eigene Anmeldung (die SELECT-Policy verlangt
   Mitgliedschaft) noch die Organisation. Die Mail braucht aber beides: eine
   Kennung für den QR-Code und den Organisationsnamen.
3. **Gmail blockiert `data:`-Bilder.** Ein QR-Code als Data-URI im HTML
   erscheint dort nicht. Resend kann Anhänge mit `contentId` als
   Inline-Bild (`cid:`) senden.

## Entscheidung

**Die Mail verschickt der Server innerhalb der Anmeldung.** `addParticipant`
plant den Versand nach erfolgreichem Insert mit `after()` aus `next/server` —
die Antwort an den Browser wartet nicht auf Resend, und ein Fehler beim
Versand macht die Anmeldung nicht rückgängig. Eine öffentlich aufrufbare
Mail-Action gibt es nicht mehr; der Versand liegt in einem Modul ohne
`'use server'`.

**QR-Inhalt: Ticket-Link mit Zufallscode.** Neue Spalte
`event_participants.ticket_code` — zufällig, nicht erratbar, eindeutig. Der
QR-Code enthält `<SITE_URL>/t/<ticket_code>`. Der spätere Check-in (eigener
Task): der Admin scannt mit einer beliebigen Handykamera, landet auf einer
geschützten Seite und setzt „Teilgenommen“. Verworfen:

- _Teilnehmer-ID_ — der Primärschlüssel lässt sich nicht neu ausstellen und
  steht auch anderswo.
- _Signierter Token_ — braucht ein neues Secret und lässt sich nicht einzeln
  widerrufen.

**Ticket-Code und ID erzeugt der Server**, nicht die Datenbank, und schreibt
sie beim Insert mit. Er muss dann nichts zurücklesen, und RLS bleibt wie sie
ist.

**Organisationsname über eine schmale Funktion.**
`public.event_organization_name(event_id) returns text`, `security definer`,
ausführbar für `anon`. Sie gibt nur den Namen der Organisation eines
existierenden Events heraus — keine Liste, keine andere Spalte. Der Name steht
ohnehin in jeder Bestätigungsmail, ist also öffentlich. Verworfen:
Service-Role-Key auf dem Server — der mächtigste Schlüssel im Projekt und in
Vercel, und jeder Fehler im Mail-Code läse an RLS vorbei.

**QR-Code im Mail und als Anhang.** Derselbe PNG zweimal: einmal mit
`contentId` (inline, `cid:`), einmal als normaler Anhang `ticket.png`.
Erzeugt mit `qrcode` und `QR_OPTIONS` aus `lib/qr.ts` (`toBuffer`), wie in
TASK-49 vorgesehen.

**Keine Mail beim manuellen Hinzufügen** durch den Organisator — wie in
TASK-49 festgelegt; eine Einladungsmail ist ein eigener Task.

## Zwei Scheiben

1. **Mail serverseitig** (schliesst die Lücke), neuer Text, Anmeldedaten als
   Liste, Organisationsname. Migration: die Funktion.
2. **Ticket-Code** (Migration: Spalte) und **QR-Code** im Mail und als
   Anhang.

Beide sind Erweitern — Migration zuerst.

## Wirkung

- Kein Weg mehr, über die App beliebige Mails zu verschicken. Was bleibt, ist
  dem Prinzip „öffentliches Anmeldeformular“ eigen: wer eine fremde Adresse
  einträgt, löst **eine** Mail pro Adresse und Event aus — die
  Unique-Constraint auf `(event_id, lower(email))` begrenzt das. Rate-Limiting
  wäre ein eigener Task.
- Der Ticket-Code ist eine Bearer-Kennung: wer den QR-Code hat, kann ihn
  vorzeigen. Das ist bei Papiertickets nicht anders; ein Code lässt sich neu
  ausstellen, falls nötig.
