# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Manifest V3 Chrome extension that adds a **JSON-RPC Chrome Viewer** panel to DevTools. It captures JSON-RPC traffic over both HTTP and WebSocket, normalises it into one request model, and renders it with scoped search, a phase-segmented waterfall with timing breakdowns, sortable/resizable/reorderable columns, resizable panes, resend, themes and keyboard navigation. It can also **intercept** responses, answering matched methods from a local rule instead of the network.

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
4. **Page scripts (MAIN world)** — `src/content/websockets.ts` and `src/content/interceptor.ts`. Registered *dynamically* by the service worker (`src/content/background.ts`) under one `main-world` id with `world: 'MAIN'`, because they must monkey-patch `window.WebSocket` and `window.fetch` inside the page's own realm, which an isolated content script cannot reach. `background.ts` calls `unregisterContentScripts()` with **no filter** before registering: the id changed when the interceptor joined the websocket patch, and unregistering by the new id alone would leave an upgrade running the old registration too.

Message names for every hop live in `src/logic/common/messages.ts` (`MessageType`). They sit under `~/logic` rather than beside the scripts because **the build globs every top-level `.ts` in `src/content/` into its own bundle** — a shared module placed there would emit a stray entry point. The same applies to any other code shared with a page script; put it under `~/logic`, or the build will hand you an extra file in `build/content/`.

### The cold-start buffer

`static/index.js` starts listening to `chrome.devtools.network.onRequestFinished` immediately when DevTools opens — before the React panel exists — and buffers matches in an array. On the panel's first `onShown` it removes its own listeners and hands the buffer over by dispatching an `INITIAL_REQUESTS_DATA` CustomEvent into `panelWindow`. `HttpArchiveContext` listens for that event and merges the backlog.

This is why requests made before you open the panel still appear, and why listener registration is split across two files. Changing one side without the other silently drops the backlog.

### Four capture paths, one model

- **HTTP**: `chrome.devtools.network.onRequestFinished` → `isJsonRpcRequest()` → `getPreparedHttpRequest()`.
- **WebSocket**: page `WebSocket` → `InterceptedWebSocket` (MAIN) → `window.postMessage` → `content.ts` (ISOLATED) → `chrome.runtime.sendMessage` → `handleRuntimeMessage` in the panel.
- **Intercepted HTTP**: page `fetch` → `interceptor.ts` (MAIN) → the same postMessage/relay hops → `getPreparedInterceptedRequest()`. A mocked call never reaches the network, so `chrome.devtools.network` never reports it and the page has to hand it over itself.
- **Observed HTTP** (resilient capture, opt-in): page `fetch` → `interceptor.ts` reports the call twice over the same relay — `PendingRequest` when it is sent, `ObservedRequest` when it settles — so the panel never needs `chrome.devtools.network` to see it at all. See Resilient capture below for why that is sometimes the only way.

All four normalise into `IRequest` (`src/logic/HTTPArchive/IRequest.ts`), discriminated by `isWebSocket`. Detection is a regex for `"jsonrpc": "2.0"` against the raw body, not a JSON parse, so it tolerates SockJS's double-encoded string frames — `parseJsonRpcMessage()` unwraps those. **JSON-RPC batches are exploded into one `IRequest` per batch item**, with responses correlated back by `id`.

All three HTTP paths share **one** builder, `getPreparedJsonRpcRequests(base, rawRequest, rawResponse)` in `filters.ts`: the caller supplies an `IPreparedRequestBase` with everything the JSON payload cannot say (timings, status, size, url, `isCors`, `isIntercepted`, `callId`) and the builder does the parse, the batch explode and the id correlation. Keep it that way — the batch-correlation code existed twice before the interceptor landed, and the two copies had already drifted (the batch branch read `isError` off the *request* item instead of the response, so an erroring item in a batch never coloured its row red).

### State

Nested providers in `src/components/Application.tsx`, and **the order is load-bearing**:

```
ErrorBoundary → SettingsContext → HttpArchiveContext → CacheContext → InterceptorContext → Layout
```

