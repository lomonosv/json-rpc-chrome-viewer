# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Manifest V3 Chrome extension that adds a **JSON-RPC Chrome Viewer** panel to DevTools. It captures JSON-RPC traffic over both HTTP and WebSocket, normalises it into one request model, and renders it with filtering, resizable panes, resend, themes and keyboard navigation.

## Commands

```bash
npm run build      # clean → lint → tsc -noEmit → esbuild → env substitution
npm run lint       # eslint + stylelint
npm run eslint     # eslint only (cached in .cache/eslint)
npm run stylelint  # stylelint only (src/**/*.scss)
npm run clean      # rm -rf build
npm run release    # release-it (tags, GitHub release, bumps manifest version)
```

There is **no test suite** — no test runner is configured. Verification means `npm run lint`, `npx tsc -noEmit`, and a build.

### Build gotchas

- **`node scripts/build.js` uploads source maps to Sentry** whenever `SENTRY_AUTH_TOKEN` is in the environment, creating a real release in the `json-rpc-chrome-viewer` Sentry org. For local verification use `SENTRY_AUTH_TOKEN= node scripts/build.js` to suppress the upload.
- `npm run build` requires a `.env` file — `scripts/envSubstitute.js` calls `process.exit(1)` if dotenv parses nothing.
- `build/` is the unpacked extension root — load it via `chrome://extensions` → Load unpacked.
- The version lives in **both** `package.json` and `static/manifest.json`; `@release-it/bumper` keeps them in sync during `npm run release`. Don't hand-edit one alone.

## Architecture

### Four execution contexts

The single most important thing to understand: code here runs in four separate JS realms that cannot share memory, and each has a different bundling story.

1. **DevTools page** — `static/index.js`. Plain JS, **not bundled or type-checked**, copied verbatim into the build. Registers the panel.
2. **Panel app** — `src/index.tsx` → React, bundled to `build/application.js`, hosted by `static/application.html`.
3. **Content script (ISOLATED world)** — `src/content/content.ts`. Declared in the manifest.
4. **Page script (MAIN world)** — `src/content/websockets.ts`. Registered *dynamically* by the service worker (`src/content/background.ts`) with `world: 'MAIN'`, because it must monkey-patch `window.WebSocket` inside the page's own realm, which an isolated content script cannot reach.

### The cold-start buffer

`static/index.js` starts listening to `chrome.devtools.network.onRequestFinished` immediately when DevTools opens — before the React panel exists — and buffers matches in an array. On the panel's first `onShown` it removes its own listeners and hands the buffer over by dispatching an `INITIAL_REQUESTS_DATA` CustomEvent into `panelWindow`. `HttpArchiveContext` listens for that event and merges the backlog.

This is why requests made before you open the panel still appear, and why listener registration is split across two files. Changing one side without the other silently drops the backlog.

### Two capture paths, one model

- **HTTP**: `chrome.devtools.network.onRequestFinished` → `isJsonRpcRequest()` → `getPreparedHttpRequest()`.
- **WebSocket**: page `WebSocket` → `InterceptedWebSocket` (MAIN) → `window.postMessage` → `content.ts` (ISOLATED) → `chrome.runtime.sendMessage` → `handleRuntimeMessage` in the panel.

Both normalise into `IRequest` (`src/logic/HTTPArchive/IRequest.ts`), discriminated by `isWebSocket`. Detection is a regex for `"jsonrpc": "2.0"` against the raw body, not a JSON parse, so it tolerates SockJS's double-encoded string frames — `parseJsonRpcMessage()` unwraps those. **JSON-RPC batches are exploded into one `IRequest` per batch item**, with responses correlated back by `id`.

### State

Nested providers in `src/components/Application.tsx`, and **the order is load-bearing**:

```
ErrorBoundary → SettingsContext → HttpArchiveContext → CacheContext → Layout
```

`HttpArchiveContext` reads `preserveLog`, the include-log filters and the column-visibility flags from `SettingsContext`, so it must nest inside it.

Every context follows the same shape — match it when adding one:

