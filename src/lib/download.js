/**
 * Save a string to the visitor's machine as a file.
 *
 * @param {string} filename
 * @param {string} text
 * @param {string} [mime]
 */
export function downloadText(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Give the browser a moment to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
