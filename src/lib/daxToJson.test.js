import { describe, expect, it } from 'vitest';
import {
  applyRowLimit,
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
import { ROW_LIMIT } from '../config.js';

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

describe('applyRowLimit', () => {
  const on = { apply: true, limit: 100000, matches: [501, 1001, 3001, 30001] };

  it('rewrites the count when TOPN sits on one line', () => {
    const { text, count, from } = applyRowLimit('TOPN(501, __Core, [Name], 1)', on);
    expect(text).toBe('TOPN(100000, __Core, [Name], 1)');
    expect(count).toBe(1);
    expect(from).toEqual([501]);
  });

  it('rewrites the count across the line break Performance Analyzer emits', () => {
    const dax = '\tVAR __Windowed = \n\t\tTOPN(\n\t\t\t501,\n\t\t\t__Core,\n\t\t\t1\n\t\t)';
    const { text, count } = applyRowLimit(dax, on);
    expect(text).toContain('TOPN(\n\t\t\t100000,');
    expect(text).not.toContain('501');
    expect(count).toBe(1);
  });

  it('leaves the rest of the query untouched', () => {
    const dax = "EVALUATE TOPN(501, 'Sales'[501 Club], 1) ORDER BY 'Sales'[Rank]";
    expect(applyRowLimit(dax, on).text).toBe(
      "EVALUATE TOPN(100000, 'Sales'[501 Club], 1) ORDER BY 'Sales'[Rank]",
    );
  });

  it('rewrites every qualifying TOPN in one query', () => {
    const { count, from } = applyRowLimit('TOPN(501, a) TOPN(1001, b)', on);
    expect(count).toBe(2);
    expect(from.sort()).toEqual([501, 1001].sort());
  });

  it('leaves a hand-written TOPN alone', () => {
    const dax = 'TOPN(5, VALUES(Product[Name]), [Revenue], DESC)';
    const { text, count } = applyRowLimit(dax, on);
    expect(text).toBe(dax);
    expect(count).toBe(0);
  });

  it('rewrites any count when the match list is empty', () => {
    const { text, count } = applyRowLimit('TOPN(5, a)', { ...on, matches: [] });
    expect(text).toBe('TOPN(100000, a)');
    expect(count).toBe(1);
  });

  it('changes nothing when switched off', () => {
    const dax = 'TOPN(501, a)';
    expect(applyRowLimit(dax, { ...on, apply: false })).toEqual({
      text: dax,
      count: 0,
      from: [],
    });
  });

  it('reports no change when the count is already the limit', () => {
    const { text, count } = applyRowLimit('TOPN(100000, a)', { ...on, matches: [] });
    expect(text).toBe('TOPN(100000, a)');
    expect(count).toBe(0);
  });

  it('is safe to run twice', () => {
    const once = applyRowLimit('TOPN(501, a)', on).text;
    const twice = applyRowLimit(once, on);
    expect(twice.text).toBe(once);
    expect(twice.count).toBe(0);
  });

  it('ignores an identifier that merely ends in TOPN', () => {
    const dax = 'MYTOPN(501, a)';
    expect(applyRowLimit(dax, on).text).toBe(dax);
  });

  it('ignores a TOPN whose count is an expression rather than a number', () => {
    const dax = 'TOPN(__RowLimit, a)';
    expect(applyRowLimit(dax, on).text).toBe(dax);
  });

  it('is off by default, so the library never rewrites unasked', () => {
    expect(applyRowLimit('TOPN(501, a)').count).toBe(0);
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

  it('carries the raised row limit into the JSON', () => {
    const json = daxToJson('TOPN(501, a)', { indent: 0, rowLimit: ROW_LIMIT });
    expect(json).toBe('{"query":"TOPN(100000, a)"}');
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

  it('raises the row limit and reports what it did', () => {
    const result = convert(SAMPLE_DAX, { rowLimit: ROW_LIMIT });
    expect(result.rowLimit).toEqual({ count: 1, from: [501], to: 100000 });
    expect(jsonToDax(result.output)).toContain('TOPN(\n\t\t\t100000,');
  });

  it('still verifies once the row limit has been raised', () => {
    const result = convert(SAMPLE_DAX, { rowLimit: ROW_LIMIT });
    expect(result.verified).toBe(true);
    expect(jsonToDax(result.output)).not.toBe(cleanDax(SAMPLE_DAX));
  });

  it('reports no row-limit change when there was nothing to raise', () => {
    const result = convert('EVALUATE ROW("n", 1)', { rowLimit: ROW_LIMIT });
    expect(result.rowLimit).toEqual({ count: 0, from: [], to: null });
  });

  it('leaves the query alone when decoding', () => {
    const result = convert('{"query":"TOPN(501, a)"}', {
      direction: DIRECTION.jsonToDax,
      rowLimit: ROW_LIMIT,
    });
    expect(result.output).toBe('TOPN(501, a)');
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