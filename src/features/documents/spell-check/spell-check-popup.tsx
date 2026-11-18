'use client';

import { useEffect, useRef } from 'react';

/** Viewport coordinates (for `position: fixed`) anchoring the popup. */
export type PopupPosition = { top: number; left: number };

type SpellCheckPopupProps = {
  word: string;
  suggestions: string[];
  position: PopupPosition;
  /** Replace the word with a chosen suggestion. */
  onSelect: (suggestion: string) => void;
  /** Dismiss the underline and leave the word unchanged. */
  onIgnore: () => void;
  /** Close without acting (click-away / Escape). */
  onClose: () => void;
};

/**
 * Suggestions menu shown when a misspelled word is clicked. Clicking a
 * suggestion corrects the word; "Ignore" clears the underline as-is. Closes on
 * click-away or Escape.
 */
export function SpellCheckPopup({
  word,
  suggestions,
  position,
  onSelect,
  onIgnore,
  onClose,
}: SpellCheckPopupProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      data-id="spell-check-popup"
      role="menu"
      aria-label={`Spelling suggestions for "${word}"`}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 min-w-44 max-w-72 overflow-hidden rounded-[var(--radius-button)] border border-border bg-surface py-1 shadow-[var(--shadow-card)]"
    >
      {suggestions.length > 0 ? (
        suggestions.map(suggestion => (
          <button
            key={suggestion}
            type="button"
            role="menuitem"
            data-id="spell-suggestion"
            onClick={() => onSelect(suggestion)}
            className="block w-full truncate px-3 py-1.5 text-left text-sm text-ink transition-colors hover:bg-surface-muted"
          >
            {suggestion}
          </button>
        ))
      ) : (
        <p className="px-3 py-1.5 text-sm text-ink-muted">No suggestions</p>
      )}
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        role="menuitem"
        data-id="spell-ignore"
        onClick={onIgnore}
        className="block w-full px-3 py-1.5 text-left text-sm text-ink-secondary transition-colors hover:bg-surface-muted"
      >
        Ignore
      </button>
    </div>
  );
}
