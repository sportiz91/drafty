/** A misspelled word located within a piece of text. */
export type Misspelling = {
  /** The word exactly as it appears in the source text. */
  word: string;
  /** Start offset within the source text (inclusive). */
  start: number;
  /** End offset within the source text (exclusive). */
  end: number;
};

/**
 * The minimal spell-checking surface the feature depends on. `nspell`
 * satisfies this, and tests can supply a trivial fake.
 */
export interface SpellChecker {
  /** True when the word is spelled correctly. */
  correct(word: string): boolean;
  /** Ordered correction candidates for a misspelled word. */
  suggest(word: string): string[];
}
