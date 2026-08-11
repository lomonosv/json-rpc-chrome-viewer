# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Manifest V3 Chrome extension that adds a **JSON-RPC Chrome Viewer** panel to DevTools. It captures JSON-RPC traffic over both HTTP and WebSocket, normalises it into one request model, and renders it with scoped search, a phase-segmented waterfall with timing breakdowns, sortable/resizable/reorderable columns, resizable panes, resend, themes and keyboard navigation.

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

**Sorting lives in `HttpArchiveContext`, not in the component.** Keyboard navigation (↑/↓) walks the same `filteredRequests` array, so sorting anywhere else would let the arrow keys traverse a different order than the one on screen. Those handlers only move `selected` — they never scroll, so `Request.tsx` scrolls itself into view with `scrollIntoView({ block: 'nearest' })` when it becomes selected. `nearest` is what keeps a click on an already-visible row from jolting the list, and `.requestWrapper` carries `scroll-margin-top: 28px` so a row scrolled to the top edge is not tucked under the sticky header. Without this the arrows appear to work while descending — autoscroll has already parked the list at the bottom — and visibly break when ↑/↓ wrap around to the first row. Default is `SortField.Waterfall` ascending; clicking a header toggles asc/desc, clicking a different one resets to asc. Ties break on `startTime`, because arrival order is *completion* order for HTTP.

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

Batch requests share one HAR entry, so every row exploded from a batch carries an identical `startTime` and `time` and renders identical bars — and, now, identical timing breakdowns.

### Row actions

Each row carries a `.rowActions` slot after the method label — a copy button (all rows, copying `getRequestLabel(item)`) and a resend button (HTTP only). It is `display: none` until the row is hovered.

The wrapper **stops click propagation**, and must keep doing so: the row's own `onClick` selects the request, so without it copying a method name would also change the selection and swap out both info panes.

`CopyButton` confirms a copy by tinting its icon `$success` for 700ms rather than swapping to the word "Copied". That keeps its width fixed, which is what lets it sit in a row slot beside the resend button — restoring a text confirmation would reflow the method label mid-hover. The behaviour is shared by every copy button in the app, including the pane headers.

### Resizable and reorderable columns

The four meta columns are drag-resizable and drag-reorderable; Method is neither, because it is the flex remainder that absorbs whatever the others give up (`flex: 1 1 auto` with a 300px floor matching `.methodHeader`).

**Three gestures share one header button** — click to sort, drag the divider to resize, drag the body to reorder — and they stay untangled through two mechanisms that must both survive any refactor:

- The resize handle calls `stopPropagation()` on `pointerdown`. That is what keeps a resize from *also* starting a reorder, since the reorder listener lives on the button the handle sits inside. Its `pointermove`/`pointerup` deliberately do not stop propagation; the reorder handlers see them but bail out because no reorder drag was ever started.
- Both gestures leave a one-shot `suppressClickRef` that `SortableHeader` drains through `shouldIgnoreHeaderClick()` before sorting, because the click closing a drag targets the nearest common ancestor of pointerdown/pointerup — the button, once the pointer has left the 7px handle. **Both flags are read into locals before the `||`**; short-circuiting would leave the second one set and swallow the *next* legitimate sort click.

`useColumnReorder` hit-tests the pointer against live header rects rather than tracking indices arithmetically, since the columns are different widths. Dropping to the right of the origin needs `targetIndex - 1`, because that slot count still includes the column being lifted out. `normaliseColumnOrder` drops unknown fields and appends missing ones, so an order stored by an older build can neither hide a column nor resurrect a dead one; hidden columns stay in the order and keep their place for when they are shown again.

Row cells iterate the same `visibleColumns` array the header maps over — order and visibility are derived identically in `RequestList.tsx` and `Request.tsx`. That is the invariant to protect: rendering the meta cells as bespoke JSX again would let a reorder move the header and leave the rows behind.

Widths live in `RequestList/columns.ts` and reach the DOM as **CSS custom properties** — `getColumnWidthProperties()` sets `--column-waterfall` and friends once on the `.requestList` container, and `getColumnWidthStyle(field)` puts `width: var(--column-*)` on both the header cell and every row cell. That is the point: the header/row parity hazard above stops being an invariant someone has to remember and becomes one value with two readers. This is why the SCSS carries no widths and why `$waterfallColumnWidth` was deleted (its padding sibling remains, since padding is not resizable).

