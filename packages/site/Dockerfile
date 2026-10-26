# The landing site, built and served the same way as lomonos-com-ua: a
# self-contained multi-stage build (deps -> builder -> runner) ending in Next's
# standalone server, run as a non-root user.
#
# Build context is the REPO ROOT, not this folder - the site embeds the
# extension's real panel bundle, which is built from src/ at the root:
#   docker build -f packages/site/Dockerfile .
# Dokploy: Build Type "Dockerfile", Docker File "packages/site/Dockerfile",
# Docker Context Path ".".
#
# Node is pinned to the exact devEngines.runtime version; any other version
# makes pnpm download that Node inside the build.

FROM node:24.21.0-alpine AS deps
WORKDIR /app
# Workspace manifests only, so this layer is reused until a dependency changes.
# pnpm-workspace.yaml carries the supply-chain policies (release age, trust
# policy, build allow-list), so they apply here exactly as in CI.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/site/package.json packages/site/
COPY packages/server-logger/package.json packages/server-logger/
# pnpm from corepack (signature-verified), at the single devEngines pin.
RUN corepack enable pnpm \
  && corepack install -g "pnpm@$(node -p "require('./package.json').devEngines.packageManager.version")" \
  && pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Inlined into the client bundle at build time - build args, not runtime env.
# Each must be declared here, or Docker drops the value Dokploy passes.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
COPY . .
# Builds the extension's panel bundle (without a Sentry release), then the site.
RUN pnpm run build:site

FROM node:24.21.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
# outputFileTracingRoot is the repo root, so the standalone tree mirrors it and
# the server lives at packages/site/server.js.
COPY --from=builder --chown=nextjs:nodejs /app/packages/site/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/site/.next/static ./packages/site/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/site/public ./packages/site/public
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "packages/site/server.js"]