`HttpArchiveContext` reads `preserveLog`, the include-log filters and the column-visibility flags from `SettingsContext`, so it must nest inside it. `InterceptorContext` reads nothing from the others and nothing reads from it, which is why it sits innermost — moving it out would suggest a dependency that does not exist.

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

### Accordion view mode

`ViewMode` (`Panes` default, `Accordion`) is a `SettingsContext` value (`settings_viewMode`) chosen in Settings → Appearance. Panes is the untouched original layout — `RequestList` beside a fixed `RequestInfo`/`ResponseInfo`/`MessageInfo` pane. Accordion instead renders the selected row's detail **inline**, directly under that row in the same scroll container, and hides `Layout`'s right-hand pane entirely.

`RequestList` computes `isSideBySide = !!selected && viewMode !== ViewMode.Accordion` and drives the list's own width/resize behaviour off that instead of off `selected` directly — this is what keeps the list full-width in Accordion mode even while a row is selected. In the row loop, when `isAccordionView && selected?.uuid === item.uuid`, it renders `MessageInfo` (websocket) or `RequestInfo` + `ResponseInfo` (HTTP) unmodified — same components, same state, same search highlighting as Panes — wrapped in their own `Resizable` (`styles.accordionDetail`, height persisted as `accordionSectionHeight` in `CacheContext`, same ref-mirror-free pattern as `requestSectionHeight`). `RequestInfo`'s own internal Resizable (the Request/Response split) is reused as-is inside that box; the two are independent drags, exactly like the list-width/pane-height split in Panes mode.

`Request.tsx` derives three Accordion-only visual states, all `false` in Panes mode so nothing there changes:

- `isDimmed` — every non-selected row fades to `opacity: 0.45` plus a 1px `blur`, both cleared on `:hover`, while any row is expanded. This exists so the expanded block reads as the focal point without losing the ability to glance at neighbouring rows.
- `isAccordionSelected` — the expanded row itself gets a black `box-shadow` above it, paired with a matching one on `.accordionDetail`'s bottom edge, visually sandwiching the expanded block between the two shadows. It does **not** reuse Panes' `.isSelected` grey background — that looked flat/washed out once dimming was added to the siblings, so Accordion styles the active row purely through the shadow pair.
- Clicking an already-selected row while `isAccordionView` calls `clearSelection()` instead of re-selecting it — this is what makes the expanded row collapse on a second click. Panes mode has no equivalent because its detail pane already has an explicit close button.

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

Rows with no timings — every websocket message, since those have no HAR entry — fall back to the original `title` attribute. The rich tooltip and the native one are mutually exclusive on purpose; rendering both gives you two overlapping tooltips. Intercepted rows land here too: a mocked call has no HAR entry either, so it draws an unsegmented bar sized from the `startTime`/`time` the page reported.

### Response interceptor

A rule matches a JSON-RPC **method** (exact, or a glob using `*`) optionally narrowed by a url substring, and answers with a `result` or an `error` body, a transport status and a delay. `src/content/interceptor.ts` patches `window.fetch` in the MAIN world; the panel edits rules through `InterceptorContext`, and `src/components/Interceptor/` renders the dialog and the toolbar button.

Every non-websocket row also carries a row action next to Resend that seeds a rule from that exact request: `createRuleFromRequest()` (`rules.ts`) takes the method name verbatim and the current response — `result` when present, otherwise `error` with `responseType` set to match — as the rule body, pretty-printed. `InterceptorContext.addRuleFromRequest()` appends it via the same `persistRules` path as the toolbar's blank `addRule()`, then also flips `isInterceptorVisible` on, which is why clicking the row button both creates the rule and pops the dialog straight to it. The dialog's open/closed state therefore lives in `InterceptorContext`, not as local state in `InterceptorButton` — it needs to be triggerable from anywhere a rule can be created, not just from the toolbar button that happens to render it.

`InterceptorRule`'s expand/collapse is local `useState`, but its **initial** value is `rule.isEnabled` — a rule created disabled mounts collapsed, one created enabled (via `createRule`/`createRuleFromRequest`, both default `isEnabled: true`) mounts expanded. Toggling the checkbox afterward does not force a re-expand or re-collapse; that would fight a manual expand/collapse click.