`useColumnResize` is hand-rolled rather than reusing `re-resizable`, which resizes a box by its own edges; a column divider instead has to turn horizontal travel into a width for a sibling header. Two things there are load-bearing:

- **Drag direction is inverted.** The meta group is right-aligned and Method absorbs the remainder, so a column's right edge is pinned by the columns after it — `delta = startX - clientX`, i.e. dragging the divider *left* widens the column. That matches what the eye sees; flipping the sign makes resizing feel like it fights the pointer.
- **The click after a drag has to be swallowed.** Header cells are `<button>`s that toggle sorting, and the click that closes a drag targets the nearest common ancestor of the pointerdown/pointerup elements — the button itself, once the pointer has left the 7px handle. Stopping propagation on the handle is necessary but *not sufficient*. The drag therefore sets a one-shot `suppressClickRef` that `SortableHeader` consumes via `shouldIgnoreClick()` before sorting. Movement under `dragThresholdPx` is not treated as a drag, so a plain click on the divider still sorts.

Because a drag fires on every `pointermove`, `CacheContext` splits the write: `setColumnWidth` updates state (and a ref mirror) for the live drag, and only `persistColumnWidths` on pointerup touches `chrome.storage`. Restore merges over `defaultColumnWidths` and re-clamps, so a stored width from an older build cannot resurrect a size the current limits disallow.

### Pane dividers

The two pane dividers were always draggable — `re-resizable` renders a 10px (vertical) or 27px (horizontal) invisible grab strip — they just had no visual affordance. Each now paints a 2px line in `$resizeHandleColor` on hover via `::after`, matching the column dividers. The strip stays the full grab target; only the line lights up, so hovering does not put a fat block of colour on screen.

Note where the line goes on the horizontal one: `.resizableBottomHandlerWrapper` is positioned `bottom: -27px`, so the strip sits *below* the Request pane overlapping the Response header, and the actual pane boundary is its **top** edge. The `::after` is pinned to `top: 0` for that reason — centring it would draw the line in the middle of the Response header.

Growing columns past the container pushes the list into horizontal scroll rather than crushing Method. That already worked before this feature: `.requestsHeaderWrapper` is `inline-block; min-width: 100%` and the header is `position: sticky` on **top only**, so it scrolls sideways in lockstep with the rows.

### Waterfall timing breakdown

`chrome.devtools.network.Request` extends the HAR entry type, so `entry.timings` arrives free with every request; `getPreparedTimings()` in `filters.ts` normalises it onto `IRequest.timings`. Two HAR quirks are handled there and must not be "simplified" away:

- **`-1` means "does not apply"**, not zero — a reused connection reports `dns`/`connect`/`ssl` as `-1`. `isMeasured()` in `timings.ts` is the only gate; treating negatives as durations renders backwards bars and inflates the total.
- **Queueing is Chrome-specific.** It arrives as `_blocked_queueing` nested inside HAR's standard `blocked`, so `Stalled = blocked - queueing`. It is destructured (not read with dot access) purely to keep `no-underscore-dangle` quiet at that one boundary.

`getTimingGroups()` walks the phases in wire order and accumulates an `offset` per phase, which is what lets the tooltip lay the bars out end to end against a single `total`. **SSL is deliberately excluded from that accumulator**: HAR nests the TLS handshake *inside* `connect` rather than reporting it alongside, so adding it would count the same milliseconds twice and push the total past the request's real duration. It is instead spliced in as a nested row positioned at the tail of the connection. The resulting total matches HAR's own `entry.time` — a useful invariant to check against when changing this.

**Every bar with timings is segmented, however narrow, and every one of those tooltips is interactive.** An earlier version segmented only above a 12px width threshold and tied tooltip interactivity to segmentation. Do not reintroduce either: at session-length timelines most bars fall under any such threshold (a 588 ms call over a 30 s session renders ~3.6px), so the fallback became the common case and the feature the exception — and since the fallback colour was `$waterfallBar`, a *blue* bar, it read as a real phase rather than as "no detail here". Two interaction modes that depend on a width the user cannot see is worse than a few sub-pixel segments.

