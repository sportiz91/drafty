import { tokenizeWords } from './tokenize';
import type { Misspelling, SpellChecker } from './types';

/** Single-letter tokens (initials, list markers) are never flagged. */
const MIN_WORD_LENGTH = 2;

/**
 * Locates every misspelled word in `text`. Pure over the injected checker —
 * suggestions are intentionally not computed here (they are resolved lazily,
 * only for the word the user clicks) to keep a full-document scan cheap.
 */
export function findMisspellings(
  text: string,
  checker: Pick<SpellChecker, 'correct'>,
  isIgnored: (word: string) => boolean = () => false
): Misspelling[] {
  const misspellings: Misspelling[] = [];

  for (const token of tokenizeWords(text)) {
    if (token.word.length < MIN_WORD_LENGTH) {
      continue;
    }
    if (isIgnored(token.word)) {
      continue;
    }
    if (checker.correct(token.word)) {
      continue;
    }

    misspellings.push(token);
  }

  return misspellings;
}
