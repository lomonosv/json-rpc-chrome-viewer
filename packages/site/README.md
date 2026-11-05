# @json-rpc-chrome-viewer/site

The landing site for the JSON-RPC Chrome Viewer extension. Next.js 16 (App
Router).

## Develop

From the repo root:

```bash
pnpm run dev:site                  # next dev on :3000
pnpm exec nx run site:build        # standalone build
pnpm exec nx run site:start        # serve it on :3000
pnpm exec nx run-many -t lint typecheck -p site
```

The hero embeds the **real panel**: `demo/stub.js` fakes the `chrome.*` API and
plays scripted traffic into the extension's own `packages/extension/build/application.js`, which
`scripts/prepare-demo.mjs` copies into `public/demo/`. Edit the demo traffic in
`demo/stub.js`.

`src/design/PanelConcept/` is a redesign concept for the panel, kept on purpose
and not rendered — see its README.

| Variable               | Used for                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Absolute base for Open Graph urls (defaults to `http://localhost:3000`) |
| `NEXT_PUBLIC_GA_ID`    | Google Analytics measurement id (`G-…`); unset loads no analytics       |

Both are inlined at build time.

## React Bits

`src/components/reactbits/` holds components copied from
[reactbits.dev](https://reactbits.dev/), unedited, under their own licence —
see the README there.