**Interception is armed by a live signal, never by the stored flag — and this is a safety property, not a detail.** The service worker keeps `panelPorts: Map<tabId, Port>`; the panel holds a `chrome.runtime.connect` port open for exactly as long as it exists, and `isEnabled` is only ever `storedFlag && panelPorts.has(tabId)`. `content.ts` therefore **asks** the worker on load (`InterceptorStateRequest`) rather than reading storage, and the worker pushes `InterceptorState` whenever the answer changes.

Do not "simplify" this back into a `chrome.storage.onChanged` listener in `content.ts`. That was the original design and it was dangerous: storage outlives the panel, so interception survived closing DevTools *and* page reloads, silently mocking a page whose only warning indicator — the amber toolbar button — lives inside the panel that just went away.

The port's disconnect is the signal because it is the only one that survives the panel being torn down without warning; `pagehide` does not. The map lives in worker memory on purpose: if the worker is recycled the map dies with it *and so does every port that filled it*, so the two can never disagree — a restarted worker starts disarmed and the panel's `onDisconnect` reconnect re-arms it. Every failure mode lands on "off".

A consequence worth having: rules now apply **only to the inspected tab**, since arming is keyed on `tabId`. A devtools page is not a tab, so `port.sender.tab` is undefined and the panel must send `chrome.devtools.inspectedWindow.tabId` itself.

Three things in the patch are load-bearing:

- **The patch is never installed until a feature actually needs it.** `applyPatch()` puts `patchedFetch` on `window.fetch` only when `shouldPatch()` — `isArmed() || isResilientCapture` — and otherwise restores the *original* `window.fetch` object, not the bound copy, so an idle page runs the genuine native function, `toString()` and all. It runs on every rules delivery, so arming and disarming from the panel swap the patch live. **This is load-bearing, not tidiness.** An earlier version patched eagerly at `document_start` for up to 1s on every page (a `ready` promise with a timeout, guarding against a fetch firing before the rules arrived). That wrapper made this script the initiator of any request passing through it, which hid those requests from `chrome.devtools.network.onRequestFinished` — so the interceptor silently broke the panel's own HTTP capture for every user on every page, whether or not interception was ever used, and the failure looked like a Chrome bug. Do not reintroduce a pre-state patch window. Accepted cost: a call fired before the state arrives is neither interceptable nor observed.
- **`patchedFetch` is not `async`.** It is a plain function that returns `nativeFetch(...)` directly when `shouldPatch()` is false, and only delegates to the `async interceptFetch` otherwise. It should stay cheap: it is reachable on any page where the patch is installed.
- **Only the intercepted half of a batch is reported to the panel.** A partially mocked batch is re-issued to the server carrying just the unmatched items (`sendItems`), and that re-issued call is a real request that `chrome.devtools.network` reports on its own. Reporting it here as well would list it twice.

The merged response is rebuilt in the order the page asked, by indexing both halves on `id`, so a batch response lines up with its request. The **first** matched rule owns the HTTP status, because one response cannot carry a different status per batch item. Notifications (no `id`) are never mocked — there is no response to substitute.

**Latency is synthetic only.** `delay` holds the answer back with a timer; a mocked call never makes a real request, so there is no round-trip to preserve. A `keepLatency` flag that sent the page's request anyway and answered with the mock once it returned was built and then rolled back — if it comes up again, note what it cost: the real call lands in the list as its own row beside the MOCK one (`chrome.devtools.network` reports it like any other request), so one logical call renders as two, and a rule whose endpoint is down waits out a full timeout before mocking. `delay` takes a `max()` across matched rules for the same reason the status comes from the first: a single HTTP response cannot arrive at two different times.

**The failure contract: a bug in interception must never break the page's request.** This is structural, not a sprinkling of try/catch, and the split is what enforces it:

