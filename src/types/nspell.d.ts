/**
 * Minimal type declarations for `nspell` (ships no types). Covers only the
 * surface the spell-check feature uses: construct from aff/dic data, then
 * query correctness and suggestions.
 */
declare module 'nspell' {
  type DictionaryInput = string | Uint8Array;

  interface NSpell {
    /** True when the word is spelled correctly. */
    correct(word: string): boolean;
    /** Ordered correction candidates for a misspelled word. */
    suggest(word: string): string[];
    /** Add a word to the runtime dictionary (treated as correct). */
    add(word: string): NSpell;
  }

  function nspell(aff: DictionaryInput, dic: DictionaryInput): NSpell;

  export default nspell;
  export type { NSpell };
}
