/**
 * Output format.
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

/** Names the Download button gives the saved file. */
export const FILE_NAMES = {
  json: 'query.json',
  dax: 'query.dax',
};
