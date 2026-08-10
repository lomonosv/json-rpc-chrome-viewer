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

`HttpArchiveContext` reads `preserveLog`, `includeJsonRpcLogs` and `includeWebsocketLogs` from `SettingsContext`, so it must nest inside it.

Every context follows the same shape — match it when adding one:

```ts
const useX = () => { /* state */ return { ... }; };
type XContextType = ReturnType<typeof useX>;
export const XContext = createContext<XContextType>(null);
export const useXContext = () => useContext(XContext);
export default ({ children }) => <XContext.Provider value={ useX() }>{ children }</XContext.Provider>;
```

`HttpArchiveContext` keeps `requestsRef.current` mirroring the `requests` state because its Chrome event listeners are registered in an effect keyed only on `preserveLog`; the callbacks would otherwise close over stale state. Mutate the ref and then `setRequests(requestsRef.current)` — don't replace this with a plain setter.

### Persistence

All settings flow through `getConfig()` in `src/logic/common/helpers.ts` into `chrome.storage.local`, keyed with a `settings_` prefix. Note the cross-realm coupling: `static/index.js` reads `settings_preserveLog` straight from storage to decide whether to flush its buffer on navigation, so that key name is shared between the bundled app and the unbundled DevTools page.

### Dependency injection

`inversify` container created in `src/logic/DI/createContainer.tsx` and exposed via `useDIContext()`. The surface is tiny — the only binding is `DITypes.Scope`, bound at runtime by `SentryIntegration`.

### Sentry: deliberately narrow

`SentryIntegration.tsx` uses `new BrowserClient()` plus a local `Scope` — **not** `Sentry.init()` — and filters `GlobalHandlers`, `BrowserApiErrors` and `Breadcrumbs` out of the default integrations.

Consequence: **only React render/lifecycle errors reaching `ErrorBoundary.componentDidCatch` are reported.** Uncaught window errors, errors thrown inside event handlers, and unhandled promise rejections are silently dropped — twice over, since the client is never registered globally, so `getClient()` inside `GlobalHandlers` wouldn't match it anyway. This is intentional, not a bug. Enabling global capture requires both un-filtering the integrations *and* calling `setCurrentClient(client)`.

## Build pipeline

`scripts/build.js` (esbuild) emits `application` from `src/index.tsx` plus one bundle per `.ts` in `src/content/`, named `content/<name>`. Then:

- **SCSS** goes through `esbuild-sass-plugin` with `postcssModules`, so `import styles from './x.scss'` yields hashed class names. Use `:global(...)` to opt out of scoping (see `src/index.scss`). Shared theme variables live in `src/components/common/variables.scss` and are pulled in with namespaced `@use` — `@use "../variables";` then `variables.$color`, not a bare `@import`.
- **SVGs** load as `text` (`loader: { '.svg': 'text' }`) and are injected via `dangerouslySetInnerHTML` in `Icon.tsx`.
- **`process.env.X` is not substituted by esbuild.** `scripts/envSubstitute.js` rewrites those tokens textually across `build/` after bundling, using `.env`. Env values therefore only exist after a full `npm run build`, never after a bare `node scripts/build.js`.
- Path aliases `~/logic/*` and `~/components/*` come from `tsconfig.json` and are resolved by esbuild from there.

## Toolchain constraints

These are pinned deliberately — verify before "upgrading" past them:

- **ESLint 9 with flat config** (`eslint.config.mjs`, built on `eslint-config-airbnb-extended`). ESLint 10 is blocked: `eslint-plugin-react@7.37.5` still calls `context.getFilename()`, which v10 removed. Recheck when that plugin ships v10 support.
- **TypeScript is capped at 6.0.x** — `typescript-eslint` peers `typescript <6.1.0`, and this repo uses type-aware linting.
- `tsconfig.json` pins `"strict": false` and an explicit `"types": ["chrome", "node"]` because TS 6 flipped both defaults. The `strict` pin preserves existing behaviour; turning it on surfaces ~50 real null-safety errors.
- **Node 24 in CI.** Older Node fails outright: `eslint-plugin-n` and `stylelint` use `with { type: "json" }` import attributes, and release-it 21 requires `^22.21 || >=24`.
- Rules conflicting with this codebase's conventions (arrow-function components, TS optional props in place of `defaultProps`, JSX formatting) are disabled in `eslint.config.mjs`. `react-hooks/*` and `jsx-a11y/*` are set to **warn** rather than error — they were never linted before, and their findings are unaddressed, so warnings are expected in lint output.
