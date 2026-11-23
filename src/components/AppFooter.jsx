/**
 * Two facts worth keeping on screen: where the data goes, and the shortcut.
 */
export function AppFooter() {
  return (
    <footer className="app-footer">
      <p>
        The conversion runs in this page. Your query is never sent anywhere, so it is safe to
        paste model and column names.
      </p>
      <p>
        Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to copy the result.
      </p>
    </footer>
  );
}
