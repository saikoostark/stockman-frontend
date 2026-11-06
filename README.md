# Stockman Frontend

Next.js 16 (App Router) client for the Stockman paper-trading app. A thin client over the Django API — no money math or authorization is duplicated in the browser.

## Stack

- Next.js 16 + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui (Radix)
- next-intl (en/ar/de/es, Arabic RTL), next-themes (dark/light)
- TanStack Query, React Hook Form + Zod, decimal.js, lightweight-charts
- Vitest + Testing Library for unit tests, Playwright for e2e

## Requirements

- Node.js 20+
- The backend running on http://127.0.0.1:8000 (see `../backend/README.md`)

## Setup

```bash
cp .env.example .env   # BACKEND_URL defaults to http://127.0.0.1:8000
npm install
```

## Run

```bash
npm run dev     # http://localhost:3000 — rewrites /api/v1/* to the backend
npm run build   # production build (standalone output)
npm run start   # serve the production build
```

## Tests

```bash
npm test               # Vitest unit tests
npx playwright test    # e2e (requires the backend and dev server running)
```

## Configuration

`BACKEND_URL` (server-side only) is where `/api/v1/*` requests are rewritten in development. Never put secrets in `NEXT_PUBLIC_*`.
