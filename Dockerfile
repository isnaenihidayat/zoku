# Zoku — one container: API, web dashboard, automation + task workers
# Build & run: ./scripts/docker-build-run.sh

ARG BUILDPLATFORM

# --- Build web dashboard (devDependencies stay in this stage only) ---
FROM --platform=${BUILDPLATFORM} oven/bun:1.3-slim AS web-builder
WORKDIR /app

COPY package.json bun.lock ./
COPY apps apps
COPY packages packages

RUN bun install --frozen-lockfile --ignore-scripts \
  && bun run --filter @zoku/web build

# --- Production runtime (server + workspace packages + built static assets) ---
FROM oven/bun:1.3-slim AS runtime
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/server apps/server
COPY apps/platform/automation apps/platform/automation
COPY apps/platform/telegram apps/platform/telegram
COPY apps/platform/whatsapp apps/platform/whatsapp
COPY apps/platform/discord apps/platform/discord
COPY packages packages
# Workspace stubs keep the lockfile valid without pulling web/cli sources.
COPY apps/web/package.json apps/web/
COPY apps/cli/package.json apps/cli/
COPY --from=web-builder /app/apps/web/dist apps/web/dist

RUN bun install --frozen-lockfile --production --ignore-scripts \
      --filter '@zoku/server' \
      --filter '@zoku/automation' \
      --filter '@zoku/telegram' \
      --filter '@zoku/whatsapp' \
      --filter '@zoku/discord' \
  && test -n "$(find node_modules/.bun -path '*/node_modules/pm2/bin/pm2-runtime' -type f -print -quit)" \
  && mkdir -p /zoku/data \
  && if getent group 1000 >/dev/null; then \
       G=$(getent group 1000 | cut -d: -f1); \
       [ "$G" = zoku ] || groupmod -n zoku "$G"; \
     else groupadd --system --gid 1000 zoku; fi \
  && if getent passwd zoku >/dev/null; then \
       usermod -d /zoku/data zoku; \
     elif getent passwd 1000 >/dev/null; then \
       U=$(getent passwd 1000 | cut -d: -f1); \
       usermod -l zoku -g zoku -d /zoku/data "$U"; \
     else useradd --system --uid 1000 --gid zoku --home-dir /zoku/data --create-home zoku; fi \
  && chown -R zoku:zoku /app /zoku

ENV NODE_ENV=production \
    ZOKU_HOST=0.0.0.0 \
    ZOKU_PORT=4310 \
    ZOKU_CONFIG_DIR=/zoku/data \
    DATABASE_URL=file:/zoku/data/sqlite/zoku.sqlite \
    BUN_INSTALL_BIN=/zoku/data/.bun/bin \
    BUN_INSTALL_GLOBAL_DIR=/zoku/data/.bun/install/global

EXPOSE 4310

VOLUME ["/zoku/data"]

USER 1000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:4310/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "apps/server/src/index.ts"]
