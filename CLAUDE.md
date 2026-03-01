# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Start dev server at http://localhost:5173
bun run build        # Type-check and build for production
bun run typecheck    # Type-check without emitting
bun run lint         # ESLint
bun run test         # Run all tests (vitest)
bun run test -- path/to/file.test.ts  # Run a single test file
bun run deploy       # Build and deploy to Cloudflare (reads .prod.vars)

bun run templates          # Seed local R2 with template catalog + zips (run once after setup)
bun run db:migrate:local   # Apply migrations to local D1
bun run db:migrate:remote  # Apply migrations to remote D1
bun run db:studio          # Open Drizzle Studio for local DB
```

`bun run dev` loads credentials from `.dev.vars` automatically and uses `wrangler.local.jsonc` (gitignored) for local overrides.

The upstream repo has an interactive `bun run setup` that handles full onboarding (credentials, resource creation, template deployment). We don't use it because it modifies `wrangler.jsonc` in-place — instead all local config lives in `wrangler.local.jsonc` to keep `wrangler.jsonc` pristine for upstream merges. See `docs/local-dev-setup.md`.

## Upstream Strategy

Tracks `https://github.com/cloudflare/vibesdk` as `upstream`. See `docs/architecture.md` and `docs/dev-tasks.md` for deep dives.

```bash
git fetch upstream && git merge upstream/main
```

**Files that intentionally differ from upstream** (verify after every merge):

| File | Change |
|---|---|
| `package.json` | `dev` script loads `.dev.vars` + sets `WRANGLER_CONFIG_PATH`; added `templates` script |
| `vite.config.ts` | `configPath` reads `WRANGLER_CONFIG_PATH` env var + `customOverridesPlugin` |
| `src/main.tsx` | Imports `src/custom/styles.css` |
| `CLAUDE.md` | Our additions |
| `.gitignore` | Added `wrangler.local.jsonc`, `.templates-repo` |
| `SandboxDockerfile` | Added `EXPOSE 8001` for local dev port proxying |
| `worker/services/sandbox/sandboxSdkClient.ts` | Added `patchViteConfigForLocalDev` — patches `hmr.clientPort` in container's vite.config.ts so HMR WebSocket goes through wrangler proxy |

`wrangler.jsonc` is pristine upstream. When it changes upstream, mirror relevant parts into `wrangler.local.jsonc` manually.

**Rules for custom work:**
- Prefer new files over modifying core
- New routes: controller → route → register in `worker/api/routes/index.ts`
- New UI: new files under `src/components/` or `src/routes/` — don't modify existing route components
- Never modify `worker/agents/` core (`SimpleCodeGeneratorAgent`, `PhaseGeneration`, etc.) — extend via new tools/operations
- If a core file must change, add it to the table above

## Project Overview

vibesdk is an AI-powered full-stack app generation platform on Cloudflare infrastructure.

- Frontend: React 19, TypeScript, Vite, TailwindCSS, React Router v7
- Backend: Cloudflare Workers, Durable Objects, D1 (SQLite), Drizzle ORM
- AI: OpenAI, Anthropic, Google AI Studio — config in `worker/agents/inferutils/config.ts`
- WebSocket: PartySocket — types in `worker/api/websocketTypes.ts`

See `docs/architecture.md` for structure, patterns, and subsystem details.
See `docs/dev-tasks.md` for step-by-step guides for common tasks and pitfalls.

## Communication Style

- Be professional, concise, and direct
- Do NOT use emojis in code reviews, changelogs, or any generated content
- Use clear technical language

## Core Rules (Non-Negotiable)

**Type safety:** Never use `any`. Frontend imports types from `src/api-types.ts` (single source of truth). Search before creating new types.

**DRY:** Search for similar functionality before implementing. Extract reusable utilities, hooks, and components.

**Patterns:**
- Frontend API calls: `src/lib/api-client.ts`
- Backend routes: controllers in `worker/api/controllers/`, routes in `worker/api/routes/`
- Database services: `worker/database/services/`
- Shared types: `shared/types/`, API types: `src/api-types.ts`

**Code quality:** No TODOs, no hacky workarounds, no verbose AI-like comments.

**File naming:** React components `PascalCase.tsx`, utilities/hooks `kebab-case.ts`, backend services `PascalCase.ts`.
