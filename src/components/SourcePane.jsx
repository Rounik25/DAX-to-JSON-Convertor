import { useId, useState } from 'react';
import { canReadClipboard, readText } from '../lib/clipboard.js';
import { AlertIcon } from './icons.jsx';
import { StatsRow } from './StatsRow.jsx';

/**
 * The pane you type or paste into.
 */
export function SourcePane({ title, placeholder, value, onChange, onLoadExample, onClear }) {
  const fieldId = useId();
  const [pasteBlocked, setPasteBlocked] = useState(false);

  const pasteFromClipboard = async () => {
    const text = await readText();
    if (text) {
      setPasteBlocked(false);
      onChange(text);
      return;
    }
    // Reading the clipboard needs permission that some browsers refuse inside
    // an embedded page. Say so rather than appearing to do nothing.
    setPasteBlocked(true);
  };

  return (
    <section className="pane">
      <div className="pane__head">
        <h2 className="pane__title">{title}</h2>

        <div className="pane__actions">
          {canReadClipboard && (
            <button type="button" className="ds-btn ds-btn--pill" onClick={pasteFromClipboard}>
              Paste
            </button>
          )}
          <button type="button" className="ds-btn ds-btn--pill" onClick={onLoadExample}>
            Load example
          </button>
          <button
            type="button"
            className="ds-btn ds-btn--pill"
            onClick={onClear}
            disabled={!value}
          >
            Clear
          </button>
        </div>
      </div>

      <label className="visually-hidden" htmlFor={fieldId}>
        {title}
      </label>
      <textarea
        id={fieldId}
        className="ds-textarea code"
        value={value}
        wrap="off"
        placeholder={placeholder}
        spellCheck="false"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(event) => onChange(event.target.value)}
      />

      <div aria-live="polite">
        {pasteBlocked && (
          <div className="ds-notification ds-notification--error pane__notice" role="alert">
            <AlertIcon className="notification-icon" />
            <span>
              <span className="notification-title">Paste blocked. </span>
              This browser will not hand over the clipboard. Click in the box and press Ctrl+V
              instead.
            </span>
          </div>
        )}
      </div>

      <div className="pane__footer">
        <StatsRow text={value} />
      </div>
    </section>
  );
}
