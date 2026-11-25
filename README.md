# T-World admin UI

React + TypeScript + Vite frontend for the T-World Module Service, built to `../design-system.md`. It uses Tailwind's default palette, Inter for UI text and JetBrains Mono for hashes/amounts; all UI components live in `src/components/ui/`.

Deployed at https://tongston-admin-ui.vercel.app (connected to this repository for automatic deployments).

## Setup

```bash
cd client
pnpm install
cp .env.example .env
pnpm dev
```

`VITE_API_URL` points at the backend (default `http://localhost:4000`). Start the API from `../server` first:

```bash
cd ../server
npm run seed   # optional: admin@example.com / Admin@12345, user1@example.com / User@12345
npm run dev
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Vite dev server with hot reload |
| `pnpm build` | Type-check and build to `dist/` |
| `pnpm lint` | ESLint |
| `pnpm preview` | Serve the production build locally |

## Routes

| Path | Screen | Access |
|---|---|---|
| `/login` | Sign in / register | public |
| `/content` | Content search, tag filter, pagination, summarize modal | auth |
| `/ai-runs` | AI run status, latency, tokens, expandable output | auth |
| `/tokens` | Balance, ledger history, convert form, withdrawals | auth |
| `/media` | Cloudinary upload modal and mock-S3 promotion | auth |
| `/admin` | Users with balances and per-user ledger | admin |

## How it works

- `src/api/client.ts` is the single API client: it attaches `Authorization: Bearer <token>`, parses the standard error envelope (`code`, `message`, `requestId`), and exposes one method per backend endpoint.
- `src/auth/AuthContext.tsx` restores the session from a `tw_token` cookie (`Path=/`, `SameSite=Lax`, `Secure` on HTTPS, 1-hour lifetime). The JWT is never written to `localStorage` or `sessionStorage`; signing out clears the cookie. It refreshes the balance after rewarded actions.
- `src/hooks/useAsync.ts` gives every data screen loading, error, empty and retry states; skeletons are used instead of blank pages.
- The sidebar is role-aware: the Admin link only appears for `admin` users, and `/admin` is guarded by `ProtectedRoute admin`.
- Convert and withdraw send a fresh `Idempotency-Key`. The convert form previews the rate using the server defaults (100 tokens → 1 MOCK_USDT; 20,000 → 1 MOCK_ETH).

For the full API contract see `../api.md`; the interactive reference is at `http://localhost:4000/docs` (or `/swagger`).