- `planInterception()` holds everything that can throw and returns `null` to mean "leave this call alone" — a throw inside it is just another way of spelling `null`. It touches **no** network, which is what makes the fallback safe: `interceptFetch` can return `nativeFetch(input, init)` afterwards with no risk of double-sending.
- Nothing after `sendItems()` may throw, because by then the passthrough half has already gone out and falling back would re-send it. That is why `getRuleStatus()` clamps and `getHeaders()` swallows.
- The `return nativeFetch(...)` early exits must stay **outside** any `try`. In an `async` function a returned promise is awaited by the async machinery, so a `try` wrapped around them would catch genuine network rejections and retry them.

Three specific throws are guarded because each is reachable from ordinary use, and all three were live defects in the draft:

- **`new Response()` throws a RangeError outside 200-599.** The status field is free text, so `0` or `1000` would have turned every matched call into a rejected fetch. `getRuleStatus()` clamps at the point of use rather than on input, so typing `5` toward `500` is not rewritten under the cursor.
- **`new Headers()` throws on a malformed name or value.** Headers are diagnostic only — shown in the panel's request pane — so `getHeaders()` returns `[]` rather than failing the call.
- **`Request.clone()` throws on an already-consumed body.** Caught by `planInterception`, and the fallback is then faithful: native `fetch` rejects on a used `Request` with the identical `TypeError`, so the patch stays transparent in that mode too.

**Aborts are honoured.** A mocked response is not exempt from the page's `AbortController`: `throwIfAborted()` runs before the work and again after the delay, and `sleep()` rejects on the signal, so a delayed mock cannot resolve for a call the page already dropped. The signal is read from `init` *or* the `Request`, since either can carry it. Without this a `delay` rule would silently break abort semantics — the exact case a loading-state test is trying to exercise.

`content.ts` guards every `chrome.*` call with `isExtensionAlive()`. Reloading or updating the extension orphans the content scripts already running in open tabs, and every `chrome.*` call from one then throws "Extension context invalidated" **synchronously** — which `lastError` does not cover. Nothing is recoverable there, but it must not spray uncaught errors into the page console on every relayed frame.

A rule whose body is not valid JSON is **inert**: `findRule` gates on `isValidRuleBody` and so does the editor's invalid styling, so what the UI marks red is exactly what the page declines to mock. The editor keeps the body as raw text — a half-typed rule must not take effect mid-keystroke, and JSON-parsing on every change would destroy the text the user is editing.

`isIntercepted` on `IRequest` drives the amber MOCK badge, which sits in the method row rather than the url row and is not gated on a setting: unlike CORS and WEBSOCKET, a mocked response is something you must not miss while reading the list. The toolbar button turns `$interceptorAccent` on the same principle, standing in for the warning badge Chrome paints on its own Network tab — there is no API to badge an extension panel's tab.

**No new manifest permissions.** The interceptor rides entirely on what the websocket patch already needed: `scripting` for the dynamic MAIN-world registration, `storage` for the rules, and the existing `*://*/*` host permissions. Nothing here uses `webRequest` or `declarativeNetRequest` — substitution happens inside the page, not in the network stack. Keep it that way: reaching for a network-layer API would widen the install-time permission prompt for a feature most users never enable.

Known gaps and side effects on the MAIN world, all deliberate:

- **Only `fetch` is patched**, and only in the top frame — XHR, WebSocket frames, worker requests and iframes are untouched (`registerContentScripts` defaults `allFrames` to false).
- **Rules apply only to the inspected tab, and only while its panel is open** — see the arming rules above. The url field narrows further, by endpoint.
- **The patch is detectable, but only while it is installed.** `window.fetch.toString()` stops reporting `[native code]` while armed (or while resilient capture is on); otherwise the page holds the original native `fetch`. The `window.WebSocket` patch has always had this property and keeps it permanently on every page.
- **While the patch is installed, requests routed through it disappear from `chrome.devtools.network.onRequestFinished`** — for this panel *and* for every other devtools extension, since Chrome credits us as the initiator. Mocked calls are unaffected (they are self-reported), but a passthrough call in a partially mocked batch is not reported by that API. This is the same damage React DevTools does to us; see Resilient capture, which exists to survive it.
- **A synthetic `Response` is not a network one.** `response.url` is empty, `type` is `default` rather than `cors`/`basic`, `redirected` is false, and only `Content-Type` is set — a page reading custom response headers off a mocked call sees none.
- **A partially mocked batch reaches the server with a different body than the page sent**, carrying only the unmatched items. That is the point of the feature, but it means server-side logging of a mocked session will not match what the app believes it sent.

