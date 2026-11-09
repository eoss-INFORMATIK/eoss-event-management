import { createElement } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EventDescription } from '@/features/events/description';
import { descriptionToPlainText } from '@/features/events/excerpt';

/**
 * Beschreibung als Markdown (TASK-53). Die Landingpage ist oeffentlich, und wer
 * RLS-Rechte auf ein Event hat, schreibt am Editor vorbei, was er will. Was
 * hier steht, haelt der Renderer -- nicht der Editor.
 *
 * Diese Tests brauchen keine Datenbank.
 */

const html = (markdown: string) =>
  renderToStaticMarkup(createElement(EventDescription, { markdown }));

describe('Beschreibung anzeigen', () => {
  it('zeigt Titel, Listen, fett und kursiv', () => {
    const out = html('## Ablauf\n\n- **Apéro**\n- *Essen*\n\n1. eins\n2. zwei');

    expect(out).toContain('<h2>Ablauf</h2>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<ol>');
    expect(out).toContain('<strong>Apéro</strong>');
    expect(out).toContain('<em>Essen</em>');
  });

  it('macht aus HTML im Text nie ein Element', () => {
    const out = html(
      'Hallo <script>alert(1)</script> <img src=x onerror=alert(1)>\n\n<iframe src="https://evil.example"></iframe>'
    );

    expect(out).not.toMatch(/<(script|img|iframe)/i);
  });

  it('laesst Links und Bilder weg, behaelt aber ihren Text', () => {
    const out = html(
      '[Klick](javascript:alert(1)) und ![Bild](https://evil.example/x.png)'
    );

    expect(out).not.toMatch(/<(a|img)\b/);
    expect(out).not.toContain('javascript:');
    expect(out).toContain('Klick');
  });

  it('zeigt nur die erlaubte Titelstufe', () => {
    const out = html('# Gross\n\n### Klein\n\n```\ncode\n```');

    expect(out).not.toMatch(/<(h1|h3|pre|code)\b/);
    expect(out).toContain('Gross');
  });

  it('behaelt einfache Zeilenumbrueche alter Klartext-Beschreibungen', () => {
    expect(html('Zeile eins\nZeile zwei')).toContain('Zeile eins<br/>');
  });

  it('zeigt vom Editor maskierte Spitzklammern als Text', () => {
    // Der Editor speichert ein getipptes `<b>` als `&lt;b&gt;`.
    const out = html('Kinder &lt;b&gt;unter 12&lt;/b&gt; gratis');

    expect(out).not.toContain('<b>');
    expect(out).toContain('&lt;b&gt;unter 12');
  });
});

describe('Beschreibung als Klartext', () => {
  it('trennt Bloecke mit einem Leerzeichen und laesst Markup weg', () => {
    expect(
      descriptionToPlainText(
        '## Ablauf\n\nWir **feiern** *gemeinsam*.\n\n- Apéro\n- Essen'
      )
    ).toBe('Ablauf Wir feiern gemeinsam. Apéro Essen');
  });

  it('macht aus einem Zeilenumbruch ein Leerzeichen', () => {
    expect(descriptionToPlainText('Zeile eins  \nZeile zwei')).toBe(
      'Zeile eins Zeile zwei'
    );
  });

  it('laesst HTML weg und dekodiert maskierte Zeichen', () => {
    expect(descriptionToPlainText('A <script>x</script> &lt;3 &amp; B')).toBe(
      'A x <3 & B'
    );
  });
});
