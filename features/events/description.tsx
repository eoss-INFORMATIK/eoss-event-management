import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

import { cn } from '@/lib/utils';

/**
 * Die Beschreibung eines Events ist Markdown in `events.description` (TASK-53,
 * siehe docs/entscheidungen.md). Geschrieben wird sie im Tiptap-Editor,
 * angezeigt hier.
 *
 * Die Sicherheit haengt an diesem Renderer, nicht am Editor: wer RLS-Rechte
 * auf ein Event hat, kann am Editor vorbei beliebigen Text in die Spalte
 * schreiben, und die Landingpage ist oeffentlich. Deshalb:
 *
 * - kein `rehype-raw` -- HTML im Markdown wird nie zu HTML
 * - eine feste Liste erlaubter Elemente; alles andere (Links, Bilder, Code,
 *   Tabellen) faellt weg, sein Text bleibt stehen
 *
 * `remark-breaks`, weil die Beschreibungen vor dem Editor Klartext waren und
 * einfache Zeilenumbrueche zeigten (`whitespace-pre-line`). Der Editor
 * schreibt mit `breaks: true` dasselbe Verstaendnis zurueck.
 */
export const DESCRIPTION_ELEMENTS = [
  'p',
  'br',
  'h2',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
];

/**
 * Gestaltung der Beschreibung, geteilt von Anzeige und Editor -- was man beim
 * Schreiben sieht, sieht man auch auf der Landingpage.
 */
export const DESCRIPTION_STYLES = cn(
  'flex flex-col gap-4',
  '[&_h2]:text-[1.5em] [&_h2]:leading-tight [&_h2]:font-bold',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_:is(ol,ul)]:flex [&_:is(ol,ul)]:flex-col [&_:is(ol,ul)]:gap-1 [&_:is(ol,ul)]:pl-6',
  '[&_strong]:font-bold [&_em]:italic'
);

interface EventDescriptionProps {
  markdown: string;
  className?: string;
}

export function EventDescription({
  markdown,
  className,
}: EventDescriptionProps) {
  return (
    <div className={cn(DESCRIPTION_STYLES, className)}>
      <Markdown
        remarkPlugins={[remarkBreaks]}
        allowedElements={DESCRIPTION_ELEMENTS}
        unwrapDisallowed
      >
        {markdown}
      </Markdown>
    </div>
  );
}
