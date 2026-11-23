import { downloadText } from '../lib/download.js';
import { AlertIcon, CopyIcon, TickIcon } from './icons.jsx';
import { StatsRow } from './StatsRow.jsx';

const COPY_LABEL = {
  idle: 'Copy',
  copied: 'Copied',
  failed: 'Press Ctrl+C',
};

/**
 * The read-only pane holding the converted text, plus the two things people
 * came here to do: copy it, or save it.
 */
export function ResultPane({ title, result, copyStatus, onCopy, emptyMessage, downloadName, mimeType }) {
  const { ok, output, verified, error } = result;
  const hasOutput = ok && Boolean(output);

  return (
    <section className="pane">
      <div className="pane__head">
        <h2 className="pane__title">{title}</h2>

        <div className="pane__actions">
          <button
            type="button"
            className="ds-btn ds-btn--pill"
            disabled={!hasOutput}
            onClick={() => downloadText(downloadName, output, mimeType)}
          >
            Download
          </button>
          <button
            type="button"
            className="ds-btn ds-btn--red"
            disabled={!hasOutput}
            onClick={() => onCopy(output)}
          >
            {copyStatus === 'copied' ? (
              <TickIcon className="btn-icon" />
            ) : (
              <CopyIcon className="btn-icon" />
            )}
            {COPY_LABEL[copyStatus]}
          </button>
        </div>
      </div>

      {hasOutput ? (
        <pre className="code code--output" tabIndex="0">
          {output}
        </pre>
      ) : (
        <p className="code code--output code--empty">
          {ok ? emptyMessage : 'Fix the input to see a result here.'}
        </p>
      )}

      <div aria-live="polite">
        {!ok && error && (
          <div className="ds-notification ds-notification--error pane__notice" role="alert">
            <AlertIcon className="notification-icon" />
            <span>
              <span className="notification-title">Cannot convert. </span>
              {error}
            </span>
          </div>
        )}

        {copyStatus === 'failed' && (
          <div className="ds-notification ds-notification--error pane__notice" role="alert">
            <AlertIcon className="notification-icon" />
            <span>
              <span className="notification-title">Copy blocked. </span>
              This browser refused clipboard access. Select the text and press Ctrl+C instead.
            </span>
          </div>
        )}
      </div>

      <div className="pane__footer">
        <StatsRow text={output} />
        {hasOutput && verified && (
          <span className="verify">
            <TickIcon className="verify__icon" />
            Decodes back to the original query
          </span>
        )}
      </div>
    </section>
  );
}
