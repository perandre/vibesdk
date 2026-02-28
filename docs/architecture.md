# Architecture

## Project Structure

**Frontend (`/src`):**
- React application with 80+ components
- Single source of truth for types: `src/api-types.ts`
- All API calls in `src/lib/api-client.ts`
- Custom hooks in `src/hooks/`
- Route components in `src/routes/`

**Backend (`/worker`):**
- Entry point: `worker/index.ts` (7860 lines)
- Agent system: `worker/agents/` (88 files)
  - Core: SimpleCodeGeneratorAgent (Durable Object, 2800+ lines)
  - Operations: PhaseGeneration, PhaseImplementation, UserConversationProcessor
  - Tools: LLM tools (read-files, run-analysis, regenerate-file, etc.)
  - Git: isomorphic-git with SQLite filesystem
- Database: `worker/database/` (Drizzle ORM, D1)
- Services: `worker/services/` (sandbox, code-fixer, oauth, rate-limit, secrets)
- API: `worker/api/` (routes, controllers, handlers)

**Other:**
- `/shared` - Shared types between frontend and backend (not worker-specific)
- `/migrations` - D1 database migrations
- `/container` - Sandbox container tooling
- `/templates` - Project scaffolding templates

## Core Architecture

- Each chat session is a Durable Object instance (SimpleCodeGeneratorAgent)
- State machine drives code generation: `IDLE → PHASE_GENERATING → PHASE_IMPLEMENTING → REVIEWING`
- Git history stored in SQLite, full clone protocol support
- WebSocket for real-time streaming and state synchronization

## Key Patterns

**Durable Objects:**
- Each chat session = one DO instance
- Persistent state in SQLite (blueprint, files, history)
- Ephemeral state in memory (abort controllers, active promises)
- Single-threaded per instance

**CodeGenState (agent state fields):**
- Project: `blueprint`, `projectName`, `templateName`
- Files: `generatedFilesMap`
- Phases: `generatedPhases`, `currentPhase`
- State machine: `currentDevState`, `shouldBeGenerating`
- Sandbox: `sandboxInstanceId`, `commandsHistory`
- Conversation: `conversationMessages`, `pendingUserInputs`

**WebSocket:**
- Real-time streaming via PartySocket
- State restoration on reconnect (`agent_connected` message)
- Message deduplication (tool execution causes duplicates — backend skips redundant LLM calls, frontend deduplicates on restore)

**Git System:**
- `GitVersionControl` wraps isomorphic-git
- Key methods: `commit()`, `reset()`, `log()`, `show()`
- FileManager auto-syncs via callback registration
- SQLite filesystem adapter: `worker/agents/git/fs-adapter.ts`
- Access control: user conversations get safe commands, debugger gets full access

**Abort Controller:**
- `getOrCreateAbortController()` reuses controller for nested operations
- Cleared after top-level operations complete
- User abort cancels entire operation tree

## Subsystems

**Deep Debugger** (`worker/agents/assistants/codeDebugger.ts`):
- Model: Gemini 2.5 Pro (reasoning_effort: high, 32k tokens)
- Diagnostic priority: `run_analysis` → `get_runtime_errors` → `get_logs`
- Can fix multiple files in parallel via `regenerate_file`
- Cannot run during code generation (checked via `isCodeGenerating()`)

**User Secrets Store** (`worker/services/secrets/`):
- One DO per user, XChaCha20-Poly1305 encryption, SQLite backend
- Key derivation: MEK → UMK → DEK (hierarchical PBKDF2)
- RPC methods return `null`/`boolean` on error — never throw
- 90 tests in `/test/worker/services/secrets/`
