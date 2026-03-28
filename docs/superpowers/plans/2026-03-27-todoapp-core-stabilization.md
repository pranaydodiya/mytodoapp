# TodoApp Core Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working, persistent Todo app by implementing missing todo APIs, aligning data types, and adding a minimal test safety net.

**Architecture:** Keep the current Next.js App Router shape, but replace in-memory runtime behavior with Prisma-backed route handlers. Introduce a small data mapping layer between Prisma models and frontend DTOs to normalize date handling and maintain a stable API contract.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Prisma 6, SQLite, ESLint.

---

## File Structure (Planned Touch Points)

- Modify: `src/app/api/categories/route.ts` (switch from in-memory store to Prisma)
- Modify: `src/app/api/stats/route.ts` (compute from Prisma data)
- Create: `src/app/api/todos/route.ts` (GET/POST todos)
- Create: `src/app/api/todos/[id]/route.ts` (PATCH/DELETE todo)
- Modify: `src/types/todo.ts` (clarify API date contract)
- Create: `src/lib/todo-mappers.ts` (Prisma model to API DTO mapping)
- Modify: `src/app/page.tsx` (remove sentinel cast and align payload behavior)
- Modify: `package.json` (add test scripts)
- Create: `src/app/api/todos/route.test.ts` (API route tests)
- Create: `src/app/api/todos/[id]/route.test.ts` (API route tests)
- Modify: `README.md` (real runbook)

---

### Task 1: Implement Todo Collection API

**Files:**
- Create: `src/app/api/todos/route.ts`
- Create: `src/lib/todo-mappers.ts`
- Modify: `src/types/todo.ts`
- Test: `src/app/api/todos/route.test.ts`

- [ ] **Step 1: Write failing tests for `GET /api/todos` and `POST /api/todos`**
  - Cases: list all, filter by `search`, `completed`, `priority`, `categoryId`, create todo with and without due date, invalid payload.

- [ ] **Step 2: Run test file and confirm failures**
  - Run: `npm run test -- src/app/api/todos/route.test.ts`
  - Expected: FAIL due to missing route and/or handlers.

- [ ] **Step 3: Implement `src/lib/todo-mappers.ts`**
  - Add pure helpers that map Prisma `Todo` rows into API `Todo` DTO.
  - Normalize `dueDate` to `YYYY-MM-DD` and `createdAt` to ISO string.

- [ ] **Step 4: Implement `src/app/api/todos/route.ts`**
  - `GET`: parse query params and build Prisma `where` clause.
  - `POST`: validate input (`text`, `priority`, `categoryId`, `dueDate`) and create row.
  - Return mapped DTOs with consistent JSON response.

- [ ] **Step 5: Run tests and iterate to passing**
  - Run: `npm run test -- src/app/api/todos/route.test.ts`
  - Expected: PASS.

- [ ] **Step 6: Commit**
  - `git add src/app/api/todos/route.ts src/lib/todo-mappers.ts src/types/todo.ts src/app/api/todos/route.test.ts`
  - `git commit -m "feat: add prisma-backed todo collection api"`

---

### Task 2: Implement Todo Item API

**Files:**
- Create: `src/app/api/todos/[id]/route.ts`
- Test: `src/app/api/todos/[id]/route.test.ts`

- [ ] **Step 1: Write failing tests for `PATCH /api/todos/:id` and `DELETE /api/todos/:id`**
  - Cases: toggle completed, patch invalid id, patch not found, delete success, delete not found.

- [ ] **Step 2: Run test file and confirm failures**
  - Run: `npm run test -- src/app/api/todos/[id]/route.test.ts`
  - Expected: FAIL due to missing handler file.

- [ ] **Step 3: Implement item handlers**
  - Parse numeric route param safely.
  - `PATCH`: support `{ completed: boolean }`.
  - `DELETE`: remove todo row and return success payload.
  - Use correct status codes: `400`, `404`, `200`.

- [ ] **Step 4: Run tests to green**
  - Run: `npm run test -- src/app/api/todos/[id]/route.test.ts`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - `git add src/app/api/todos/[id]/route.ts src/app/api/todos/[id]/route.test.ts`
  - `git commit -m "feat: add prisma-backed todo item api"`

