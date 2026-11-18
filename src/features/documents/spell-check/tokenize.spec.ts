/** @jest-environment node */
import { tokenizeWords } from './tokenize';

describe('tokenizeWords', () => {
  it('splits a sentence into words with correct offsets', () => {
    expect(tokenizeWords('hola mundo')).toEqual([
      { word: 'hola', start: 0, end: 4 },
      { word: 'mundo', start: 5, end: 10 },
    ]);
  });

  it('keeps Spanish accents, ñ and ü as part of words', () => {
    expect(tokenizeWords('niño pingüino árbol')).toEqual([
      { word: 'niño', start: 0, end: 4 },
      { word: 'pingüino', start: 5, end: 13 },
      { word: 'árbol', start: 14, end: 19 },
    ]);
  });

  it('treats punctuation and digits as separators', () => {
    expect(tokenizeWords('¡hola, covid-19!')).toEqual([
      { word: 'hola', start: 1, end: 5 },
      { word: 'covid', start: 7, end: 12 },
    ]);
  });

  it('returns no tokens for whitespace or symbols only', () => {
    expect(tokenizeWords('   123 — !!! ')).toEqual([]);
  });
});
