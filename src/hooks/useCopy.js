import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/clipboard.js';

/**
 * Copy text and report what happened for a couple of seconds afterwards, so a
 * button can confirm itself without a toast.
 *
 * @param {number} [resetAfter] milliseconds before the status clears
 * @returns {{ status: 'idle'|'copied'|'failed', copy: (text: string) => Promise<boolean> }}
 */
export function useCopy(resetAfter = 2000) {
  const [status, setStatus] = useState('idle');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text) => {
      const copied = await copyText(text);
      setStatus(copied ? 'copied' : 'failed');

      clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus('idle'), resetAfter);

      return copied;
    },
    [resetAfter],
  );

  return { status, copy };
}
