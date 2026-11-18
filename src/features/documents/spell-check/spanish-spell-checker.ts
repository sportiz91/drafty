import nspell from 'nspell';

import type { SpellChecker } from './types';

/** Served from public/ by scripts/sync-dictionaries.mjs (copied from dictionary-es). */
const DICTIONARY_BASE = '/dictionaries/es';

let checkerPromise: Promise<SpellChecker> | null = null;

function assertOk(response: Response): Response {
  if (!response.ok) {
    throw new Error(`Failed to load dictionary asset (${response.status})`);
  }
  return response;
}

async function fetchSpellChecker(): Promise<SpellChecker> {
  const [aff, dic] = await Promise.all([
    fetch(`${DICTIONARY_BASE}/index.aff`)
      .then(assertOk)
      .then(response => response.text()),
    fetch(`${DICTIONARY_BASE}/index.dic`)
      .then(assertOk)
      .then(response => response.text()),
  ]);

  return nspell(aff, dic);
}

/**
 * Lazily loads the Spanish spell checker and caches it for the page lifetime.
 * The ~850KB dictionary is only fetched the first time the feature is turned
 * on. A failed load is not cached, so a later toggle retries cleanly.
 */
export function loadSpanishSpellChecker(): Promise<SpellChecker> {
  checkerPromise ??= fetchSpellChecker().catch(error => {
    checkerPromise = null;
    throw error;
  });

  return checkerPromise;
}