Resend is unaffected by all of this — `EditRequestModal` runs its `fetch` through `chrome.scripting.executeScript` in the ISOLATED world, which never sees the MAIN-world patch.

**The side-effect disclaimer is the `.hint` line in the dialog, and it is two lines on purpose.** It names only the three things that actually surprise people — mocked calls never reach the network, rules apply in *every tab*, and only `fetch` is intercepted — because the two support questions this feature generates are "why isn't my rule firing" (it was XHR) and "why did my other tab break" (rules are global). Everything else lives here, not in the UI. Resist growing it: it is styled at `opacity: 0.85` rather than help-text muting precisely so it gets read, and a disclaimer people skip is worth less than no disclaimer at all. There is deliberately no "Beta" badge — the label adds a word without adding information, and the concrete caveats do the work.

`interceptor_rules` persists whatever shape `IInterceptorRule` had when it was written, so **restore goes through `normaliseRules()`** — it rebuilds each rule field by field, filling gaps and dropping anything unknown, so a rule saved by an older build can neither reach `findRule` half-shaped nor resurrect a dead field. Rules without an `id` are discarded; nothing can key off them. `normaliseRule` is also what `createRule` is built from, which is the point: a new field cannot be added to the factory and forgotten in the migration, because they are the same function. Add fields there and nowhere else.

### Resilient capture

**The problem it exists for.** Patching `window.fetch` makes Chrome credit the *patching extension's script* as the request's initiator, and `chrome.devtools.network.onRequestFinished` then reports that request to **nobody** — while the ordinary Network panel still shows it. This is not hypothetical and not ours alone: **React DevTools 7.0.1 instruments `fetch`** (for React Server Components), which silently breaks this panel's normal HTTP capture on any page it runs on. We cannot unpatch another extension's wrapper, and the symptom is baffling from the user's side — requests visible in the Network tab, absent here. `settings_resilientCapture` (Troubleshooting section, **default off**) is the escape hatch.

When on, `interceptor.ts` patches `fetch` and `observeFetch()` reports each JSON-RPC call itself, so capture no longer depends on that API:

- `PendingRequest` on send → `getPreparedPendingRequest()` → a placeholder row with `isPending`.
- `ObservedRequest` when it settles → `getPreparedObservedRequest()` → the real row, merged over the placeholder.

**The two are tied together by `callId`, not by re-deriving identity.** `observeFetch` mints one id per fetch and stamps it on both reports; `findPendingIndex` matches on `callId` + JSON-RPC id. An earlier version re-derived `(url, id)` independently on each side and rows stuck in pending when they disagreed — the correlation is now minted once, at the one place that provably knows the two messages are the same call. `callId` rides through `IPreparedRequestBase`, so every row exploded out of a batch inherits its call's id. The `(url, id)` heuristic survives only for the `chrome.devtools.network` path, which knows nothing of our ids.

Three failure modes are handled explicitly, because each would otherwise leave a row pulsing forever:

- **The completion must be reported even when the body cannot be read.** It is read from `response.clone()`, which can fail on a consumed, streamed or aborted body; that `catch` still reports, just without a body. Swallowing it strands the placeholder.
- **A rejected fetch still reports** (status 0) before rethrowing, so the page's own error semantics are untouched.
- **A pending report can arrive after its own completion** — the page relay rides the page's event loop and can be throttled, `onRequestFinished` cannot. `findCompletedIndex` drops the late placeholder. Its `(url, id)` match is bounded by `duplicateCompletionWindowMs`, because ids alone are not unique across a session: a client that reuses small incrementing ids would otherwise collide every later call with the first one seen.

