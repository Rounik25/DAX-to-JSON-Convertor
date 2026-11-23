import { useEffect } from 'react';
import { AppFooter } from './components/AppFooter.jsx';
import { AppHeader } from './components/AppHeader.jsx';
import { ResultPane } from './components/ResultPane.jsx';
import { SourcePane } from './components/SourcePane.jsx';
import { FILE_NAMES } from './config.js';
import { useConverter } from './hooks/useConverter.js';
import { useCopy } from './hooks/useCopy.js';
import { DIRECTION } from './lib/daxToJson.js';

/** Everything that changes when the direction switch is flipped. */
const COPY = {
  [DIRECTION.daxToJson]: {
    sourceTitle: 'DAX query',
    resultTitle: 'JSON',
    placeholder:
      'Paste a DAX query here.\n\nCopy it straight out of Performance Analyzer or DAX Studio — tabs, blank lines and quotes are all handled.',
    emptyMessage: 'Paste a query on the left and the JSON appears here.',
    downloadName: FILE_NAMES.json,
    mimeType: 'application/json',
  },
  [DIRECTION.jsonToDax]: {
    sourceTitle: 'JSON',
    resultTitle: 'DAX query',
    placeholder: 'Paste a JSON payload here, for example {"query": "EVALUATE ..."}',
    emptyMessage: 'Paste a payload on the left and the query appears here.',
    downloadName: FILE_NAMES.dax,
    mimeType: 'text/plain',
  },
};

export default function App() {
  const { direction, setDirection, source, setSource, result, loadExample, clear } = useConverter();
  const { status: copyStatus, copy } = useCopy();

  const labels = COPY[direction];

  // Ctrl+Enter (Cmd+Enter on a Mac) copies the result from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && result.ok && result.output) {
        event.preventDefault();
        copy(result.output);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [copy, result]);

  return (
    <div className="app">
      <AppHeader direction={direction} onDirectionChange={setDirection} />

      <main className="panes">
        <SourcePane
          title={labels.sourceTitle}
          placeholder={labels.placeholder}
          value={source}
          onChange={setSource}
          onLoadExample={loadExample}
          onClear={clear}
        />

        <ResultPane
          title={labels.resultTitle}
          result={result}
          copyStatus={copyStatus}
          onCopy={copy}
          emptyMessage={labels.emptyMessage}
          downloadName={labels.downloadName}
          mimeType={labels.mimeType}
        />
      </main>

      <AppFooter />
    </div>
  );
}