# @json-rpc-chrome-viewer/site

The landing site for the JSON-RPC Chrome Viewer extension. Next.js 16 (App
Router) served from its standalone build, deployed to Dokploy on a `site-v*` tag.

## Develop

From the repo root:

```bash
pnpm run dev:site        # builds the extension's panel bundle, then next dev on :3000
pnpm run typecheck:site
pnpm run build:site      # panel bundle + standalone build
pnpm --filter @json-rpc-chrome-viewer/site run start   # serve that build on :3000
pnpm run lint            # the root ESLint config covers the site
```

The hero embeds the **real panel**: `demo/stub.js` fakes the `chrome.*` API and
plays scripted traffic into the extension's own `build/application.js`, which
`scripts/prepare-demo.mjs` copies into `public/demo/`. Edit the demo traffic in
`demo/stub.js`.

`src/design/PanelConcept/` is a redesign concept for the panel, kept on purpose
and not rendered — see its README.

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Absolute base for Open Graph urls (defaults to `http://localhost:3000`) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics measurement id (`G-…`); unset loads no analytics |

Both are inlined at build time — in Docker they are build args.

## Release and deploy

```bash
pnpm run release:site    # bumps packages/site/package.json, tags site-v<version>, pushes
```

The tag runs `.github/workflows/deploy-site.yml`: it checks the tag matches the
version and is the head of `main`, lints, typechecks and builds, then asks
Dokploy to deploy. Dokploy builds the image itself from the Dockerfile.

To try the image locally (build context is the repo root):

```bash
docker build -f packages/site/Dockerfile --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 -t jrcv-site .
docker run --rm -p 3000:3000 jrcv-site
```

### One-time Dokploy setup

1. Create an **Application** with the **GitHub** (or Git) provider on this
   repository, branch `main`, and **turn auto-deploy off** — tags deploy it.
2. Build Type **Dockerfile**: Docker File `packages/site/Dockerfile`,
   Docker Context Path `.` (the repo root).
3. Build args: `NEXT_PUBLIC_SITE_URL=https://<your domain>` and `NEXT_PUBLIC_GA_ID=G-…`.
4. Domains: attach your domain, container port **3000** (Dokploy handles TLS).
5. Dokploy → *Settings → Profile*: generate an **API key**.
6. GitHub repository secrets: `DOKPLOY_URL` (e.g. `https://dokploy.example.com`),
   `DOKPLOY_API_KEY`, `DOKPLOY_APPLICATION_ID` (the id in the application's url).

Without the `DOKPLOY_*` secrets the workflow still verifies the release and
leaves a notice instead of deploying.

## React Bits

`src/components/reactbits/` holds components copied from
[reactbits.dev](https://reactbits.dev/), unedited, under their own licence —
see the README there.