**Observed rows carry timings from the Resource Timing API**, not from HAR — `getResourceTimings()` maps `PerformanceResourceTiming` onto `IRequestTimings`. Without it `timings` is `null`, `hasTimings` is false, and the bar draws flat in `$waterfallBar` — which is the *same blue* as `$resizeHandleColor` used for the pending bar, so a finished call looked identical to an in-flight one. Phases that did not happen are reported as `-1` (HAR's "does not apply") so `isMeasured` drops them rather than drawing zero-width segments; `send` is `-1` because Resource Timing does not separate it from `wait`. Two cases return `null` and fall back to the flat bar rather than showing zeros as data: a cross-origin response without `Timing-Allow-Origin`, and a missing entry (the page's resource-timing buffer is finite). `setResourceTimingBufferSize` is deliberately **not** called — a debugging tool should not mutate the page's own performance state.

Costs, all real and all in the Settings disclaimer: `fetch` is patched on every page so `fetch.toString()` no longer reads native; **we become the initiator, so we do to other devtools extensions exactly what React DevTools did to us**; `fetch` only, not XHR; and anything that captured `fetch` before us is missed. This is why it is opt-in and why `shouldPatch()` is `isArmed() || isResilientCapture` — with both off, `window.fetch` is the genuine native function and behaviour is identical to not having the feature.

### Persistence

All settings flow through `getConfig()` in `src/logic/common/helpers.ts` into `chrome.storage.local`, keyed with a `settings_` prefix. Adding one means touching five places in `SettingsContext.tsx`: a `default*Value` const, a `useState`, a `getConfig` call in the load effect, a `handle*Change` writer, and two entries in the returned object. Column visibility follows this as `settings_showWaterfallColumn`, `settings_showStatusColumn`, `settings_showSizeColumn`, `settings_showTimeColumn`. Search scope and case sensitivity follow it too, as `settings_searchScope` and `settings_caseSensitiveSearch` — the search *term* itself stays in `HttpArchiveContext` and is not persisted. `settings_expandLevel` follows it as well; the Settings row for it renders only while `expandTreeState` is `Expanded`, since it has no meaning for the other two states. `settings_viewMode` (`ViewMode.ts`) follows the same recipe and defaults to `Panes`, so existing users see no layout change until they opt into Accordion. `settings_resilientCapture` follows it too and defaults to off; note it is a **second cross-realm key** alongside `settings_preserveLog` — `background.ts` reads it directly from storage to build the payload it pushes to the page, so the key name is shared with the unbundled content scripts.

### JSON tree open depth

`getCollapsed()` in `JsonViewer.tsx` maps the pane's open state onto react-json-view's `collapsed`, which doubles as a boolean and a depth: `Collapsed` → `true`, `Default` → `defaultOpenNodesDepth` (1, or 2 for the response pane), `Expanded` → the configured `expandLevel`, or `false` for unlimited. `expandAllLevels` (`ExpandLevel.ts`) is that unlimited sentinel and is **0**, which cannot collide with a real depth because "open nothing" is already `ExpandTreeState.Collapsed`. It is also the default, so Expanded keeps meaning fully-expanded for existing users.

`RequestInfo` and `ResponseInfo` mirror `expandLevel` into local state next to `expandTreeStateValue` and reset it to `expandAllLevels` in their `onChangeState` handler. That is deliberate: the pane chevron says "Expand all", so a manual expand must ignore the configured depth — otherwise the button would look broken whenever the tree is already open to that level. The setting governs how a pane *opens*, not what the button does.

`EditRequestModal` hardcodes `ExpandTreeState.Expanded` and passes no level, so the editor stays fully expanded regardless of the setting. Websocket messages run off the separate `expandedWebsocketMessagesState` and have no level of their own.

Sort field and direction are **not** persisted — they reset with the panel.

**There is a second, separate family of persisted values.** Layout state — `requestSectionHeight`, `requestListSectionWidth`, `accordionSectionHeight`, `columnWidths`, `columnOrder` — lives in `CacheContext`, is written **without the `settings_` prefix**, and never appears in the Settings dialog. `accordionSectionHeight` follows `requestSectionHeight`'s exact pattern (plain `useState` + write-on-drop, no ref mirror) and sizes the whole inline detail block in Accordion mode; `requestSectionHeight` itself is shared between Panes' right pane and the Request/Response split inside that block, since it is the same setting semantically in both places. Do not add layout state to `SettingsContext` by following the five-step recipe above; it belongs in `CacheContext`, which also owns the pattern for values that change continuously during a drag (ref mirror + a deferred write, see Resizable columns). `getConfig()` is shared by both and accepts an object default for the two structured keys.

