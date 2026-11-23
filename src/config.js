/**
 * Output format and query rewriting.
 *
 * This is the only file to edit when the format has to change. The interface
 * has no settings, so whatever is set here is what everyone on the team gets.
 * Change a value, commit, and the deployed app follows on the next build.
 */

export const OUTPUT_FORMAT = {
  /**
   * Property the query sits under.
   *   'query'  ->  { "query": "<dax>" }
   */
  key: 'query',

  /**
   * Spaces per level in the JSON itself.
   *   2  ->  two-space indent (what the team uses)
   *   4  ->  four-space indent
   *   0  ->  everything on one line
   */
  indent: 2,

  /**
   * Payload shape.
   *   'simple'          ->  { "query": "<dax>" }
   *   'executeQueries'  ->  { "queries": [{ "query": "<dax>" }],
   *                           "serializerSettings": { "includeNulls": true } }
   *                         the body the Power BI REST endpoint expects
   */
  wrap: 'simple',

  /**
   * Accented and non-English characters.
   *   false  ->  left as typed, for example café
   *   true   ->  written as \uXXXX, for example caf\u00e9
   */
  ensureAscii: false,

  /**
   * Line endings.
   *   false  ->  normalised to \n, which is what Performance Analyzer output
   *              should look like once it reaches the JSON
   *   true   ->  Windows \r\n kept as it was pasted
   */
  keepCrlf: false,
};

/**
 * Row limit.
 *
 * Performance Analyzer wraps its export in TOPN(501, ...) because the visual
 * itself only ever rendered 501 rows. Run anywhere else, that query quietly
 * truncates, so the number is raised on the way into the JSON.
 */
export const ROW_LIMIT = {
  /**
   * Whether to rewrite it at all.
   *   true   ->  raise the cap, and say so under the result
   *   false  ->  leave every TOPN exactly as pasted
   */
  apply: true,

  /**
   * The number that replaces it. 100000 is as high as Power Automate goes;
   * raise it if the query is headed somewhere with a different ceiling.
   */
  limit: 100000,

  /**
   * Which numbers qualify. Performance Analyzer emits a different cap per
   * visual, so the usual ones are all listed. Add to this list if a report
   * exports something else.
   *
   * An empty list, [], rewrites the first argument of every TOPN whatever it
   * is — including a TOPN written on purpose inside a measure, such as
   * TOPN(5, ...) for a top-five list. Usually not what you want.
   */
  matches: [501, 1001, 3001, 30001],
};

/** Names the Download button gives the saved file. */
export const FILE_NAMES = {
  json: 'query.json',
  dax: 'query.dax',
};