```ts
const useX = () => { /* state */ return { ... }; };
type XContextType = ReturnType<typeof useX>;
export const XContext = createContext<XContextType>(null);
export const useXContext = () => useContext(XContext);
export default ({ children }) => <XContext.Provider value={ useX() }>{ children }</XContext.Provider>;
```

`HttpArchiveContext` keeps `requestsRef.current` mirroring the `requests` state because its Chrome event listeners are registered in an effect keyed only on `preserveLog`; the callbacks would otherwise close over stale state. Mutate the ref and then `setRequests(requestsRef.current)` — don't replace this with a plain setter.

### The request list

`RequestList` renders a Method column plus four optional meta columns — Waterfall, Status, Size, Time — each gated on a `SettingsContext` flag. Method is deliberately not hideable; it is what identifies a row.

**Sorting lives in `HttpArchiveContext`, not in the component.** Keyboard navigation (↑/↓) walks the same `filteredRequests` array, so sorting anywhere else would let the arrow keys traverse a different order than the one on screen. Default is `SortField.Waterfall` ascending; clicking a header toggles asc/desc, clicking a different one resets to asc. Ties break on `startTime`, because arrival order is *completion* order for HTTP.

Sorting by a hidden column is handled by **deriving** rather than storing a correction:

```ts
const fallbackSortField = showWaterfallColumn ? SortField.Waterfall : SortField.Method;
const effectiveSortField = isColumnVisible[sortField] ? sortField : fallbackSortField;
```

Do not replace this with a `useEffect` that resets `sortField` — that trips `react-hooks/set-state-in-effect`, costs a correcting re-render, and loses the user's original choice when the column is shown again.

`IRequest.startTime` (epoch ms) drives both the waterfall and the default sort. HTTP takes it from the HAR entry's `startedDateTime`, guarded against `NaN` since that would corrupt sort order *and* bar geometry. WebSocket messages have no HAR entry, so they use `Date.now()` at panel arrival — slightly later than wire time, and they render as an instantaneous tick rather than a bar.

`getRequestLabel()` in `filters.ts` derives the Method-column text and is what the Method sort orders by. `matchesLabel()` in the same file keeps its own copy of that expression — it relies on `.toLowerCase?.()` short-circuiting for numeric websocket ids, so routing it through `getRequestLabel`'s `String()` coercion would change filter behaviour.

### Search

`matchesFilter(request, filter, scope, isCaseSensitive)` in `filters.ts` is the single matcher; `HttpArchiveContext` calls it from the filter effect and the include-log toggles gate it. `SearchScope` (`SearchScope.ts`) picks the haystack:

- `Method` — the label expression above. **Default, and the only scope that preserves pre-1.9 behaviour**: a websocket row whose sole identifier is a numeric id fails `matchesLabel` even for an empty filter, so it stays hidden. Every other scope shows those rows.
- `Request` — `method` + serialised `params`.
- `Response` — serialised `result` + `error` (so error codes and messages match), falling back to `rawResponse` when the body did not parse.
- `All` — label, request text and response text.

Both haystacks come from `getSearchText()`, memoised in a module-level `WeakMap` keyed on the `IRequest`; requests are immutable once prepared, so this serialises each one once rather than on every keystroke. A websocket frame feeds *both* haystacks from the same `websocketJSON` — direction does not decide which half it is, since a server can push a `method`/`params` notification as an income message.

Matches are painted by `useSearchHighlight` (`src/logic/common/useSearchHighlight.ts`) with the **CSS Custom Highlight API**, not by wrapping text in elements: the JSON panes are rendered by `@microlink/react-json-view` and its DOM is not ours to mutate. The hook walks text nodes into `Range`s and registers them under a name from `HighlightName`; each pane needs its own name because `CSS.highlights` is a page-wide registry. A `MutationObserver` rebuilds the ranges because the viewer mounts a tick late and re-renders on expand/collapse — highlights never touch the DOM, so this cannot feed itself. Ranges are capped at 2000 (they are spread into the `Highlight` constructor).

The `::highlight(...)` rules live in `src/index.scss` because highlight names are global; CSS Modules leaves them alone since they contain no class names. Keep them kebab-case — stylelint's `selector-type-case` reads the argument as a type selector and rejects camelCase. Highlighting is independent of scope: every occurrence in the list and in both panes lights up, whatever the search is filtering on.

