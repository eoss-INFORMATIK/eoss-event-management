import { fromMarkdown } from 'mdast-util-from-markdown';

import { EXCERPT_LENGTH } from '@/features/events/schema';

type MdastNode = ReturnType<typeof fromMarkdown>['children'][number];

const CONTAINER_BLOCKS = new Set(['list', 'listItem', 'blockquote']);

/**
 * Die Beschreibung als Klartext, Bloecke durch ein Leerzeichen getrennt -- fuer
 * Vorschauen, in denen ein Titel oder eine Liste das Layout sprengen wuerde.
 *
 * Nicht `mdast-util-to-string`: das klebt Absaetze und Zeilenumbrueche ohne
 * Abstand aneinander ("TitelText").
 */
export function descriptionToPlainText(markdown: string): string {
  const text = (node: MdastNode): string => {
    if ('value' in node && node.type !== 'html') return node.value;
    if (node.type === 'break') return ' ';
    if (!('children' in node)) return '';
    // Bloecke, deren Kinder wieder Bloecke sind, bekommen ein Leerzeichen
    // dazwischen; innerhalb eines Absatzes (fett, kursiv) kein zusaetzliches.
    const separator = CONTAINER_BLOCKS.has(node.type) ? ' ' : '';
    return (node.children as MdastNode[]).map(text).join(separator);
  };

  return fromMarkdown(markdown)
    .children.map(text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Der Text der Event-Karte (TASK-53, Scheibe 2): der selbst geschriebene
 * Kurztext, sonst der Anfang der Beschreibung als Klartext -- an einer
 * Wortgrenze gekuerzt, mit Auslassungszeichen, insgesamt hoechstens
 * EXCERPT_LENGTH Zeichen. Leer, wenn es beides nicht gibt.
 */
export function eventExcerpt(event: {
  excerpt: string | null;
  description: string | null;
}): string {
  const own = event.excerpt?.trim();
  if (own) return own;

  const text = event.description
    ? descriptionToPlainText(event.description)
    : '';
  if (text.length <= EXCERPT_LENGTH) return text;

  const cut = text.slice(0, EXCERPT_LENGTH - 1);
  const space = cut.lastIndexOf(' ');
  // Ein einziges Wort ueber die ganze Laenge wird hart geschnitten.
  return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
