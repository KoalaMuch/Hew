# ─── shared deps ─────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/tsconfig/package.json ./packages/config/tsconfig/
COPY packages/config/eslint/package.json ./packages/config/eslint/
RUN pnpm install --frozen-lockfile

# ─── shared build base ──────────────────────────────────
FROM deps AS build-base
COPY . .
RUN pnpm db:generate
ENV NEXT_TELEMETRY_DISABLED=1

# ─── build: api ──────────────────────────────────────────
FROM build-base AS build-api
RUN pnpm turbo build --filter=@hew/api

# ─── build: web ──────────────────────────────────────────
FROM build-base AS build-web
RUN pnpm turbo build --filter=@hew/web

# ─── build: worker ───────────────────────────────────────
FROM build-base AS build-worker
RUN pnpm turbo build --filter=@hew/worker

# ─── runtime: api ───────────────────────────────────────
FROM node:20-alpine AS runtime-api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build-api /app/package.json ./
COPY --from=build-api /app/pnpm-workspace.yaml ./
COPY --from=build-api /app/node_modules ./node_modules
COPY --from=build-api /app/apps/api/dist ./apps/api/dist
COPY --from=build-api /app/apps/api/package.json ./apps/api/
COPY --from=build-api /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build-api /app/packages ./packages
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]

# ─── runtime: web ───────────────────────────────────────
FROM node:20-alpine AS runtime-web
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build-web /app/apps/web/.next/standalone ./
COPY --from=build-web /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build-web /app/apps/web/public ./apps/web/public
ENV HOSTNAME=0.0.0.0
ENV PORT=3001
EXPOSE 3001
CMD ["node", "apps/web/server.js"]

# ─── runtime: worker ────────────────────────────────────
FROM node:20-alpine AS runtime-worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build-worker /app/package.json ./
COPY --from=build-worker /app/pnpm-workspace.yaml ./
COPY --from=build-worker /app/node_modules ./node_modules
COPY --from=build-worker /app/apps/worker/dist ./apps/worker/dist
COPY --from=build-worker /app/apps/worker/package.json ./apps/worker/
COPY --from=build-worker /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=build-worker /app/packages ./packages
CMD ["node", "apps/worker/dist/main.js"]
