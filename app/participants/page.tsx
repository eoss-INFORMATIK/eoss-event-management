/**
 * Bewusst leer.
 *
 * Der Menuepunkt "Teilnehmer" steht im Design, die Seite dahinter ist noch
 * nicht entworfen. Ein Menuepunkt, der ins Leere zeigt, ist besser als einer,
 * der fehlt: die Navigation laesst sich so im Ganzen beurteilen -- und genau
 * das steht an, inklusive der Frage, ob daraus spaeter eine Seitennavigation
 * wird.
 */
const Participants = () => (
  <section className="flex flex-col gap-4">
    <h1 className="text-2xl font-bold">Teilnehmer</h1>
    <p className="text-muted-foreground">Diese Seite entsteht noch.</p>
  </section>
);

export default Participants;
