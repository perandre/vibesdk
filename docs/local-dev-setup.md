# Local Dev Setup Notes

This documents how this fork is configured for local development on a free Cloudflare account.

## Why not `bun run setup`?

The upstream repo ships an interactive setup script (`bun run setup`) that handles credentials, resource creation, and template deployment automatically. We deliberately did not use it because it modifies `wrangler.jsonc` in-place with account-specific IDs and flags. That would make every upstream merge noisy.

Instead, all local overrides live in `wrangler.local.jsonc` (gitignored), and `wrangler.jsonc` stays pristine upstream. The dev script passes `WRANGLER_CONFIG_PATH=wrangler.local.jsonc` so wrangler uses our overrides automatically.

`bun run setup` is still useful if you want to configure AI Gateway, OAuth providers, or production deployment — just be aware it will modify `wrangler.jsonc` and you'll need to reconcile that with `wrangler.local.jsonc`.

## Prerequisites

- Bun — `curl -fsSL https://bun.sh/install | bash`, then `source ~/.zshrc`
- Cloudflare account (free tier) with:
  - API token (see permissions below)
  - Account ID (from Workers & Pages dashboard)
  - A registered `workers.dev` subdomain (Compute → Workers & Pages → set subdomain)
- Google AI Studio API key (free at aistudio.google.com)

### Cloudflare API token permissions

All Account-level:
Workers KV Storage (Edit), Workers Scripts (Edit), D1 (Edit), R2 Storage (Edit),
AI Gateway (Edit), Cloudflare Pages (Edit), Workers Builds Configuration (Edit),
Workers AI (Edit), Account Analytics (Read)

## First-time setup

```bash
bun install
cp .dev.vars.example .dev.vars   # fill in credentials (see below)
bun run db:migrate:local
bun run templates                # seeds local R2 with template catalog + zips
bun run dev
```

## .dev.vars

```
CLOUDFLARE_API_TOKEN="..."
CLOUDFLARE_ACCOUNT_ID="..."
GOOGLE_AI_STUDIO_API_KEY="..."
CUSTOM_DOMAIN="localhost:5173"
JWT_SECRET="<openssl rand -hex 32>"
WEBHOOK_SECRET="<openssl rand -hex 32>"
```

`CUSTOM_DOMAIN` is required — the app throws "Application domain is not set" without it.

## wrangler.local.jsonc (our local overrides)

All account-specific and local-only config lives here. `wrangler.jsonc` is never touched.

### Dispatch namespaces — removed

Workers for Platforms is a paid feature (error code 10121). The `DISPATCHER` binding is only used for the "Deploy to Cloudflare" button, not needed locally.

### D1 — `"remote": true` removed

The upstream `database_id` belongs to Cloudflare's account. Without `remote`, wrangler uses a local SQLite simulation. Migrations applied via `bun run db:migrate:local`.

### R2 — `"remote": true` removed

R2 requires a payment method even on the free tier. Local simulation is used instead. Templates are seeded via `bun run templates`.

### KV — namespace ID updated

The upstream KV ID belongs to Cloudflare's account. A new namespace was created:

```bash
bunx wrangler kv namespace create "VibecoderStore"
# → b74d2cd5ac4140599d835d9a327146ef
```

### Containers — disabled

Docker is required for the sandbox container feature. Not needed for basic local dev.

```jsonc
"dev": { "enable_containers": false }
```

## Templates (R2)

The app reads `template_catalog.json` from local R2 on startup. Without it, the template picker throws "Template catalog not found".

```bash
bun run templates
```

This script (`scripts/setup-local-templates.sh`) clones `https://github.com/cloudflare/vibesdk-templates` to `.templates-repo/` (gitignored) and runs their `deploy_templates.sh` with `LOCAL_R2=true`. Requires Python 3 + PyYAML. Re-run when upstream adds new templates.

Note: `bun run setup` also deploys templates as part of the full onboarding flow.

## Authentication

OAuth is not required. When no OAuth providers are configured, email/password registration is available at `/login`. Accounts are created directly in the local D1 database.

`ALLOWED_EMAIL` in `wrangler.local.jsonc` vars is empty by default (any email can register). Set it to restrict signups.

## Starting the dev server

```bash
bun run dev    # http://localhost:5173
```

The `dev` script loads `.dev.vars` automatically and sets `WRANGLER_CONFIG_PATH=wrangler.local.jsonc`.

## What does not work locally

- **Sandbox/code execution**: requires Docker + Cloudflare Containers (paid)
- **Deploy to Cloudflare button**: requires Workers for Platforms (paid)
- **Remote D1/KV/R2**: all data is local only
