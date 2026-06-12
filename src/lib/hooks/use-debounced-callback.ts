'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Debounced callback with a stable identity. The latest callback is kept in
 * a ref (updated in an effect, never during render) so consumers don't need
 * to memoize what they pass in.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(
        () => callbackRef.current(...args),
        delayMs
      );
    },
    [delayMs]
  );
}
