# Stockman Frontend

Next.js 16 (App Router) client for the Stockman paper-trading app. A thin client over the Django API — no money math or authorization is duplicated in the browser; the frontend only renders what the backend authorizes and computes.

## Stack and why

| Dependency | Why it's used |
| --- | --- |
| **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** | Server components, file-based routing, and typed contracts for the API layer. |
| **Tailwind CSS v4** | Utility styling, shared design tokens, dark/light theming. |
| **shadcn/ui** (Radix primitives via the unified `radix-ui` package) | Accessible, themeable components (`src/components/ui/`) without a component lock-in. |
| **next-intl** | Locale-prefixed routing (`/[locale]/...`) for en/ar/de/es with Arabic RTL and server-side message loading. |
| **next-themes** | Dark/light mode with a hydration-safe toggle. |
| **TanStack Query v5** | Server-state caching, refetching, and invalidation for all API data. |
| **React Hook Form + Zod** | Performant forms with schema validation shared with the backend contract shapes. |
| **decimal.js** | Exact decimal parsing/formatting for money (never `Number` for money). |
| **lightweight-charts** | Candlestick/history charts for instrument detail pages. |
| **sonner** | Toast notifications for mutation feedback. |
| **Vitest + Testing Library + MSW** | Unit tests with a mocked API; **Playwright** for end-to-end flows. |

## Requirements

- Node.js 20+
- The backend running on http://127.0.0.1:8000 (see [`../backend/README.md`](../backend/README.md))

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

In development, `/api/v1/*` requests are rewritten to the backend (server-side `BACKEND_URL`); the browser never talks to the backend directly and no secrets are exposed.

## Pages

Routes live under `src/app/[locale]/(app)/` and are gated by auth and capabilities returned by `auth/capabilities/`.

| Route | Page | What it does |
| --- | --- | --- |
| `/login`, `/register` | Auth | Session login and registration (`src/features/auth/`). |
| `/dashboard` | Dashboard | Account summary: balances, open positions, recent activity (`src/features/dashboard/`). |
| `/markets` | Markets | Instrument list with search, provider status, and watchlist management (`src/features/markets/`). |
| `/markets/[id]` | Instrument detail | Price history chart and the order ticket (`src/features/markets/`, `src/features/trading/`). |
| `/wallets` | Wallets | Balances per currency, top-up/withdrawal funding dialog, and the ledger table (`src/features/wallets/`). |
| `/orders` | Orders | Open orders, cancel action, and fills history (`src/features/trading/`). |
| `/portfolio` | Portfolio | Per-currency holdings with realized/unrealized P&L (`src/features/trading/`). |
| `/alerts` | Alerts | Create and manage price/percent-change alert rules (`src/features/alerts/`). |
| `/notifications` | Notifications | Live notifications over SSE (`src/features/notifications/`). |
| `/audit` | Audit | Append-only audit trail (`src/features/audit/`). |
| `/administration` | Administration | Group policy editor and user/group management (`src/features/administration/`). |

## How to use

1. **Register** an account (or log in). Locale (English/Arabic/German/Spanish) and theme are switchable from the top bar.
2. **Top up** practice funds from the Wallets page — funding is audited; there is no way to edit a balance directly.
3. Browse **Markets**, open an instrument, and place a **market or limit order** from the order ticket.
4. Track results in **Portfolio** (P&L) and **Orders** (fills), set **Alerts**, and watch **Notifications** stream in over SSE.
5. Staff with `access.manage` see **Administration** to edit group policies; `audit.read` shows the **Audit** trail.

## Architecture

```
src/app/[locale]/      route pages and layouts (auth + app shell)
src/features/*/        feature modules: api.ts, types.ts, components/, schemas.ts
src/components/        layout (sidebar, topbar) and ui/ (shadcn primitives)
src/lib/api/           typed API client (envelope + pagination + errors)
src/lib/events/        SSE event-stream hook
src/lib/money/         decimal parse/format (locale-aware)
src/i18n/              routing + per-feature message merging
messages/              en/ar/de/es JSON catalogs
```

- **Feature-first layout.** Each domain (markets, wallets, trading, alerts, notifications, audit, administration, auth, dashboard) owns its API calls, types, and components. Pages are thin: they read params/translations and render a feature component.
- **API client** (`src/lib/api/client.ts`). Enforces the backend envelope `{data, metadata, errors}`, surfaces typed errors, forwards CSRF cookies and `Idempotency-Key`, and provides pagination helpers.
- **i18n.** Core messages are deep-merged with per-feature files (e.g. `en.markets.json`); `next-intl` middleware (via `src/proxy.ts`) handles locale routing while `/api/v1/*` bypasses it.
- **Server/client boundary.** Layouts and page metadata render on the server (async `params`, `cookies()`); interactive components stay client-side. Money is parsed/rendered with `decimal.js` and `Intl.NumberFormat`, never float math.

## Tests

```bash
npm test               # Vitest unit tests (src/lib/...)
npx playwright test    # e2e — requires backend and dev server running
```

- Unit tests mock the network with **MSW** and cover the API client and money formatting/parsing (`src/lib/api/__tests__`, `src/lib/money/__tests__`).
- **Playwright** runs the golden path end-to-end (`tests/e2e/golden-path.spec.ts`): register → dashboard → top up EGP 500 → markets → Arabic RTL → logout.

## Configuration

- `BACKEND_URL` (server-side only) is where `/api/v1/*` requests are rewritten in development.
- Never put secrets in `NEXT_PUBLIC_*` — anything prefixed `NEXT_PUBLIC_` is inlined into the browser bundle.
