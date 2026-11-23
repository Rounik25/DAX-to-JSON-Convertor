import { formatBytes, measure } from '../lib/daxToJson.js';

/**
 * Line, character and size counts for one text surface.
 */
export function StatsRow({ text }) {
  const { lines, characters, bytes } = measure(text);

  if (!characters) return <p className="stats" />;

  return (
    <p className="stats">
      <span>
        <span className="stats__value">{lines.toLocaleString()}</span>{' '}
        {lines === 1 ? 'line' : 'lines'}
      </span>
      <span>
        <span className="stats__value">{characters.toLocaleString()}</span> characters
      </span>
      <span>
        <span className="stats__value">{formatBytes(bytes)}</span>
      </span>
    </p>
  );
}
