import { describe, expect, it } from 'vitest';
import {
  cleanDax,
  convert,
  daxToJson,
  DIRECTION,
  formatBytes,
  jsonToDax,
  measure,
  WRAP,
} from './daxToJson.js';
import { SAMPLE_DAX } from './sample.js';

describe('cleanDax', () => {
  it('converts Windows line endings to newlines', () => {
    expect(cleanDax('EVALUATE\r\n\tROW("a", 1)')).toBe('EVALUATE\n\tROW("a", 1)');
  });

  it('keeps Windows line endings when asked', () => {
    expect(cleanDax('A\r\nB', { keepCrlf: true })).toBe('A\r\nB');
  });

  it('drops a byte order mark', () => {
    expect(cleanDax('\ufeffEVALUATE')).toBe('EVALUATE');
  });

  it('trims blank lines at the edges but not inside', () => {
    expect(cleanDax('\n\nDEFINE\n\n\tVAR a = 1\n\n')).toBe('DEFINE\n\n\tVAR a = 1');
  });

  it('leaves indentation on the first line alone', () => {
    expect(cleanDax('\t\tEVALUATE')).toBe('\t\tEVALUATE');
  });
});

describe('daxToJson', () => {
  it('escapes newlines, tabs and double quotes', () => {
    const json = daxToJson('EVALUATE\n\tROW("n", 1)');
    expect(json).toBe('{\n  "query": "EVALUATE\\n\\tROW(\\"n\\", 1)"\n}');
  });

  it('leaves single quotes and slashes untouched', () => {
    const json = daxToJson("EVALUATE 'Activity/Milestone'");
    expect(json).toContain("'Activity/Milestone'");
    expect(json).not.toContain('\\/');
  });

  it('honours a custom key', () => {
    expect(daxToJson('EVALUATE', { key: 'dax', indent: 0 })).toBe('{"dax":"EVALUATE"}');
  });

  it('minifies when the indent is zero', () => {
    expect(daxToJson('EVALUATE', { indent: 0 })).toBe('{"query":"EVALUATE"}');
  });

  it('builds the executeQueries payload', () => {
    const payload = JSON.parse(daxToJson('EVALUATE', { wrap: WRAP.executeQueries }));
    expect(payload.queries[0].query).toBe('EVALUATE');
    expect(payload.serializerSettings.includeNulls).toBe(true);
  });

  it('escapes non-ASCII characters on request', () => {
    expect(daxToJson('EVALUATE "café"', { indent: 0, ensureAscii: true })).toContain('caf\\u00e9');
    expect(daxToJson('EVALUATE "café"', { indent: 0 })).toContain('café');
  });
});

describe('jsonToDax', () => {
  it('reads the plain envelope', () => {
    expect(jsonToDax('{"query": "EVALUATE\\n\\tROW()"}')).toBe('EVALUATE\n\tROW()');
  });

  it('reads the executeQueries payload', () => {
    expect(jsonToDax('{"queries":[{"query":"EVALUATE"}]}')).toBe('EVALUATE');
  });

  it('falls back to the only string in the object', () => {
    expect(jsonToDax('{"statement": "EVALUATE"}')).toBe('EVALUATE');
  });

  it('rejects invalid JSON', () => {
    expect(() => jsonToDax('{query: EVALUATE}')).toThrow(SyntaxError);
  });

  it('explains a missing key', () => {
    expect(() => jsonToDax('{"a": 1, "b": "x", "c": "y"}')).toThrow(/No query found/);
  });
});

describe('convert', () => {
  it('reports an empty input without an error', () => {
    const result = convert('   ');
    expect(result).toMatchObject({ ok: true, empty: true, output: '' });
  });

  it('verifies the round trip on the full sample query', () => {
    const result = convert(SAMPLE_DAX);
    expect(result.ok).toBe(true);
    expect(result.verified).toBe(true);
    expect(jsonToDax(result.output)).toBe(cleanDax(SAMPLE_DAX));
  });

  it('survives a round trip through both directions', () => {
    const encoded = convert(SAMPLE_DAX).output;
    const decoded = convert(encoded, { direction: DIRECTION.jsonToDax });
    expect(decoded.output).toBe(cleanDax(SAMPLE_DAX));
  });

  it('returns a readable error for broken JSON', () => {
    const result = convert('not json', { direction: DIRECTION.jsonToDax });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not valid JSON/);
  });
});

describe('measure and formatBytes', () => {
  it('counts lines, characters and bytes', () => {
    expect(measure('a\nbb')).toEqual({ lines: 2, characters: 4, bytes: 4 });
  });

  it('counts multi-byte characters correctly', () => {
    expect(measure('é').bytes).toBe(2);
  });

  it('formats byte counts', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });
});
