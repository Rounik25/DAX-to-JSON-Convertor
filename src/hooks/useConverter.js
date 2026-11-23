import { useCallback, useMemo, useState } from 'react';
import { convert, DEFAULT_OPTIONS, DIRECTION } from '../lib/daxToJson.js';
import { SAMPLE_DAX } from '../lib/sample.js';

/**
 * All converter state in one place: what was typed, which way the conversion
 * runs, and the options. The result is derived, never stored, so the output can
 * never drift out of step with the input.
 */
export function useConverter() {
  const [direction, setDirection] = useState(DIRECTION.daxToJson);
  const [source, setSource] = useState('');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const result = useMemo(
    () => convert(source, { ...options, direction }),
    [source, options, direction],
  );

  const setOption = useCallback((name, value) => {
    setOptions((current) => ({ ...current, [name]: value }));
  }, []);

  const loadExample = useCallback(() => {
    setDirection(DIRECTION.daxToJson);
    setSource(SAMPLE_DAX);
  }, []);

  const clear = useCallback(() => setSource(''), []);

  /** Send the result back through the converter the other way round. */
  const reverse = useCallback(() => {
    setDirection((current) => {
      const flipped =
        current === DIRECTION.daxToJson ? DIRECTION.jsonToDax : DIRECTION.daxToJson;
      setSource(result.ok && result.output ? result.output : '');
      return flipped;
    });
  }, [result]);

  return {
    direction,
    setDirection,
    source,
    setSource,
    options,
    setOption,
    result,
    loadExample,
    clear,
    reverse,
  };
}
