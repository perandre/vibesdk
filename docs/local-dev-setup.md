# Local Dev Setup Notes

This documents the changes made to get vibesdk running locally on a free Cloudflare account.

## Prerequisites

- Node.js v18+
- Bun — installed via `curl -fsSL https://bun.sh/install | bash`, then `source ~/.zshrc`
- Cloudflare account (free tier) with:
  - API token (see permissions below)
  - Account ID (from Workers & Pages dashboard)
  - A registered `workers.dev` subdomain (Compute → Workers & Pages → set subdomain)
- Google AI Studio API key (free at aistudio.google.com) — default AI provider, requires no model config changes

### Cloudflare API token permissions

All Account-level:
Workers KV Storage (Edit), Workers Scripts (Edit), D1 (Edit), R2 Storage (Edit),
AI Gateway (Edit), Cloudflare Pages (Edit), Workers Builds Configuration (Edit),
Workers AI (Edit), Account Analytics (Read)

## First-time setup

```bash
bun install
bun run db:migrate:local
bun run dev
```

## wrangler.jsonc changes

### 1. Dispatch namespaces — commented out
Workers for Platforms is a paid feature (error code 10121). The `DISPATCHER` binding is only used for the "Deploy to Cloudflare" button and is not needed for local dev.

```jsonc
// "dispatch_namespaces": [
//     {
//         "binding": "DISPATCHER",
//         "namespace": "vibesdk-default-namespace",
//         "remote": true
//     }
// ],
```

### 2. D1 — removed `"remote": true`
The hardcoded `database_id` belongs to Cloudflare's production account, not ours. Removing `remote` makes wrangler use the local SQLite simulation instead. Migrations were applied locally via `bun run db:migrate:local`.

### 3. R2 — removed `"remote": true`
R2 is enabled per-account and requires a payment method even on the free tier. Removing `remote` makes wrangler simulate R2 locally. The templates bucket will be empty but the app still starts.

### 4. KV — updated namespace ID
The hardcoded KV ID belongs to Cloudflare's production account. A new KV namespace was created:

```bash
bunx wrangler kv namespace create "VibecoderStore"
```

New ID: `b74d2cd5ac4140599d835d9a327146ef`

### 5. Containers — disabled
Docker is required for the sandbox container feature (`UserAppSandboxService`). Not needed for basic local dev.

```jsonc
"dev": {
    "enable_containers": false
}
```

## package.json changes

The `dev` script was updated to automatically load `.dev.vars` as process environment variables (needed for wrangler CLI authentication):

```json
"dev": "export $(grep -v '^#' .dev.vars | xargs) && DEV_MODE=true vite"
```

Without this, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` would need to be passed manually on the command line each time.

## .dev.vars

Copy from `.dev.vars.example` and fill in:

```
CLOUDFLARE_API_TOKEN="..."
CLOUDFLARE_ACCOUNT_ID="..."
GOOGLE_AI_STUDIO_API_KEY="..."
CUSTOM_DOMAIN="localhost:5173"
JWT_SECRET="<random hex>"
WEBHOOK_SECRET="<random hex>"
```

`CUSTOM_DOMAIN` is required — the app throws "Application domain is not set" without it.

Generate secrets with: `openssl rand -hex 32`

## Authentication

OAuth (Google/GitHub) is not required. When no OAuth providers are configured, email/password registration is available at `/login`. No email sending is involved — accounts are created directly in the local D1 database.

`ALLOWED_EMAIL` in `wrangler.jsonc` vars is empty by default, meaning any email can register. Set it to restrict signups to a single address.

## Starting the dev server

```bash
bun run dev
```

Runs at http://localhost:5173

## What does not work locally

- **Sandbox**: Code execution in generated apps requires Docker + Cloudflare Containers (paid)
- **Deploy to Cloudflare button**: Requires Workers for Platforms (paid)
- **Remote D1/KV/R2**: All data is local only and will not persist to Cloudflare
