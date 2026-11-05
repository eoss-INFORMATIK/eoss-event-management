'use client';

import { useEffect } from 'react';

import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Italic, List, ListOrdered } from 'lucide-react';

import { DESCRIPTION_STYLES } from '@/features/events/description';

import { Toggle } from '@/components/ui/toggle';

import { cn } from '@/lib/utils';

/**
 * Editor fuer die Beschreibung (TASK-53). Liest und schreibt Markdown, siehe
 * features/events/description.tsx.
 *
 * Der Umfang ist bewusst klein -- Titel, Listen, fett, kursiv. Alles andere aus
 * dem StarterKit ist ausgeschaltet, damit nichts entsteht, was die Anzeige
 * ohnehin verwirft. Die Grenze haelt aber der Renderer, nicht dieser Editor.
 */
const extensions = [
  StarterKit.configure({
    heading: { levels: [2] },
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: false,
    strike: false,
    underline: false,
  }),
  // breaks: einfache Zeilenumbrueche der alten Klartext-Beschreibungen bleiben
  // harte Umbrueche, statt beim ersten Speichern zu verschwinden.
  Markdown.configure({ markedOptions: { breaks: true } }),
];

interface DescriptionEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  // Von FormControl durchgereicht, landen auf der editierbaren Flaeche.
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export function DescriptionEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: DescriptionEditorProps) {
  const editor = useEditor({
    extensions,
    content: value,
    contentType: 'markdown',
    // Kein Rendern auf dem Server -- sonst Hydration-Fehler.
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? '' : editor.getMarkdown());
    },
    onBlur: () => onBlur?.(),
  });

  // FormControl setzt aria-invalid erst nach einer Validierung. Die Attribute
  // stehen deshalb nicht nur bei der Erzeugung, sondern folgen den Props.
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          ...(id && { id }),
          ...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy }),
          'aria-invalid': String(Boolean(ariaInvalid)),
          'aria-label': 'Beschreibung',
          'aria-multiline': 'true',
          role: 'textbox',
          class: cn(DESCRIPTION_STYLES, 'min-h-32 px-3 py-2 outline-none'),
        },
      },
    });
  }, [editor, id, ariaDescribedBy, ariaInvalid]);

  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      heading: editor?.isActive('heading', { level: 2 }) ?? false,
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      bulletList: editor?.isActive('bulletList') ?? false,
      orderedList: editor?.isActive('orderedList') ?? false,
      empty: editor?.isEmpty ?? true,
    }),
  });

  const tools = [
    {
      label: 'Titel',
      icon: Heading2,
      pressed: active?.heading,
      run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Fett',
      icon: Bold,
      pressed: active?.bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: 'Kursiv',
      icon: Italic,
      pressed: active?.italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Aufzählung',
      icon: List,
      pressed: active?.bulletList,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Nummerierte Liste',
      icon: ListOrdered,
      pressed: active?.orderedList,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div
      className={cn(
        'border-input focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] md:text-sm',
        ariaInvalid && 'border-destructive'
      )}
    >
      <div
        role="toolbar"
        aria-label="Formatierung"
        className="flex gap-1 border-b p-1"
      >
        {tools.map(({ label, icon: Icon, pressed, run }) => (
          <Toggle
            key={label}
            size="sm"
            aria-label={label}
            title={label}
            pressed={pressed ?? false}
            onPressedChange={run}
            disabled={!editor}
          >
            <Icon />
          </Toggle>
        ))}
      </div>
      <div className="relative">
        {placeholder && active?.empty && (
          <p className="text-muted-foreground pointer-events-none absolute top-2 left-3">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
