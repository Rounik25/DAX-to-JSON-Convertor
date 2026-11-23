import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import App from './App.jsx';

/**
 * Renders the component tree once, outside a browser. It catches broken
 * imports, bad props and crashes on first paint without needing a DOM.
 */
describe('App', () => {
  const markup = renderToStaticMarkup(createElement(App));

  it('renders the page title', () => {
    expect(markup).toContain('DAX to JSON converter');
  });

  it('renders both panes', () => {
    expect(markup).toContain('DAX query');
    expect(markup).toContain('Paste a query on the left');
  });

  it('renders the primary action', () => {
    expect(markup).toContain('Copy');
  });
});