**And a third family: interceptor rules.** `interceptor_rules` and `interceptor_enabled` live in `InterceptorContext` and carry their own `interceptor_` prefix, which marks them as read outside the panel — the *service worker* reads them, and gates them on a panel actually being open before any page sees them (see Response interceptor). Do not fold these into `SettingsContext`, and note that `interceptor_enabled` persisting does **not** mean interception persists: it is remembered for the checkbox, not honoured on its own.

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
- **Content-script bundles are content-hashed after bundling.** `hashContentScripts()` renames every `build/content/*.js` (and its map) to `<name>.<md5-8>.js`, then rewrites the references that point at them: the `content/websockets.js` / `content/interceptor.js` string literals inside the built `background.js` — which is hashed *last* so its own hash covers the rewritten paths — and the `content_scripts` / `service_worker` entries in `build/manifest.json`. Source files keep the plain names; only `build/` is rewritten. Stale hashed files from a previous no-clean build are deleted first, and the hash is deterministic, so unchanged sources keep their names.

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

Waterfall colours are `$waterfallBar` / `$waterfallTick` and `$darkWaterfallBar` / `$darkWaterfallTick` in `variables.scss`, drawn from the Chrome DevTools palette so the panel reads as native. These now cover only the *unsegmented* bar (a row with no timings) and the websocket tick — a segmented bar and the popover both use the separate `$phase*` palette described under Waterfall timing breakdown, which is deliberately paler. `$resizeHandleColor` is shared by the column dividers and both pane dividers. Note `$greenHeaderBackground` is still neon `#32ff00`, used by the WEBSOCKET badge and the income/outcome triangles. `$interceptorAccent` / `$darkInterceptorAccent` is DevTools' alert amber, shared by the MOCK badge and the toolbar button — deliberately louder than `$warning`, which stays muted because it tints whole rows down the list.

The MOCK badge repeats its own `:global(.isDark)` override inside `&.isIntercepted::before` rather than inheriting the base badge's. `.badge.isIntercepted::before` and `.isDark .badge::before` both land at (0,2,1), so without the repeat the theme colour would be decided by source order rather than by intent — the same hazard `.isCopied.isCopied` doubles itself to avoid.

## Toolchain constraints

These are pinned deliberately — verify before "upgrading" past them:

- **ESLint 9 with flat config** (`eslint.config.mjs`, built on `eslint-config-airbnb-extended`). ESLint 10 is blocked: `eslint-plugin-react@7.37.5` still calls `context.getFilename()`, which v10 removed. Recheck when that plugin ships v10 support.
- **TypeScript is capped at 6.0.x** — `typescript-eslint` peers `typescript <6.1.0`, and this repo uses type-aware linting.
- `tsconfig.json` pins `"strict": false` and an explicit `"types": ["chrome", "node"]` because TS 6 flipped both defaults. The `strict` pin preserves existing behaviour; turning it on surfaces ~50 real null-safety errors.
- **Node 24 in CI.** Older Node fails outright: `eslint-plugin-n` and `stylelint` use `with { type: "json" }` import attributes, and release-it 21 requires `^22.21 || >=24`.
- Rules conflicting with this codebase's conventions (arrow-function components, TS optional props in place of `defaultProps`, JSX formatting) are disabled in `eslint.config.mjs`, as are `react-hooks/exhaustive-deps`, `react-hooks/set-state-in-effect` and the triggering `jsx-a11y` rules.
- **`npm run lint` is expected to report zero problems — no errors and no warnings.** Any output is something you introduced; fix it rather than adding to the baseline.
- `@stylistic/member-delimiter-style` is configured `delimiter: 'comma'` with `requireLast: true` for multiline. Interface and type members use commas **including a trailing one** on the last member; single-line members omit it.
