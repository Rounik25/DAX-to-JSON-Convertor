/**
 * Inline SVG icons. Drawn rather than typed as emoji, which render differently
 * across browsers and operating systems. Every icon takes its colour from the
 * surrounding element through `currentColor`.
 */

export function TickIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 8.5 L6 12 L13.5 4" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export function CopyIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="5.5" y="5.5" width="9" height="9" />
      <path d="M11 2.5 H2 v9 h2" />
    </svg>
  );
}

export function AlertIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M10 2 L18.5 17.5 H1.5 Z" />
      <path d="M10 7.5 v4" />
      <path d="M10 14.2 v1.2" />
    </svg>
  );
}
