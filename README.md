# Acme Bids — NHS & social care tender writing platform

Production build of the design handoff in `design_handoff_nhs_tender_platform/`
(marketing site + client dashboard for a tender/bid-writing consultancy).
Next.js (App Router, TypeScript) + Postgres + real auth, payments and an
on-chain escrow option — no client-side simulation left in the flows that
matter (quote issuance, escrow funding, session state).

## Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: plain CSS matching the handoff's design tokens exactly (`app/globals.css`) — no UI framework, per the handoff's own guidance
- **Database**: Postgres via Drizzle ORM (`db/schema.ts`)
- **Auth**: Auth.js / NextAuth v5 — email+password (Credentials) and Google/Apple/Facebook/X OAuth, JWT sessions
- **Payments**: Flutterwave (server-side Standard Checkout + webhook verification)
- **On-chain escrow**: a Solidity milestone-escrow contract (`contracts/`), deployed to Sepolia testnet, wallet-connected via viem
- **Deployment target**: intentionally platform-agnostic (no Vercel-only APIs) — runs anywhere Node.js + Postgres do

## What's real vs. what needs your credentials

Everything in the flows is real code against real integrations — nothing is
faked with a `setTimeout`. What's left is supplying credentials for the
third parties, which only you can create:

| Area | Status |
|---|---|
| Accounts, sessions, DB persistence | Real — just needs a Postgres instance |
| Email/password auth | Fully working out of the box |
| Google/Apple/Facebook/X sign-in | Real OAuth code — needs your app registrations (see `.env.example`) |
| Brief → quote → negotiation | Real, DB-backed, admin issues the actual quote (see below) |
| Card & bank escrow (Flutterwave) | Real server-side integration — needs your Flutterwave account keys |
| Smart-contract escrow | Real, tested Solidity contract — needs deploying to Sepolia (a few commands, see `contracts/README.md`) |
| Admin/ops view | Fully working — any allowlisted email becomes admin |

## Getting started

```bash
npm install
docker compose up -d          # local Postgres
cp .env.example .env
# fill in at least DATABASE_URL (already matches docker-compose.yml) and AUTH_SECRET:
npx auth secret                # prints a value for AUTH_SECRET, or use `openssl rand -base64 32`

npm run db:generate            # only needed if you change db/schema.ts — a migration already exists in drizzle/
npm run db:migrate             # applies migrations to your database

npm run dev                    # http://localhost:3000
```

To get an admin account: add your email to `ADMIN_EMAILS` in `.env`, then
sign up normally (email/password or any configured OAuth provider) — you're
promoted to admin on that sign-in and can see `/admin`.

## How the core flow works now (vs. the prototype)

The design handoff's `Dashboard.dc.html` computed a quote client-side after
a fake 1.5s "reviewing" delay. That's gone. The real flow:

1. Client submits a brief (`POST /api/briefs`) → status `under_review`.
2. **Staff** open `/admin`, see it in the "Awaiting a quote" queue, and issue
   a real quote (`/admin/briefs/[id]`). The handoff's pricing formula
   (`lib/quote.ts`) only pre-fills a *suggested* amount — staff can override
   it before sending.
3. The client's dashboard polls every few seconds while `under_review` and
   shows the quote as soon as it's issued — no manual refresh needed.
4. Accept → choose escrow method → fund (Flutterwave checkout redirect, or
   connect a wallet and deposit on-chain) → confirmed via webhook /
   on-chain verification, never trusting the browser's say-so alone.
5. Decline → revise budget → resend → back to step 2 (full history kept in
   the `quotes` table, visible to staff on the brief detail page).

## Project layout

```
app/                  Next.js App Router pages + API route handlers
  (marketing pages)    /, /services, /pricing, /work, /about, /contact
  sign-in/             Email+password & OAuth sign-in
  dashboard/           Client brief/quote/escrow flow (DashboardClient.tsx is the state machine)
  admin/               Staff ops view — list briefs, issue quotes
  api/                 briefs, admin/briefs, escrow/flutterwave, escrow/smart-contract, webhooks/flutterwave, auth
components/            Nav, Footer, Plate (photo placeholder), SmartContractDeposit (wallet connect + deposit)
db/                    Drizzle schema, migration runner, admin seed script
lib/                   quote calc, Flutterwave client, web3/contract config, DTOs, auth helpers
contracts/             Standalone Hardhat project — TenderEscrow.sol, tests, deploy script (see contracts/README.md)
drizzle/               Generated SQL migrations
auth.config.ts         Edge-safe auth config (used by middleware — no DB import)
auth.ts                Full auth config (adapter + Credentials + admin promotion) — used by server code
```

## Design system

`app/globals.css` is a direct port of the handoff's `styles.css` — same
CSS custom properties, same component classes (`.btn-primary`, `.card`,
`.tag`, `.seg`, `.table`, etc.), same Cormorant Garamond / Lora type scale.
Nothing was rebuilt in Tailwind or a component library — the handoff's own
README recommended plain CSS given how small the system is, and matching
the tokens verbatim was the more faithful path.

## Known simplifications (deliberate, documented — not hidden)

- **Smart-contract escrow settles in ETH, not GBP.** The UI converts a
  brief's GBP deposit to ETH at a fixed, `.env`-configurable indicative
  rate purely so the Sepolia demo has something to move on-chain. A real
  deployment should settle in a stablecoin or price via an oracle — see
  `contracts/README.md`.
- **Role changes take effect on next sign-in**, not instantly — the JWT
  carries the role to keep middleware DB-free (see `auth.config.ts`).
- **No email/SMS notifications yet** (quote issued, escrow funded, etc.) —
  the DB has everything needed to wire these up; hook into the relevant
  API routes (`app/api/admin/briefs/[id]/quote`, the two escrow-funding
  routes) when you pick a provider.
- **Flutterwave and OAuth apps aren't registered for you** — that requires
  accounts only you can create. Everything on the code side (server-side
  checkout init, webhook signature + re-verification, provider wiring) is
  done; see `.env.example` for exactly what to paste in and where to
  register each one.
