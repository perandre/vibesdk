# Common Development Tasks

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
