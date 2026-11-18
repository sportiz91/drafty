/** A word and where it sits within the source text. */
export type WordToken = {
  word: string;
  start: number;
  end: number;
};

/**
 * Runs of unicode letters (incl. Spanish á-ú, ñ, ü and combining marks).
 * Digits, punctuation and whitespace act as separators, so "covid-19" yields
 * just "covid" and numbers are never flagged.
 */
const WORD_PATTERN = /[\p{L}\p{M}]+/gu;

/** Splits text into word tokens, each tagged with its offset range. */
export function tokenizeWords(text: string): WordToken[] {
  const tokens: WordToken[] = [];
  let match: RegExpExecArray | null;

  WORD_PATTERN.lastIndex = 0;
  while ((match = WORD_PATTERN.exec(text)) !== null) {
    const word = match[0];
    tokens.push({ word, start: match.index, end: match.index + word.length });
  }

  return tokens;
}
