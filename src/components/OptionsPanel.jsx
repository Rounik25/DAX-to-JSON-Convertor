import { WRAP } from '../lib/daxToJson.js';

/**
 * The settings that change the generated JSON. Defaults match what most teams
 * paste around, so this panel can be ignored entirely on a normal day.
 */
export function OptionsPanel({ options, onChange, disabled = false }) {
  return (
    <section className="options" aria-label="Output settings">
      <div className="options__fields">
        <div className="options__field">
          <label className="ds-label" htmlFor="option-key">
            Key name
          </label>
          <input
            id="option-key"
            className="ds-input"
            type="text"
            value={options.key}
            spellCheck="false"
            autoComplete="off"
            onChange={(event) => onChange('key', event.target.value)}
          />
          <p className="options__help">The property the query sits under.</p>
        </div>

        <div className="options__field">
          <label className="ds-label" htmlFor="option-indent">
            Indentation
          </label>
          <select
            id="option-indent"
            className="ds-select"
            value={String(options.indent)}
            disabled={disabled}
            onChange={(event) => onChange('indent', Number(event.target.value))}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="0">Single line</option>
          </select>
          <p className="options__help">How the JSON itself is laid out.</p>
        </div>

        <div className="options__field">
          <label className="ds-label" htmlFor="option-wrap">
            Payload shape
          </label>
          <select
            id="option-wrap"
            className="ds-select"
            value={options.wrap}
            disabled={disabled}
            onChange={(event) => onChange('wrap', event.target.value)}
          >
            <option value={WRAP.simple}>Query object</option>
            <option value={WRAP.executeQueries}>REST executeQueries body</option>
          </select>
          <p className="options__help">Pick the second one to post to the API.</p>
        </div>
      </div>

      <div className="options__checks">
        <label className="ds-checkbox-row">
          <input
            className="ds-checkbox-input"
            type="checkbox"
            checked={options.ensureAscii}
            disabled={disabled}
            onChange={(event) => onChange('ensureAscii', event.target.checked)}
          />
          <span className="ds-checkbox" aria-hidden="true" />
          <span>Escape accented and non-English characters</span>
        </label>

        <label className="ds-checkbox-row">
          <input
            className="ds-checkbox-input"
            type="checkbox"
            checked={options.keepCrlf}
            disabled={disabled}
            onChange={(event) => onChange('keepCrlf', event.target.checked)}
          />
          <span className="ds-checkbox" aria-hidden="true" />
          <span>Keep Windows line endings</span>
        </label>
      </div>
    </section>
  );
}
