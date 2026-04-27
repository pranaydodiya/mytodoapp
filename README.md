# Todo app

Next.js (App Router) todo list with categories, priorities, due dates, filters, and stats. Data is stored in **SQLite** via **Prisma**.

## Prerequisites

- Node.js 20+
- npm

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` in the project root (or use `.env.local` and copy `DATABASE_URL` into `.env` for Prisma CLI):

   ```bash
   DATABASE_URL="file:./prisma/dev.db"
   ```

3. Apply migrations and generate the client:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. Seed default categories (optional but recommended for a good first-run UI):

   ```bash
   npm run prisma:seed
   ```

## App routes

| Path | Description |
|------|-------------|
| `/` | Main tasks UI |
| `/about` | About the app |
| `/help` | Short usage help |

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm test` | Vitest (API route tests) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | Playwright E2E (`prisma/e2e.db`, Chromium) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run prisma:migrate` | Create/apply dev migrations (`prisma migrate dev`) |
| `npm run prisma:studio` | Prisma Studio |
| `npm run prisma:seed` | Seed categories |

Use `npx prisma …` from the project root so the **local** Prisma version matches `package.json` (avoid a globally installed Prisma 7+ CLI).

## API overview

### `GET/POST /api/todos`

- **GET** query params: `search`, `completed` (`true` \| `false`), `priority` (`low` \| `medium` \| `high`), `categoryId` (number or `null` for uncategorized).
- **POST** JSON: `{ "text": string, "priority"?: …, "categoryId"?: number \| null, "dueDate"?: "YYYY-MM-DD" }`.

### `PATCH/DELETE /api/todos/:id`

- **PATCH** JSON: `{ "completed": boolean }`.
- **DELETE** removes the todo.

### `GET/POST/DELETE /api/categories`

- **POST** JSON: `{ "name": string, "color"?: "#RRGGBB" }`.
- **DELETE** `?id=<number>`. Related todos get `categoryId` set to `null` (FK `onDelete: SetNull`).

### `GET /api/stats`

Returns `{ total, completed, pending, overdue, byPriority, byCategory }`.

## Troubleshooting

- **`Environment variable not found: DATABASE_URL`** — Add `DATABASE_URL` to `.env` (Prisma CLI reads `.env` by default; Next.js also loads `.env.local`).
- **`@prisma/client` did not initialize** — Run `npx prisma generate` after schema changes.
- **Schema out of sync** — Run `npx prisma migrate deploy` (or `npm run prisma:migrate` in development).
- **`package.json#prisma` is deprecated** — Harmless on Prisma 6; see **Prisma 7 prep** above before upgrading.

## Tests

API tests use a separate SQLite file: `prisma/test.db`. Vitest runs **`prisma db push` once** via `vitest.global-setup.ts` (not per file), and `vitest.config.ts` sets `DATABASE_URL` for all workers.

```bash
npm test
```

First-time Playwright browsers:

```bash
npx playwright install chromium
```

E2E starts `next dev` on **http://127.0.0.1:3105** so a different process on port 3000 will not be mistaken for this app. To attach to an already running dev server on 3105, set `PW_REUSE_E2E_SERVER=1` and ensure `DATABASE_URL` matches the E2E file above.

## CI

On push/PR to `main` (or `master`), GitHub Actions runs ESLint, Vitest, production build, and a Playwright job (Chromium with system deps on Ubuntu). Local parity:

```bash
npm run lint && npm test && npm run build
```

## API errors

Validation and client errors return JSON shaped like:

```json
{ "error": "Human-readable message", "code": "VALIDATION_ERROR", "issues": { "field": ["…"] } }
```

`code` and `issues` are omitted when not applicable. Success payloads are unchanged (e.g. todo DTOs, `{ "ok": true }`).

## Prisma 7 prep

Prisma 6 may log that `package.json#prisma` seed config is deprecated. When you upgrade to **Prisma 7**, move the seed command into `prisma.config.ts` as described in the [Prisma config docs](https://www.prisma.io/docs/orm/reference/prisma-config-reference). Until then, `npm run prisma:seed` and `package.json` → `prisma.seed` remain the supported setup.
