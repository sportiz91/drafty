/** @jest-environment node */
import { findMisspellings } from './find-misspellings';

/** Treats every word as correct except those in the supplied set. */
function fakeChecker(misspelled: string[]) {
  const bad = new Set(misspelled.map(word => word.toLowerCase()));
  return { correct: (word: string) => !bad.has(word.toLowerCase()) };
}

describe('findMisspellings', () => {
  it('returns the misspelled words with their offsets', () => {
    const text = 'Me gusta el qeso';

    expect(findMisspellings(text, fakeChecker(['qeso']))).toEqual([
      { word: 'qeso', start: 12, end: 16 },
    ]);
  });

  it('returns nothing when every word is correct', () => {
    expect(findMisspellings('todo bien aquí', fakeChecker([]))).toEqual([]);
  });

  it('skips single-letter tokens', () => {
    // "y" is a (correct) one-letter word; even if flagged it must be ignored.
    expect(findMisspellings('a y b', fakeChecker(['a', 'y', 'b']))).toEqual([]);
  });

  it('skips words reported as ignored', () => {
    const text = 'drafty mola';
    const isIgnored = (word: string) => word.toLowerCase() === 'drafty';

    expect(findMisspellings(text, fakeChecker(['drafty']), isIgnored)).toEqual(
      []
    );
  });

  it('flags every occurrence of a misspelling', () => {
    const text = 'qeso y mas qeso';

    expect(findMisspellings(text, fakeChecker(['qeso', 'mas']))).toEqual([
      { word: 'qeso', start: 0, end: 4 },
      { word: 'mas', start: 7, end: 10 },
      { word: 'qeso', start: 11, end: 15 },
    ]);
  });
});
