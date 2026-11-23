/**
 * Conversion core. No React, no DOM — everything here is a pure function, so it
 * can be unit tested and reused from a script, a Node CLI, or another app.
 *
 * The conversion itself is plain JSON string encoding: newlines become \n,
 * tabs become \t, double quotes become \", and the result sits under a single
 * key. Single quotes, slashes and brackets are left untouched.
 */

export const DEFAULT_KEY = 'query';

/** Which way the converter is pointing. */
export const DIRECTION = {
  daxToJson: 'daxToJson',
  jsonToDax: 'jsonToDax',
};

/** Shape of the generated payload. */
export const WRAP = {
  /** { "query": "<dax>" } — the everyday envelope. */
  simple: 'simple',
  /** The body the Power BI REST executeQueries endpoint expects. */
  executeQueries: 'executeQueries',
};

/**
 * Row-limit rewriting is off here and switched on in src/config.js, so the
 * library never changes a query unless it is asked to.
 */
export const DEFAULT_ROW_LIMIT = {
  apply: false,
  limit: 100000,
  matches: [],
};

export const DEFAULT_OPTIONS = {
  key: DEFAULT_KEY,
  indent: 2,
  wrap: WRAP.simple,
  ensureAscii: false,
  keepCrlf: false,
  rowLimit: DEFAULT_ROW_LIMIT,
};

