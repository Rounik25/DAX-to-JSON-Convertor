import { useCallback, useMemo, useState } from 'react';
import { OUTPUT_FORMAT, ROW_LIMIT } from '../config.js';
import { convert, DIRECTION } from '../lib/daxToJson.js';
import { SAMPLE_DAX } from '../lib/sample.js';

/**
 * All converter state in one place: what was typed and which way the conversion
 * runs. The output format and the row-limit rule come from src/config.js and
 * are not editable at run time. The result is derived, never stored, so it can
 * never drift out of step with the input.
 */
export function useConverter() {
  const [direction, setDirection] = useState(DIRECTION.daxToJson);
  const [source, setSource] = useState('');

  const result = useMemo(
    () => convert(source, { ...OUTPUT_FORMAT, rowLimit: ROW_LIMIT, direction }),
    [source, direction],
  );

  const loadExample = useCallback(() => {
    setDirection(DIRECTION.daxToJson);
    setSource(SAMPLE_DAX);
  }, []);

  const clear = useCallback(() => setSource(''), []);

  return {
    direction,
    setDirection,
    source,
    setSource,
    result,
    loadExample,
    clear,
  };
}