Segments skip `isNested` phases for the same reason SSL is excluded from the total: it would paint on top of "Initial connection" rather than extending the bar.

Hovering a phase row in the tooltip highlights the matching bar segment and dims the rest, which is why the tooltip takes the pointer. Two consequences are handled explicitly: closing is deferred by `closeDelayMs`, because the pointer crosses a gap between the row and the portalled tooltip which fires `mouseleave` before the tooltip's `mouseenter`; and a `mousedown` closes it immediately, so an interactive tooltip covering the rows beneath does not silently swallow a click aimed at one.

The phase palette lives in `variables.scss` as `$phaseIdle`/`$phaseSend`/`$phaseWait`/`$phaseDownload` (plus `$dark*`), emitted into both `waterfall.scss` and `waterfallTooltip.scss` through the `phaseTones` mixin so the bar and the popover cannot drift apart — CSS Modules hashes the class names per file, so they stay component-scoped despite the shared definition. The names match `TimingTone`. **The light values are deliberately paler than `$waterfallBar` / `$waterfallTick`**: a segmented bar is a solid block of colour on every row, and the saturated versions read as far too heavy down a full list.

`WaterfallTooltip` is portalled out of the list because the row sits inside the `overflow: auto` scroll container and would otherwise be clipped. It is therefore positioned against the viewport by hand in a `useLayoutEffect` — measured, flipped above the row when it will not fit below, and clamped horizontally — and stays `visibility: hidden` until that first measurement lands to avoid a flash in the wrong corner.

Rows with no timings — every websocket message, since those have no HAR entry — fall back to the original `title` attribute. The rich tooltip and the native one are mutually exclusive on purpose; rendering both gives you two overlapping tooltips.

### Persistence

All settings flow through `getConfig()` in `src/logic/common/helpers.ts` into `chrome.storage.local`, keyed with a `settings_` prefix. Adding one means touching five places in `SettingsContext.tsx`: a `default*Value` const, a `useState`, a `getConfig` call in the load effect, a `handle*Change` writer, and two entries in the returned object. Column visibility follows this as `settings_showWaterfallColumn`, `settings_showStatusColumn`, `settings_showSizeColumn`, `settings_showTimeColumn`. Search scope and case sensitivity follow it too, as `settings_searchScope` and `settings_caseSensitiveSearch` — the search *term* itself stays in `HttpArchiveContext` and is not persisted. `settings_expandLevel` follows it as well; the Settings row for it renders only while `expandTreeState` is `Expanded`, since it has no meaning for the other two states.

### JSON tree open depth

`getCollapsed()` in `JsonViewer.tsx` maps the pane's open state onto react-json-view's `collapsed`, which doubles as a boolean and a depth: `Collapsed` → `true`, `Default` → `defaultOpenNodesDepth` (1, or 2 for the response pane), `Expanded` → the configured `expandLevel`, or `false` for unlimited. `expandAllLevels` (`ExpandLevel.ts`) is that unlimited sentinel and is **0**, which cannot collide with a real depth because "open nothing" is already `ExpandTreeState.Collapsed`. It is also the default, so Expanded keeps meaning fully-expanded for existing users.

`RequestInfo` and `ResponseInfo` mirror `expandLevel` into local state next to `expandTreeStateValue` and reset it to `expandAllLevels` in their `onChangeState` handler. That is deliberate: the pane chevron says "Expand all", so a manual expand must ignore the configured depth — otherwise the button would look broken whenever the tree is already open to that level. The setting governs how a pane *opens*, not what the button does.

`EditRequestModal` hardcodes `ExpandTreeState.Expanded` and passes no level, so the editor stays fully expanded regardless of the setting. Websocket messages run off the separate `expandedWebsocketMessagesState` and have no level of their own.

Sort field and direction are **not** persisted — they reset with the panel.

