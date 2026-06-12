'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

type DocumentEditorProps = {
  initialContentHtml: string;
  onContentChange: (contentHtml: string) => void;
};

export function DocumentEditor({
  initialContentHtml,
  onContentChange,
}: DocumentEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
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

  return (
    <div className="pt-5">
      {editor ? <EditorToolbar editor={editor} /> : null}
      <EditorContent editor={editor} className="mt-4" />
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

function EditorToolbar({ editor }: { editor: Editor }) {
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
    </div>
  );
}