---

### Task 3: Migrate Existing Routes From In-Memory Store to Prisma

**Files:**
- Modify: `src/app/api/categories/route.ts`
- Modify: `src/app/api/stats/route.ts`
- Test: extend existing API test files or add `src/app/api/categories/route.test.ts`, `src/app/api/stats/route.test.ts`

- [ ] **Step 1: Write failing tests for categories and stats behavior**
  - Categories: list/create/delete.
  - Stats: totals, pending/completed, overdue, byPriority, byCategory.

- [ ] **Step 2: Run tests and verify failures**
  - Run: `npm run test -- src/app/api/categories/route.test.ts src/app/api/stats/route.test.ts`
  - Expected: FAIL for Prisma integration expectations.

- [ ] **Step 3: Replace `store.ts` reads/writes with Prisma queries**
  - Preserve existing response shape.
  - Ensure category delete behavior is explicit with related todos (either null out relation or reject with 409 and message).

- [ ] **Step 4: Run test suite and verify pass**
  - Run: `npm run test`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - `git add src/app/api/categories/route.ts src/app/api/stats/route.ts src/app/api/*.test.ts`
  - `git commit -m "refactor: move category and stats routes to prisma"`

---

### Task 4: Clean UI State + Contract Alignment

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/types/todo.ts`

- [ ] **Step 1: Write a focused component/interaction test for create flow**
  - Verify category selection and payload behavior for "(none)" and "Uncategorized".

- [ ] **Step 2: Replace `'' as unknown as null` sentinel with explicit local type**
  - Use `number | null | ''` in UI form state only.
  - Convert to API payload type before request.

- [ ] **Step 3: Ensure date rendering uses normalized values**
  - Keep consistent `YYYY-MM-DD` display for due date badges.

- [ ] **Step 4: Run lint and tests**
  - Run: `npm run lint`
  - Run: `npm run test`
  - Expected: both PASS.

- [ ] **Step 5: Commit**
  - `git add src/app/page.tsx src/types/todo.ts`
  - `git commit -m "refactor: simplify todo form state and type contracts"`

---

### Task 5: Testing + Tooling Baseline

**Files:**
- Modify: `package.json`
- Create: test config files (framework-specific, based on chosen runner)
- Create: shared test setup utilities

- [ ] **Step 1: Choose and install a test runner**
  - Prefer Vitest + Testing Library for low setup friction with Next.js route/unit tests.

- [ ] **Step 2: Add scripts**
  - `test`, `test:watch`, `test:coverage`.

- [ ] **Step 3: Add Prisma test DB strategy**
  - Dedicated SQLite file for tests, reset per suite.

- [ ] **Step 4: Run full test pipeline locally**
  - Run: `npm run test`
  - Run: `npm run test:coverage`
  - Expected: PASS with reported coverage.

- [ ] **Step 5: Commit**
  - `git add package.json package-lock.json <test-config-files>`
  - `git commit -m "test: add baseline api and ui testing setup"`

---

### Task 6: Documentation and Runbook

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace template README with project-specific docs**
  - Setup, env vars, prisma migration steps, run commands, test commands.

- [ ] **Step 2: Add API contract overview**
  - Document request/response examples for `/api/todos`, `/api/categories`, `/api/stats`.

- [ ] **Step 3: Add troubleshooting notes**
  - Common errors: missing `DATABASE_URL`, stale Prisma client, migration mismatch.

- [ ] **Step 4: Validate docs by following from clean shell**
  - Run the documented bootstrap sequence end-to-end.

- [ ] **Step 5: Commit**
  - `git add README.md`
  - `git commit -m "docs: add todoapp setup and api runbook"`

---

## Execution Order and Priority

1. Task 1 (critical unblock)
2. Task 2 (complete CRUD)
3. Task 3 (remove architecture split)
4. Task 5 (safety net foundation)
5. Task 4 (UI cleanup and polish)
6. Task 6 (documentation hardening)

## Definition of Done

- UI no longer errors on missing `/api/todos` endpoints.
- Data persists across restarts via Prisma + SQLite.
- `categories` and `stats` derive from database, not in-memory arrays.
- Local lint and test commands pass consistently.
- README supports onboarding from zero to running app with tests.