**There is a second, separate family of persisted values.** Layout state — `requestSectionHeight`, `requestListSectionWidth`, `columnWidths`, `columnOrder` — lives in `CacheContext`, is written **without the `settings_` prefix**, and never appears in the Settings dialog. Do not add layout state to `SettingsContext` by following the five-step recipe above; it belongs in `CacheContext`, which also owns the pattern for values that change continuously during a drag (ref mirror + a deferred write, see Resizable columns). `getConfig()` is shared by both and accepts an object default for the two structured keys.

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
- **Header and row geometry must match exactly.** Both `.requestsHeader` and `.requestWrapper` right-align their meta group via `justify-content: space-between`, so any difference in horizontal padding or cell width shifts every separator. The shared `Header` component pads `0 9px`; the list overrides it to `0 7px` to match the rows. **Column widths are no longer in SCSS at all** — see Resizable columns below; do not reintroduce a `width` on `.metaHeaders > button` or `.meta > div`, as it would override the shared custom property for one side only and desynchronise the two.
- **Row vertical padding lives on `.methodWrapper`, not `.requestWrapper`.** Borders paint on the padding box, so padding on the row would make every column separator stop short of the row edges. `.methodWrapper` sets row height instead, and the stretched meta cells inherit it.
- `.requestWrapper` and `.meta` use `align-items: stretch` so separators span full row height. `.methodWrapper` re-centres its own content with `flex-direction: column; justify-content: center`.
- **`.sortableHeader` resets `border: none`** for the native `<button>` headers; `.metaHeaders > button` at (0,1,1) re-adds `border-left` and must out-specify it.
- **`.isCopied.isCopied` in `copyButton.scss` is doubled on purpose, not a typo.** `Button` paints `fill` from its own `.button` rule at (0,1,0) in a *different* stylesheet, so a single class here would win or lose on bundle order rather than on intent. Doubling it to (0,2,0) makes it deterministic.
- **`.bar` and `.tick` are applied together** in `Waterfall.tsx`. Their `:global(.isDark)` overrides tie at (0,2,0), so `.tick` must stay declared *after* `.bar` or websocket ticks render blue in dark mode.
- Header cells are real `<button>`s. Keep it that way — clickable `<div>`s reintroduce the `jsx-a11y` findings this config now suppresses.

Waterfall colours are `$waterfallBar` / `$waterfallTick` and `$darkWaterfallBar` / `$darkWaterfallTick` in `variables.scss`, drawn from the Chrome DevTools palette so the panel reads as native. These now cover only the *unsegmented* bar (a row with no timings) and the websocket tick — a segmented bar and the popover both use the separate `$phase*` palette described under Waterfall timing breakdown, which is deliberately paler. `$resizeHandleColor` is shared by the column dividers and both pane dividers. Note `$greenHeaderBackground` is still neon `#32ff00`, used by the WEBSOCKET badge and the income/outcome triangles.

## Toolchain constraints

These are pinned deliberately — verify before "upgrading" past them:

- **ESLint 9 with flat config** (`eslint.config.mjs`, built on `eslint-config-airbnb-extended`). ESLint 10 is blocked: `eslint-plugin-react@7.37.5` still calls `context.getFilename()`, which v10 removed. Recheck when that plugin ships v10 support.
- **TypeScript is capped at 6.0.x** — `typescript-eslint` peers `typescript <6.1.0`, and this repo uses type-aware linting.
- `tsconfig.json` pins `"strict": false` and an explicit `"types": ["chrome", "node"]` because TS 6 flipped both defaults. The `strict` pin preserves existing behaviour; turning it on surfaces ~50 real null-safety errors.
- **Node 24 in CI.** Older Node fails outright: `eslint-plugin-n` and `stylelint` use `with { type: "json" }` import attributes, and release-it 21 requires `^22.21 || >=24`.
- Rules conflicting with this codebase's conventions (arrow-function components, TS optional props in place of `defaultProps`, JSX formatting) are disabled in `eslint.config.mjs`, as are `react-hooks/exhaustive-deps`, `react-hooks/set-state-in-effect` and the triggering `jsx-a11y` rules.
- **`npm run lint` is expected to report zero problems — no errors and no warnings.** Any output is something you introduced; fix it rather than adding to the baseline.
- `@stylistic/member-delimiter-style` is configured `delimiter: 'comma'` with `requireLast: true` for multiline. Interface and type members use commas **including a trailing one** on the last member; single-line members omit it.