The list highlight is rooted at the scroll container and passed `.requestsHeaderWrapper` as a skip selector, since the sticky header lives inside it and would otherwise match on column names.

Batch requests share one HAR entry, so every row exploded from a batch carries an identical `startTime` and `time` and renders identical bars.

### Persistence

All settings flow through `getConfig()` in `src/logic/common/helpers.ts` into `chrome.storage.local`, keyed with a `settings_` prefix. Adding one means touching five places in `SettingsContext.tsx`: a `default*Value` const, a `useState`, a `getConfig` call in the load effect, a `handle*Change` writer, and two entries in the returned object. Column visibility follows this as `settings_showWaterfallColumn`, `settings_showStatusColumn`, `settings_showSizeColumn`, `settings_showTimeColumn`. Search scope and case sensitivity follow it too, as `settings_searchScope` and `settings_caseSensitiveSearch` — the search *term* itself stays in `HttpArchiveContext` and is not persisted. `settings_expandLevel` follows it as well; the Settings row for it renders only while `expandTreeState` is `Expanded`, since it has no meaning for the other two states.

### JSON tree open depth

`getCollapsed()` in `JsonViewer.tsx` maps the pane's open state onto react-json-view's `collapsed`, which doubles as a boolean and a depth: `Collapsed` → `true`, `Default` → `defaultOpenNodesDepth` (1, or 2 for the response pane), `Expanded` → the configured `expandLevel`, or `false` for unlimited. `expandAllLevels` (`ExpandLevel.ts`) is that unlimited sentinel and is **0**, which cannot collide with a real depth because "open nothing" is already `ExpandTreeState.Collapsed`. It is also the default, so Expanded keeps meaning fully-expanded for existing users.

`RequestInfo` and `ResponseInfo` mirror `expandLevel` into local state next to `expandTreeStateValue` and reset it to `expandAllLevels` in their `onChangeState` handler. That is deliberate: the pane chevron says "Expand all", so a manual expand must ignore the configured depth — otherwise the button would look broken whenever the tree is already open to that level. The setting governs how a pane *opens*, not what the button does.

`EditRequestModal` hardcodes `ExpandTreeState.Expanded` and passes no level, so the editor stays fully expanded regardless of the setting. Websocket messages run off the separate `expandedWebsocketMessagesState` and have no level of their own.

Sort field and direction are **not** persisted — they reset with the panel.

Note the cross-realm coupling: `static/index.js` reads `settings_preserveLog` straight from storage to decide whether to flush its buffer on navigation, so that key name is shared between the bundled app and the unbundled DevTools page.

### Dependency injection

`inversify` container created in `src/logic/DI/createContainer.tsx` and exposed via `useDIContext()`. The surface is tiny — the only binding is `DITypes.Scope`, bound at runtime by `SentryIntegration`.

### Sentry: deliberately narrow

`SentryIntegration.tsx` uses `new BrowserClient()` plus a local `Scope` — **not** `Sentry.init()` — and filters `GlobalHandlers`, `BrowserApiErrors` and `Breadcrumbs` out of the default integrations.

Consequence: **only React render/lifecycle errors reaching `ErrorBoundary.componentDidCatch` are reported.** Uncaught window errors, errors thrown inside event handlers, and unhandled promise rejections are silently dropped — twice over, since the client is never registered globally, so `getClient()` inside `GlobalHandlers` wouldn't match it anyway. This is intentional, not a bug. Enabling global capture requires both un-filtering the integrations *and* calling `setCurrentClient(client)`.

## Build pipeline

`scripts/build.js` (esbuild) emits `application` from `src/index.tsx` plus one bundle per `.ts` in `src/content/`, named `content/<name>`. Then:

