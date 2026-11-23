/**
 * Clipboard access, with a fallback for browsers that block the async
 * Clipboard API outside a secure context (plain http, some locked-down
 * corporate profiles).
 */

/** Can this browser read the clipboard without a paste gesture? */
export const canReadClipboard =
  typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.readText);

/**
 * Copy text to the clipboard.
 *
 * @param {string} text
 * @returns {Promise<boolean>} true when the text was copied
 */
export async function copyText(text) {
  if (!text) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea method below.
    }
  }

  return copyViaTextarea(text);
}

/**
 * Read text from the clipboard. Resolves to null when the browser refuses,
 * which is normal: the user can still paste by hand.
 *
 * @returns {Promise<string|null>}
 */
export async function readText() {
  if (!navigator.clipboard?.readText) return null;
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

/**
 * Legacy copy path: select a detached textarea and ask the document to copy it.
 *
 * @param {string} text
 * @returns {boolean}
 */
function copyViaTextarea(text) {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.top = '-1000px';
  field.style.opacity = '0';

  document.body.appendChild(field);
  field.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(field);
  return copied;
}
