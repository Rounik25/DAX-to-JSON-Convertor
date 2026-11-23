# DAX to JSON converter

Paste a DAX query, get the JSON envelope back, copy it. Built for the round trip
between Power BI Performance Analyzer and anything that expects the query as a
JSON string.

```
DEFINE                              {
	VAR __Filter =            →       "query": "DEFINE\n\tVAR __Filter =\n..."
		FILTER(...)                 }
```

The conversion is plain JSON string encoding — newlines become `\n`, tabs become
`\t`, inner double quotes become `\"`, and the result sits under a single key.
Single quotes, slashes and brackets are left alone.

Everything runs in the browser. No query ever leaves the page, so model and
column names stay on the machine they were pasted from.

## What it does

- Converts in both directions: DAX to JSON, and JSON back to runnable DAX
- Copies to the clipboard in one click, or with <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
- Verifies every conversion by decoding its own output and comparing it to the
  input, so a bad escape is caught before anyone pastes it somewhere
- Handles the awkward cases: byte order marks, Windows line endings, accented
  characters, tabs at ten levels of nesting
- Produces either the plain `{ "query": ... }` object or the full
  `executeQueries` request body for the Power BI REST API
- Downloads the result as `query.json` or `query.dax`

## Running it locally

Node 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build into `dist/` |
| `npm run build:single` | One self-contained `dist-single/index.html` |
| `npm run preview` | Serves the production build locally |
| `npm test` | Runs the unit and render tests |
| `npm run test:watch` | Reruns tests as files change |

## Putting it on GitHub Pages

The repository ships with a workflow that tests, builds and publishes on every
push to `main`.

1. Create the repository and push this folder to it.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main`, or run the workflow by hand from the **Actions** tab.

The site lands at `https://<account>.github.io/<repository>/`. Send that link to
the team — nothing to install on their side.

A few things worth knowing:

- Asset paths are relative (`base: './'` in `vite.config.js`), so the build works
  under any repository name, at a custom domain, or opened straight off disk. No
  configuration to change.
- The workflow runs `npm ci`, which needs `package-lock.json` committed. It is.
- Pages on a **private** repository needs a paid plan. On a free plan, either
  make the repository public or use the single-file build below.

### Sharing without Pages

```bash
npm run build:single
```

That writes one `dist-single/index.html` with the CSS and JavaScript inlined —
around 170 KB. Email it, drop it on a shared drive, or open it by double-clicking.
It works offline and has no dependencies.

## How it is put together

```
src/
├── main.jsx                 Entry point: mounts React, loads the stylesheets
├── App.jsx                  Composes the panes, owns the keyboard shortcut
│
├── lib/                     Pure logic. No React, no DOM, fully testable.
│   ├── daxToJson.js         Encoding, decoding, verification, text measurement
│   ├── daxToJson.test.js    Unit tests for every rule above
│   ├── sample.js            The example query behind "Load example"
│   ├── clipboard.js         Copy and paste, with a fallback for locked-down browsers
│   └── download.js          Saves a string as a file
│
├── hooks/                   State, kept out of the view layer
│   ├── useConverter.js      Input, direction, options; derives the result
│   └── useCopy.js           Copies and reports back for two seconds
│
├── components/              View only — they receive props and render
│   ├── AppHeader.jsx        Title and the direction switch
│   ├── OptionsPanel.jsx     Key name, indentation, payload shape, escaping
│   ├── SourcePane.jsx       The textarea you paste into
│   ├── ResultPane.jsx       The result, copy, download, errors
│   ├── StatsRow.jsx         Line, character and size counts
│   ├── AppFooter.jsx        Privacy note and shortcut
│   └── icons.jsx            Inline SVG icons
│
└── styles/
    ├── tokens.css           Design tokens. The only place colours are defined.
    ├── recipes.css          Buttons, inputs, selects, checkboxes, notifications
    └── app.css              Layout for this app
```

The split that matters: `lib/` knows nothing about React, `hooks/` know nothing
about markup, and `components/` hold no logic. To reuse the conversion
elsewhere — a Node script, a browser extension, another app — copy
`src/lib/daxToJson.js` on its own and call `convert()`.

```js
import { convert } from './lib/daxToJson.js';

const { ok, output, verified, error } = convert(daxText, {
  key: 'query',          // property the query sits under
  indent: 2,             // 2, 4, or 0 for a single line
  wrap: 'simple',        // or 'executeQueries'
  ensureAscii: false,    // escape non-ASCII as \uXXXX
  keepCrlf: false,       // keep \r\n instead of \n
  direction: 'daxToJson' // or 'jsonToDax'
});
```

## Options

| Option | Default | Effect |
| --- | --- | --- |
| Key name | `query` | The property the query string sits under. |
| Indentation | 2 spaces | Layout of the JSON itself. "Single line" minifies it. |
| Payload shape | Query object | Switch to `executeQueries` for the REST API body, including `serializerSettings`. |
| Escape accented characters | off | Writes non-ASCII as `\uXXXX`, matching `json.dumps(ensure_ascii=True)`. |
| Keep Windows line endings | off | Leaves `\r\n` in place instead of normalising to `\n`. |

Decoding accepts any of the three shapes the app can produce: the plain
envelope, the `executeQueries` body, or a bare JSON string.

## Tests

```bash
npm test
```

Covers the escaping rules, line-ending handling, both payload shapes, the key
lookup, error messages, and a round trip over a full Performance Analyzer query.
A render test mounts the whole component tree to catch crashes without a browser.
The deployment workflow runs the suite before it publishes, so a broken build
never reaches the team.
