'use client';

import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback';

import { loadSpanishSpellChecker } from './spanish-spell-checker';
import {
  clearMisspellingsMeta,
  collectMisspellings,
  setMisspellingsMeta,
  SPELL_ERROR_CLASS,
  spellCheckPluginKey,
} from './spell-check-extension';
import type { PopupPosition } from './spell-check-popup';
import type { SpellChecker } from './types';

const MAX_SUGGESTIONS = 6;
const RECOMPUTE_DELAY_MS = 600;

type ActivePopup = {
  word: string;
  suggestions: string[];
  from: number;
  to: number;
  position: PopupPosition;
};

export type SpellCheckControls = {
  active: boolean;
  loading: boolean;
  toggle: () => void;
  popup: ActivePopup | null;
  selectSuggestion: (suggestion: string) => void;
  ignore: () => void;
  closePopup: () => void;
};

/**
 * Orchestrates the client-side Spanish spell checker on top of a TipTap
 * editor: lazy-loads the dictionary on first activation, recomputes the
 * red-underline decorations as the user types, and opens a suggestions popup
 * when a flagged word is clicked. The persisted HTML is never touched —
 * underlines live only in the ProseMirror plugin state.
 */
export function useSpellCheck(editor: Editor | null): SpellCheckControls {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<ActivePopup | null>(null);

  const checkerRef = useRef<SpellChecker | null>(null);
  const ignoredRef = useRef<Set<string>>(new Set());
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const recompute = useCallback(() => {
    const checker = checkerRef.current;
    if (!editor || !checker) {
      return;
    }

    const ranges = collectMisspellings(editor.state.doc, checker, word =>
      ignoredRef.current.has(word.toLowerCase())
    );
    editor.view.dispatch(
      editor.state.tr.setMeta(spellCheckPluginKey, setMisspellingsMeta(ranges))
    );
  }, [editor]);

  const debouncedRecompute = useDebouncedCallback(
    recompute,
    RECOMPUTE_DELAY_MS
  );

  // Re-scan as the user types (only while the feature is on).
  useEffect(() => {
    if (!editor || !active) {
      return;
    }
    const handleUpdate = () => debouncedRecompute();
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, active, debouncedRecompute]);

  // Open the suggestions popup when a flagged word is clicked.
  useEffect(() => {
    if (!editor) {
      return;
    }
    const view = editor.view;

    function handleClick(event: MouseEvent) {
      if (!activeRef.current) {
        return;
      }
      const target = (event.target as HTMLElement | null)?.closest(
        `.${SPELL_ERROR_CLASS}`
      );
      if (!target) {
        return;
      }

      const pos = view.posAtDOM(target, 0);
      const found = spellCheckPluginKey
        .getState(view.state)
        ?.decorations.find(pos, pos + 1);
      const decoration = found?.[0];
      if (!decoration) {
        return;
      }

      const { from, to } = decoration;
      const word = view.state.doc.textBetween(from, to);
      const suggestions =
        checkerRef.current?.suggest(word).slice(0, MAX_SUGGESTIONS) ?? [];
      const rect = target.getBoundingClientRect();

      setPopup({
        word,
        suggestions,
        from,
        to,
        position: { top: rect.bottom + 6, left: rect.left },
      });
    }

    view.dom.addEventListener('click', handleClick);
    return () => {
      view.dom.removeEventListener('click', handleClick);
    };
  }, [editor]);

  const enable = useCallback(async () => {
    setActive(true);

    if (!checkerRef.current) {
      setLoading(true);
      try {
        checkerRef.current = await loadSpanishSpellChecker();
      } catch {
        setActive(false);
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    // The user may have switched it back off while the dictionary loaded.
    if (activeRef.current) {
      recompute();
    }
  }, [recompute]);

  const disable = useCallback(() => {
    setActive(false);
    setPopup(null);
    if (editor) {
      editor.view.dispatch(
        editor.state.tr.setMeta(spellCheckPluginKey, clearMisspellingsMeta())
      );
    }
  }, [editor]);

  const toggle = useCallback(() => {
    if (activeRef.current) {
      disable();
    } else {
      void enable();
    }
  }, [enable, disable]);

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      if (!editor || !popup) {
        return;
      }
      editor
        .chain()
        .focus()
        .insertContentAt({ from: popup.from, to: popup.to }, suggestion)
        .run();
      setPopup(null);
      recompute();
    },
    [editor, popup, recompute]
  );

  const ignore = useCallback(() => {
    if (!popup) {
      return;
    }
    ignoredRef.current.add(popup.word.toLowerCase());
    setPopup(null);
    recompute();
  }, [popup, recompute]);

  const closePopup = useCallback(() => setPopup(null), []);

  return {
    active,
    loading,
    toggle,
    popup,
    selectSuggestion,
    ignore,
    closePopup,
  };
}
