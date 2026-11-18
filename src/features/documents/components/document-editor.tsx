'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { SpellCheck } from '@/features/documents/spell-check/spell-check-extension';
import { SpellCheckPopup } from '@/features/documents/spell-check/spell-check-popup';
import {
  useSpellCheck,
  type SpellCheckControls,
} from '@/features/documents/spell-check/use-spell-check';

type DocumentEditorProps = {
  initialContentHtml: string;
  onContentChange: (contentHtml: string) => void;
};

export function DocumentEditor({
  initialContentHtml,
  onContentChange,
}: DocumentEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, SpellCheck],
    content: initialContentHtml,
    // SSR requirement: render nothing on the server, mount client-side.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'editor-prose focus:outline-none min-h-[55vh]',
        'data-id': 'editor-content',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onContentChange(currentEditor.getHTML());
    },
  });

  const spellCheck = useSpellCheck(editor);

  return (
    <div className="pt-5">
      {editor ? (
        <EditorToolbar editor={editor} spellCheck={spellCheck} />
      ) : null}
      <EditorContent editor={editor} className="mt-4" />
      {spellCheck.popup ? (
        <SpellCheckPopup
          word={spellCheck.popup.word}
          suggestions={spellCheck.popup.suggestions}
          position={spellCheck.popup.position}
          onSelect={spellCheck.selectSuggestion}
          onIgnore={spellCheck.ignore}
          onClose={spellCheck.closePopup}
        />
      ) : null}
    </div>
  );
}

const TOOLBAR_ACTIONS: {
  label: string;
  title: string;
  run: (editor: Editor) => void;
}[] = [
  {
    label: 'B',
    title: 'Bold',
    run: editor => editor.chain().focus().toggleBold().run(),
  },
  {
    label: 'I',
    title: 'Italic',
    run: editor => editor.chain().focus().toggleItalic().run(),
  },
  {
    label: 'H1',
    title: 'Heading 1',
    run: editor => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'H2',
    title: 'Heading 2',
    run: editor => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: '••',
    title: 'Bullet list',
    run: editor => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: '1.',
    title: 'Ordered list',
    run: editor => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: '"',
    title: 'Blockquote',
    run: editor => editor.chain().focus().toggleBlockquote().run(),
  },
];

function EditorToolbar({
  editor,
  spellCheck,
}: {
  editor: Editor;
  spellCheck: SpellCheckControls;
}) {
  return (
    <div
      className="flex gap-1 rounded-[var(--radius-button)] bg-surface-muted p-1"
      role="toolbar"
      aria-label="Formatting"
    >
      {TOOLBAR_ACTIONS.map(action => (
        <button
          key={action.title}
          type="button"
          title={action.title}
          onClick={() => action.run(editor)}
          className="min-w-9 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface"
        >
          {action.label}
        </button>
      ))}

      {/* Spell check is a mode, not a formatting action — set it apart. */}
      <span aria-hidden className="mx-0.5 w-px self-stretch bg-border" />
      <button
        type="button"
        data-id="spell-check-toggle"
        aria-pressed={spellCheck.active}
        disabled={spellCheck.loading}
        title={
          spellCheck.loading
            ? 'Loading dictionary…'
            : 'Spell check (Spanish): underline misspelled words'
        }
        onClick={spellCheck.toggle}
        className={`min-w-9 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
          spellCheck.active
            ? 'bg-accent text-white'
            : 'text-ink-secondary hover:bg-surface'
        }`}
      >
        ABC
      </button>
    </div>
  );
}