/** TOPN, optional space, open bracket, optional whitespace, then the count. */
const TOPN_COUNT = /(\bTOPN\s*\(\s*)(\d+)/gi;

/**
 * Tidy a DAX string before encoding.
 *
 * Strips a UTF-8 byte order mark, converts CRLF/CR line endings to LF unless
 * asked not to, and trims blank lines at the very start and end. Indentation
 * and blank lines inside the query are never touched.
 *
 * @param {string} text
 * @param {{ keepCrlf?: boolean }} [options]
 * @returns {string}
 */
export function cleanDax(text, { keepCrlf = false } = {}) {
  let out = String(text ?? '');
  if (out.charCodeAt(0) === 0xfeff) out = out.slice(1);
  if (!keepCrlf) out = out.replace(/\r\n?/g, '\n');
  return out.replace(/^[\r\n]+/, '').replace(/\s+$/, '');
}

/**
 * Raise the row cap that Performance Analyzer bakes into the query.
 *
 * A visual only ever renders a few hundred rows, so the exported query arrives
 * wrapped in TOPN(501, ...). Run anywhere else it quietly truncates, which is
 * why the number is rewritten on the way into the JSON.
 *
 * Only the first argument of TOPN is touched, and only when it is a literal
 * number listed in `matches`. A TOPN written deliberately inside a measure,
 * say TOPN(5, ...) for a top-five list, is left alone.
 *
 * Running this twice changes nothing the second time.
 *
 * @param {string} dax
 * @param {{ apply?: boolean, limit?: number, matches?: number[] }} [rowLimit]
 * @returns {{ text: string, count: number, from: number[] }}
 *          count is how many numbers were rewritten, from lists what they were
 */
export function applyRowLimit(dax, rowLimit = DEFAULT_ROW_LIMIT) {
  const { apply, limit, matches } = { ...DEFAULT_ROW_LIMIT, ...rowLimit };

  if (!apply || !Number.isFinite(limit) || limit <= 0) {
    return { text: dax, count: 0, from: [] };
  }

  const seen = new Set();
  let count = 0;

  const text = dax.replace(TOPN_COUNT, (whole, head, digits) => {
    const current = Number(digits);

    // An empty `matches` list means "whatever number is there".
    if (matches.length > 0 && !matches.includes(current)) return whole;
    if (current === limit) return whole;

    seen.add(current);
    count += 1;
    return `${head}${limit}`;
  });

  return { text, count, from: [...seen] };
}

/**
 * Wrap an already-cleaned DAX string in the chosen payload shape.
 *
 * @param {string} dax
 * @param {{ key?: string, wrap?: string }} [options]
 * @returns {object}
 */
export function buildPayload(dax, { key = DEFAULT_KEY, wrap = WRAP.simple } = {}) {
  const name = key.trim() || DEFAULT_KEY;

  if (wrap === WRAP.executeQueries) {
    return {
      queries: [{ [name]: dax }],
      serializerSettings: { includeNulls: true },
    };
  }

  return { [name]: dax };
}

/**
 * Escape every character above the ASCII range as \uXXXX, matching the
 * behaviour of Python's json.dumps(ensure_ascii=True).
 *
 * @param {string} json
 * @returns {string}
 */
function escapeNonAscii(json) {
  return json.replace(
    /[\u007f-\uffff]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

/**
 * DAX text to JSON text.
 *
 * @param {string} dax
 * @param {Partial<typeof DEFAULT_OPTIONS>} [options]
 * @returns {string}
 */
export function daxToJson(dax, options = {}) {
  const { key, indent, wrap, ensureAscii, keepCrlf, rowLimit } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const cleaned = cleanDax(dax, { keepCrlf });
  const { text } = applyRowLimit(cleaned, rowLimit);
  const json = JSON.stringify(buildPayload(text, { key, wrap }), null, indent || 0);

  return ensureAscii ? escapeNonAscii(json) : json;
}

/**
 * JSON text back to DAX text. Accepts the plain envelope, the executeQueries
 * payload, or a bare JSON string.
 *
 * @param {string} payload
 * @param {{ key?: string }} [options]
 * @returns {string}
 * @throws {SyntaxError} when the text is not valid JSON
 * @throws {Error} when no query can be found under the given key
 */
export function jsonToDax(payload, { key = DEFAULT_KEY } = {}) {
  const name = key.trim() || DEFAULT_KEY;
  const value = JSON.parse(payload);

  if (typeof value === 'string') return value;

  if (value && typeof value === 'object') {
    if (typeof value[name] === 'string') return value[name];

    const first = Array.isArray(value.queries) ? value.queries[0] : null;
    if (first && typeof first[name] === 'string') return first[name];

    const strings = Object.values(value).filter((entry) => typeof entry === 'string');
    if (strings.length === 1) return strings[0];
  }

  throw new Error(
    `No query found under the key "${name}". Change the key name in src/config.js to match your payload.`,
  );
}

/**
 * Turn an exception into something worth showing a person.
 *
 * @param {unknown} error
 * @returns {string}
 */
function readableError(error) {
  if (error instanceof SyntaxError) {
    return `This is not valid JSON, so there is nothing to decode. ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Run a conversion in either direction and report the outcome.
 *
 * Never throws: the UI renders whatever comes back.
 *
 * @param {string} text
 * @param {Partial<typeof DEFAULT_OPTIONS> & { direction?: string }} [options]
 * @returns {{
 *   ok: boolean, output: string, empty: boolean, verified: boolean, error: string,
 *   rowLimit: { count: number, from: number[], to: number|null }
 * }}
 */
export function convert(text, options = {}) {
  const { direction = DIRECTION.daxToJson, ...rest } = options;
  const base = {
    ok: true,
    output: '',
    empty: false,
    verified: false,
    error: '',
    rowLimit: { count: 0, from: [], to: null },
  };

  if (!text || !text.trim()) return { ...base, empty: true };

  try {
    if (direction === DIRECTION.jsonToDax) {
      return { ...base, output: jsonToDax(text, rest) };
    }

    const cleaned = cleanDax(text, rest);
    const limited = applyRowLimit(cleaned, rest.rowLimit);
    const output = daxToJson(limited.text, rest);

    // Decode what was just produced and compare it with the query that went in,
    // row limit included. A mismatch means the envelope would not survive the
    // round trip, which is worth knowing before anyone copies it.
    let verified = false;
    try {
      verified = jsonToDax(output, rest) === limited.text;
    } catch {
      verified = false;
    }

    return {
      ...base,
      output,
      verified,
      rowLimit: {
        count: limited.count,
        from: limited.from,
        to: limited.count ? { ...DEFAULT_ROW_LIMIT, ...rest.rowLimit }.limit : null,
      },
    };
  } catch (error) {
    return { ...base, ok: false, error: readableError(error) };
  }
}

/**
 * Line, character and byte counts for a block of text.
 *
 * @param {string} text
 * @returns {{ lines: number, characters: number, bytes: number }}
 */
export function measure(text) {
  if (!text) return { lines: 0, characters: 0, bytes: 0 };
  return {
    lines: text.split('\n').length,
    characters: text.length,
    bytes: new TextEncoder().encode(text).length,
  };
}

/**
 * Byte count as a short human-readable string.
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}