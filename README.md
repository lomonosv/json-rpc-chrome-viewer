# JSON-RPC Chrome Viewer

A Chrome DevTools extension for working with **JSON-RPC** traffic. It adds a dedicated panel that captures JSON-RPC calls over both HTTP and WebSocket, decodes them, and presents them in a way that is actually readable - instead of hunting through the Network tab for POSTs that all share the same URL.

Built on Manifest V3. MIT licensed.

## Why

Every JSON-RPC call to a given endpoint hits the same URL with the same method (`POST`), so Chrome's Network panel shows a wall of identical-looking rows. This extension keys off the RPC method name instead, splits batches into individual entries, pairs each request with its response, and lets you filter, sort and resend.

## Features

**Capture**

- Detects JSON-RPC 2.0 requests automatically - no configuration or URL patterns to set up
- **WebSocket support** - intercepts `window.WebSocket` to capture RPC messages over sockets, including SockJS-style encoded frames
- **Batch requests** are split into one row per call, with responses correlated back by `id`
- **Background accumulation** - requests are buffered from the moment DevTools opens, so calls made before you switch to the panel are not lost
- **Preserve log** across page navigations

**Inspect**

- Side-by-side request and response panes with a collapsible JSON tree
- **Convert a response to TypeScript types** with one click
- **Resend a request** after editing its body
- Copy request or response to the clipboard, or **copy a method name** straight from its row
- Error and unparseable-response rows are colour-coded
- **CORS badge** for cross-origin calls, **WebSocket badge** for socket messages

**Navigate**

- **Waterfall column** showing each request's start offset and duration on a shared timeline, with the bar split into connection / request / waiting / download phases
- **Timing breakdown on hover** - Queueing, Stalled, DNS, connection, SSL, request sent, waiting and content download, like the Network panel's popover. Hovering a phase highlights it on the bar
- **Search** across method names, request params, response results and error codes/messages - switch scope between Method, Request, Response or All, with an optional case-sensitive toggle. Matches are highlighted in the list and in both JSON panes
- **Sortable columns** - click any header to sort ascending/descending
- **Resizable and reorderable columns** - drag a column's left divider to resize it, or drag the header itself to change the order. Both persist
- **Configurable columns** - show or hide Waterfall, Status, Size and Time
- Keyboard navigation with <kbd>↑</kbd> / <kbd>↓</kbd>, scrolling the selection into view
- Resizable panes that remember their size
- Autoscroll to the latest request

**Appearance**

- Dark and light themes, following the DevTools theme by default
- ~35 selectable JSON tree viewer colour themes
- Configurable default JSON tree open state, separately for HTTP and WebSocket messages - and when set to Expanded, how many levels deep to open

## Install

### From the Chrome Web Store

Search for **JSON-RPC Chrome Viewer** in the Chrome Web Store and click Add to Chrome.

### From source

```bash
git clone https://github.com/lomonosv/json-rpc-chrome-viewer.git
cd json-rpc-chrome-viewer
npm ci
npm run build
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `build/` directory.

Building requires a `.env` file in the project root - see [Environment](#environment).

## Usage

1. Open Chrome DevTools on a page that makes JSON-RPC calls.
2. Select the **JSON-RPC Chrome Viewer** panel.
3. Trigger some traffic. Requests appear as they complete; WebSocket messages appear as they arrive.

Select a row to see its request and response. The toolbar holds the search field, its scope selector and a **Aa** case-sensitivity toggle; the gear icon opens Settings.

A request is treated as JSON-RPC when it is a POST with an `application/json` body containing `"jsonrpc": "2.0"`. WebSocket frames are matched the same way.

## Settings

| Section | Setting |
| --- | --- |
| General | Preserve log · Autoscroll to the latest request |
| Appearance | Theme · Show url for each request · Show CORS badge · Show Websocket badge · Columns (Waterfall, Status, Size, Time) · JSON Tree Viewer Theme · JSON Tree Open State · Expand Level (shown only when Open State is Expanded) · JSON Tree Open State (Websocket Messages) |
| Filters | Include JSON-RPC Logs · Include Websocket Logs |

Search scope and case sensitivity live in the toolbar rather than this dialog, but persist the same way.

Settings persist in `chrome.storage.local`, along with pane sizes and column widths/order. The Method column is always shown, since it identifies the row, and is the only one that cannot be resized or reordered - it absorbs whatever width the other columns give up.

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Persist settings, pane sizes and column widths/order |
| `activeTab`, `scripting` | Register the WebSocket interceptor in the page |
| `clipboardWrite` | Copy request/response payloads and method names |
| `http://*/*`, `https://*/*` | Observe traffic on the inspected page |

Captured traffic stays local - it is held in memory in the DevTools panel and is not transmitted anywhere. The only outbound requests the extension makes are optional crash reports from its own panel code, sent when a `SENTRY_DSN` is configured at build time.

## Development

Requires **Node 24+** (CI runs 24.x).

```bash
npm ci
npm run build      # clean → lint → typecheck → bundle → env substitution
npm run lint       # eslint + stylelint
npm run eslint
npm run stylelint
npm run clean
```

`npm run build` writes the unpacked extension to `build/`. Reload it from `chrome://extensions` after each build to pick up changes.

There is no test suite; verification is lint, `tsc -noEmit`, and a build. Lint is expected to report zero problems.

### Environment

Create a `.env` file in the project root:

```ini
SENTRY_DSN=<your sentry dsn>
ENVIRONMENT=development
```

`scripts/envSubstitute.js` inlines these into the bundle after esbuild runs, so they only take effect via the full `npm run build` - not a bare `node scripts/build.js`. The build exits non-zero if `.env` is missing.

`SENTRY_AUTH_TOKEN` is optional and only used to upload source maps during a release build. If it is set in your shell, a local build will upload to Sentry - unset it (`SENTRY_AUTH_TOKEN= npm run build`) to avoid that.

### Project layout

```
src/
  components/      React UI (co-located .scss modules)
  content/         Content scripts + service worker
  logic/           Contexts, request model, helpers
static/            manifest.json, DevTools page, icons
scripts/           esbuild build + env substitution
```

The panel UI, the DevTools page, the content script and the page-level WebSocket interceptor run in four separate JavaScript realms. `CLAUDE.md` documents how they communicate.

### Release

```bash
npm run release
```

Runs `release-it`: lints, typechecks, builds, bumps the version in both `package.json` and `static/manifest.json`, tags, and creates a GitHub release. The packaged `build/` directory is then uploaded to the Chrome Web Store manually.

## Contributing

Feature requests, bug reports and pull requests are welcome - please open an [issue](https://github.com/lomonosv/json-rpc-chrome-viewer/issues) or a PR.

## License

[MIT](LICENSE)
