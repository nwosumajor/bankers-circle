# syntax=docker/dockerfile:1
# Production image for the Node services (api, worker). Build from the repo root:
#   docker build -f docker/node-service.Dockerfile --build-arg APP=api --build-arg GIT_SHA=$(git rev-parse HEAD) .

ARG NODE_IMAGE=node:24.21.0-slim

FROM ${NODE_IMAGE} AS base
# openssl must exist at build time too: Prisma picks its schema-engine binary from the detected
# OpenSSL version, and without it falls back to an openssl-1.1 build that cannot run here.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PNPM_HOME=/pnpm \
    CI=true
RUN corepack enable
WORKDIR /repo

FROM base AS build
ARG APP
COPY . .
# Install only this service and its workspace dependencies; the store cache keeps rebuilds fast.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@circle/${APP}..."
RUN pnpm --filter "@circle/${APP}..." run build
# Self-contained copy of the service with production dependencies only.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter "@circle/${APP}" deploy --prod /out

FROM ${NODE_IMAGE} AS runtime
ARG GIT_SHA=unknown
# The Prisma schema engine needs openssl for `prisma migrate deploy` (pre-deploy step).
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    GIT_SHA=${GIT_SHA}
WORKDIR /app
COPY --from=build --chown=node:node /out .
USER node
CMD ["node", "dist/main.js"]
