import { DIRECTION } from '../lib/daxToJson.js';

const MODES = [
  { value: DIRECTION.daxToJson, label: 'DAX to JSON' },
  { value: DIRECTION.jsonToDax, label: 'JSON to DAX' },
];

/**
 * Page title, one line of explanation, and the switch that decides which way
 * the conversion runs.
 */
export function AppHeader({ direction, onDirectionChange }) {
  return (
    <header className="app-header">
      <div className="app-header__text">
        <h1 className="app-title">DAX to JSON converter</h1>
        <p className="app-subtitle">
          Paste a query, copy the JSON envelope. Nothing leaves your browser.
        </p>
      </div>

      <div className="mode-switch" role="group" aria-label="Conversion direction">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            className={`ds-btn ds-btn--pill${direction === mode.value ? ' is-selected' : ''}`}
            aria-pressed={direction === mode.value}
            onClick={() => onDirectionChange(mode.value)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </header>
  );
}
