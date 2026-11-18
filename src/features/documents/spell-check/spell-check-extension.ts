import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Extension } from '@tiptap/react';

import { findMisspellings } from './find-misspellings';
import type { SpellChecker } from './types';

/** CSS class applied to each misspelled span (styled in globals.css). */
export const SPELL_ERROR_CLASS = 'spell-error';

/** A misspelling located by its absolute ProseMirror positions. */
export type MisspellingRange = { from: number; to: number };

type SpellCheckPluginState = { decorations: DecorationSet };

type SpellCheckMeta =
  | { type: 'set'; ranges: MisspellingRange[] }
  | { type: 'clear' };

export const spellCheckPluginKey = new PluginKey<SpellCheckPluginState>(
  'spellCheck'
);

/**
 * Walks the document and returns the absolute position range of every
 * misspelled word. Each text node is scanned independently, so a word split
 * across formatting boundaries (e.g. half-bold) is evaluated per fragment —
 * an acceptable edge case for inline spell checking.
 */
export function collectMisspellings(
  doc: ProseMirrorNode,
  checker: Pick<SpellChecker, 'correct'>,
  isIgnored: (word: string) => boolean
): MisspellingRange[] {
  const ranges: MisspellingRange[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) {
      return;
    }

    for (const misspelling of findMisspellings(node.text, checker, isIgnored)) {
      ranges.push({ from: pos + misspelling.start, to: pos + misspelling.end });
    }
  });

  return ranges;
}

/** Builds the transaction meta that replaces all current underlines. */
export function setMisspellingsMeta(
  ranges: MisspellingRange[]
): SpellCheckMeta {
  return { type: 'set', ranges };
}

/** Builds the transaction meta that removes every underline. */
export function clearMisspellingsMeta(): SpellCheckMeta {
  return { type: 'clear' };
}

/**
 * Renders red-underline decorations from ranges supplied by the React layer.
 * The plugin is deliberately "dumb": it never decides what is misspelled, it
 * only paints what it is told and maps existing underlines through edits so
 * they track their text until the next recompute.
 */
export const SpellCheck = Extension.create({
  name: 'spellCheck',

  addProseMirrorPlugins() {
    return [
      new Plugin<SpellCheckPluginState>({
        key: spellCheckPluginKey,
        state: {
          init: () => ({ decorations: DecorationSet.empty }),
          apply(tr, value) {
            const meta = tr.getMeta(spellCheckPluginKey) as
              | SpellCheckMeta
              | undefined;

            if (meta?.type === 'clear') {
              return { decorations: DecorationSet.empty };
            }

            if (meta?.type === 'set') {
              const decorations = meta.ranges.map(range =>
                Decoration.inline(range.from, range.to, {
                  class: SPELL_ERROR_CLASS,
                })
              );
              return { decorations: DecorationSet.create(tr.doc, decorations) };
            }

            return { decorations: value.decorations.map(tr.mapping, tr.doc) };
          },
        },
        props: {
          decorations(state) {
            return spellCheckPluginKey.getState(state)?.decorations;
          },
        },
      }),
    ];
  },
});