- **SCSS** goes through `esbuild-sass-plugin` with `postcssModules`, so `import styles from './x.scss'` yields hashed class names. Use `:global(...)` to opt out of scoping (see `src/index.scss`). Shared theme variables live in `src/components/common/variables.scss` and are pulled in with namespaced `@use` — `@use "../variables";` then `variables.$color`, not a bare `@import`.
- **SVGs** load as `text` (`loader: { '.svg': 'text' }`) and are injected via `dangerouslySetInnerHTML` in `Icon.tsx`.
- Dark theme is a `body.isDark` class toggled in `Layout.tsx`, so theme overrides are written as nested `:global(.isDark) & { … }`, never a media query.
- **`process.env.X` is not substituted by esbuild.** `scripts/envSubstitute.js` rewrites those tokens textually across `build/` after bundling, using `.env`. Env values therefore only exist after a full `npm run build`, never after a bare `node scripts/build.js`.
- Path aliases `~/logic/*` and `~/components/*` come from `tsconfig.json` and are resolved by esbuild from there.

## Styling pitfalls

The request-list table is hand-built from flexbox, and these bit repeatedly. When a rule's outcome depends on specificity, **verify against the compiled CSS in `build/application.js`** rather than reasoning about it — the class names are hashed, so grep for the rule text.

- **There is no global `box-sizing: border-box`.** Cells that carry a border or padding must set it explicitly, or `width: 100px` silently becomes 101px and the header stops lining up with the rows.
- **Header and row geometry must match exactly.** Both `.requestsHeader` and `.requestWrapper` right-align their meta group via `justify-content: space-between`, so any difference in horizontal padding or cell width shifts every separator. The shared `Header` component pads `0 9px`; the list overrides it to `0 7px` to match the rows.
- **Row vertical padding lives on `.methodWrapper`, not `.requestWrapper`.** Borders paint on the padding box, so padding on the row would make every column separator stop short of the row edges. `.methodWrapper` sets row height instead, and the stretched meta cells inherit it.
- `.requestWrapper` and `.meta` use `align-items: stretch` so separators span full row height. `.methodWrapper` re-centres its own content with `flex-direction: column; justify-content: center`.
- **`.sortableHeader` resets `border: none`** for the native `<button>` headers; `.metaHeaders > button` at (0,1,1) re-adds `border-left` and must out-specify it.
- **`.bar` and `.tick` are applied together** in `Waterfall.tsx`. Their `:global(.isDark)` overrides tie at (0,2,0), so `.tick` must stay declared *after* `.bar` or websocket ticks render blue in dark mode.
- Header cells are real `<button>`s. Keep it that way — clickable `<div>`s reintroduce the `jsx-a11y` findings this config now suppresses.

Waterfall colours are `$waterfallBar` / `$waterfallTick` and `$darkWaterfallBar` / `$darkWaterfallTick` in `variables.scss`, drawn from the Chrome DevTools palette so the panel reads as native. Note `$greenHeaderBackground` is still neon `#32ff00`, used by the WEBSOCKET badge and the income/outcome triangles.

## Toolchain constraints

These are pinned deliberately — verify before "upgrading" past them:

- **ESLint 9 with flat config** (`eslint.config.mjs`, built on `eslint-config-airbnb-extended`). ESLint 10 is blocked: `eslint-plugin-react@7.37.5` still calls `context.getFilename()`, which v10 removed. Recheck when that plugin ships v10 support.
- **TypeScript is capped at 6.0.x** — `typescript-eslint` peers `typescript <6.1.0`, and this repo uses type-aware linting.
- `tsconfig.json` pins `"strict": false` and an explicit `"types": ["chrome", "node"]` because TS 6 flipped both defaults. The `strict` pin preserves existing behaviour; turning it on surfaces ~50 real null-safety errors.
- **Node 24 in CI.** Older Node fails outright: `eslint-plugin-n` and `stylelint` use `with { type: "json" }` import attributes, and release-it 21 requires `^22.21 || >=24`.
- Rules conflicting with this codebase's conventions (arrow-function components, TS optional props in place of `defaultProps`, JSX formatting) are disabled in `eslint.config.mjs`, as are `react-hooks/exhaustive-deps`, `react-hooks/set-state-in-effect` and the triggering `jsx-a11y` rules.
- **`npm run lint` is expected to report zero problems — no errors and no warnings.** Any output is something you introduced; fix it rather than adding to the baseline.
- `@stylistic/member-delimiter-style` is configured `delimiter: 'comma'` with `requireLast: true` for multiline. Interface and type members use commas **including a trailing one** on the last member; single-line members omit it.
