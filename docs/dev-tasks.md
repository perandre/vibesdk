# Common Development Tasks

## UI Customization

All custom UI work lives in `src/custom/` and never touches core files directly.

**Visual changes (colors, fonts, spacing):**
Edit `src/custom/styles.css`. It loads after core styles so anything here wins.
Use CSS custom properties to retheme globally — see comments in that file for available tokens.

**Structural component overrides (add/remove elements):**
1. Copy the core component to `src/custom/overrides/` mirroring the same path
   - e.g. `src/components/layout/global-header.tsx` → `src/custom/overrides/components/layout/global-header.tsx`
2. Make your changes in the copy — no other config needed
3. Vite's `customOverridesPlugin` (in `vite.config.ts`) intercepts the import automatically, for both `@/` and relative imports

**Keeping overrides up to date with upstream:**
When `git merge upstream/main` brings in changes to a component you've overridden, the merge won't touch your copy (it's in `src/custom/`). You need to manually diff:
```bash
git diff upstream/main -- src/components/layout/global-header.tsx
```
Then decide what to pull into your override.

**Current overrides:**
- `src/custom/overrides/components/layout/global-header.tsx` — deploy/fork promo banner removed

## Adding Features

**New API endpoint:**
1. Define types in `src/api-types.ts`
2. Add to `src/lib/api-client.ts`
3. Create service in `worker/database/services/`
4. Create controller in `worker/api/controllers/`
5. Add route in `worker/api/routes/`
6. Register in `worker/api/routes/index.ts`

**New LLM tool:**
1. Create `worker/agents/tools/toolkit/my-tool.ts`
2. Export `createMyTool(agent, logger)` function
3. Import in `worker/agents/tools/customTools.ts`
4. Add to `buildTools()` (conversation) or `buildDebugTools()` (debugger)

**New WebSocket message:**
1. Add type to `worker/api/websocketTypes.ts`
2. Handle in `worker/agents/core/websocket.ts`
3. Handle in `src/routes/chat/utils/handle-websocket-message.ts`

**Change LLM model:**
Edit `worker/agents/inferutils/config.ts` → `AGENT_CONFIG` object

**Modify conversation agent behavior:**
Edit `worker/agents/operations/UserConversationProcessor.ts` (system prompt ~line 50)

## Common Pitfalls

**Don't:**
- Use `any` type — find or create proper types
- Copy-paste code — extract to shared utilities
- Use Vite env variables in Worker code
- Forget to update `src/api-types.ts` when changing APIs
- Create new implementations without searching for existing ones
- Use emojis in code or comments
- Write verbose AI-like comments

**Do:**
- Search codebase before creating new code
- Follow existing patterns — one source of truth per concern
- Keep comments concise and purposeful
