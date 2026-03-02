# Hew (หิ้ว)

A peer-to-peer shopping platform connecting travelers with buyers. Travelers can offer to bring back items from their trips; buyers can request items from specific destinations.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **API**: NestJS, Prisma, BullMQ, Redis
- **Web**: Next.js 14, React, Tailwind CSS
- **Worker**: BullMQ workers for payments, payouts, escrow timeout, notifications
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (for local Postgres and Redis)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd hew
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work with docker compose)
```

### 4. Run migrations

```bash
pnpm db:migrate
```

### 5. Seed the database

```bash
pnpm db:seed
```

Creates admin user `admin@hew.th` / `admin123`, sample trips (Japan, Korea, Indonesia), and item requests.

### 6. Start development

```bash
pnpm dev
```

- API: http://localhost:3000
- Web: http://localhost:3001

## Project Structure

```
hew/
├── apps/
│   ├── api/          # NestJS API
│   ├── web/          # Next.js frontend
│   └── worker/       # BullMQ background workers
├── packages/
│   ├── db/           # Prisma schema, client, migrations, seed
│   ├── shared/       # Shared types and utilities
│   └── config/       # ESLint, TypeScript configs
├── docker-compose.yml
├── Dockerfile.api
├── Dockerfile.web
├── Dockerfile.worker
└── .github/workflows/ci.yml
```

## Available Scripts

| Script        | Description                    |
|---------------|--------------------------------|
| `pnpm dev`    | Start all apps in dev mode     |
| `pnpm build`  | Build all packages             |
| `pnpm lint`   | Lint all packages              |
| `pnpm typecheck` | Type-check all packages     |
| `pnpm test`   | Run tests                      |
| `pnpm db:generate` | Generate Prisma client    |
| `pnpm db:migrate` | Run migrations             |
| `pnpm db:seed`    | Seed database              |
| `pnpm db:studio`  | Open Prisma Studio        |

## Worker Queues

- `payment-confirmation` – Check payment status
- `payout-release` – Process payout releases
- `escrow-timeout` – Cancel orders if payment not received within 48h
- `notification` – Send notifications (email/SMS/push)

## Docker Production Builds

```bash
docker build -f Dockerfile.api -t hew-api .
docker build -f Dockerfile.web -t hew-web .
docker build -f Dockerfile.worker -t hew-worker .
```
