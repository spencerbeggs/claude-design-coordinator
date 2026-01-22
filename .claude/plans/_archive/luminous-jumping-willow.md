# Claude Coordinator Implementation Plan

## Overview

Implement a tRPC-based coordination system enabling multiple Claude Code
instances to communicate in real-time for knowledge transfer between
repositories.

**Packages:**

- **core** (`@spencerbeggs/claude-coordinator-core`) - Zod schemas, types
- **server** (`@spencerbeggs/claude-coordinator-server`) - tRPC WS server
- **mcp** (`@spencerbeggs/claude-coordinator-mcp`) - MCP stdio bridge

**Build Order:** core → server → mcp

---

## Phase 1: Package Scaffolding

Create three packages in `pkgs/` based on `ecma-module` template.

### 1.1 Core Package

**Files to create:**

- `pkgs/claude-coordinator-core/package.json` - deps: `zod`
- `pkgs/claude-coordinator-core/tsconfig.json` - composite build
- `pkgs/claude-coordinator-core/rslib.config.ts` - NodeLibraryBuilder
- `pkgs/claude-coordinator-core/biome.jsonc` - extends root
- `pkgs/claude-coordinator-core/turbo.json` - task definitions

### 1.2 Server Package

**Files to create:**

- `pkgs/claude-coordinator-server/package.json`
  - deps: `@trpc/server`, `ws`, `zod`, workspace core
- `pkgs/claude-coordinator-server/tsconfig.json` - ref to core
- `pkgs/claude-coordinator-server/rslib.config.ts` - dual entry
- `pkgs/claude-coordinator-server/biome.jsonc`
- `pkgs/claude-coordinator-server/turbo.json`

### 1.3 MCP Package

**Files to create:**

- `pkgs/claude-coordinator-mcp/package.json`
  - deps: `@modelcontextprotocol/sdk`, `@trpc/client`, `ws`, core
- `pkgs/claude-coordinator-mcp/tsconfig.json` - ref to core
- `pkgs/claude-coordinator-mcp/rslib.config.ts` - dual entry
- `pkgs/claude-coordinator-mcp/biome.jsonc`
- `pkgs/claude-coordinator-mcp/turbo.json`

### 1.4 Root Config Updates

- Update `tsconfig.json` - add references for all three packages

---

## Phase 2: Core Package Implementation

### Domain Schemas

**`src/schemas/agent.ts`**

```typescript
AgentSchema: { id, role: "source"|"target", name, repoPath, connectedAt }
JoinInputSchema: { name, role, repoPath }
```

**`src/schemas/context.ts`**

```typescript
ContextEntrySchema: { id, key, value, tags, createdBy, createdAt, updatedAt }
ShareContextInputSchema, GetContextInputSchema, ListContextInputSchema
```

**`src/schemas/question.ts`**

```typescript
QuestionSchema: { id, question, from, to?, answer?, status, timestamps }
AskInputSchema, AnswerInputSchema
```

**`src/schemas/decision.ts`**

```typescript
DecisionSchema: { id, decision, rationale, by, createdAt }
LogDecisionInputSchema
```

### Exports

**`src/index.ts`** - barrel export all schemas, types, and constants:

```typescript
export * from "./schemas/agent.js";
export * from "./schemas/context.js";
export * from "./schemas/question.js";
export * from "./schemas/decision.js";
export const DEFAULT_PORT = 3030;
export const DEFAULT_HOST = "localhost";
```

---

## Phase 3: Server Package Implementation

### State Management

**`src/state.ts`** - EventEmitter-based state manager:

- `CoordinatorState` class extending `EventEmitter`
- In-memory Maps for agents, context, questions
- Array for decisions
- Events: `agentChange`, `contextChange`, `question`

### tRPC Router

**`src/router.ts`** - four sub-routers:

```typescript
session: { join, leave, list, onAgentChange (subscription) }
context: { share, get, list, onContextChange (subscription) }
questions: { ask, answer, listPending, onQuestion (subscription) }
decisions: { log, list }
```

Subscriptions use `observable()` pattern with EventEmitter listeners.

### WebSocket Server

**`src/server.ts`**:

- `createServer(options)` function
- Uses `applyWSSHandler` from `@trpc/server/adapters/ws`
- 30-second keep-alive ping interval
- Logs to stderr (not stdout)

### Server CLI Entry Point

**`src/cli.ts`**:

- Shebang: `#!/usr/bin/env node`
- Reads PORT/HOST from env vars
- Defaults to `ws://localhost:3030`

---

## Phase 4: MCP Package Implementation

### tRPC Client

**`src/client.ts`**:

- `createCoordinatorClient({ url })` function
- Uses `createWSClient` + `wsLink` from `@trpc/client`
- Passes `ws` library for Node.js WebSocket support

### MCP Server

**`src/mcp-server.ts`**:

- Uses `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
- `StdioServerTransport` for Claude Code communication
- **CRITICAL:** All logging to stderr (stdout breaks JSON-RPC)

### Tool Definitions

10 tools bridging to tRPC:

| Tool                           | Description                  |
| ------------------------------ | ---------------------------- |
| `coordinator_join`             | Join session as agent        |
| `coordinator_leave`            | Leave session                |
| `coordinator_list_agents`      | List connected agents        |
| `coordinator_share_context`    | Share context entry          |
| `coordinator_get_context`      | Get context by key           |
| `coordinator_ask`              | Ask a question               |
| `coordinator_answer`           | Answer a question            |
| `coordinator_pending_questions`| List pending questions       |
| `coordinator_log_decision`     | Log a decision               |
| `coordinator_list_decisions`   | List all decisions           |

Each tool:

- Uses Zod schemas with `.describe()` for AI understanding
- Returns errors within result object (`isError: true`)
- Requires session join for mutating operations

### MCP CLI Entry Point

**`src/cli.ts`**:

- Parses `--url` argument
- Defaults to `ws://localhost:3030`
- All output to stderr

---

## Phase 5: Testing

### Core Tests

- Schema validation tests for all domain objects
- Edge cases: invalid UUIDs, missing fields, invalid enums

### Server Tests

- State management unit tests
- Event emission verification
- Integration test: server starts and accepts connections

### MCP Tests

- Client connection tests
- Tool handler tests with mocked tRPC client

---

## Verification

### Build

```bash
pnpm install
pnpm run build
pnpm run typecheck
```

### Run Tests

```bash
pnpm run test
```

### Manual E2E Test

1. Start server: `node pkgs/claude-coordinator-server/dist/dev/cli.js`
2. Start MCP: `node pkgs/claude-coordinator-mcp/dist/dev/cli.js`
3. Verify tools are available in Claude Code

---

## Key Files Modified

| File                                  | Change                  |
| ------------------------------------- | ----------------------- |
| `tsconfig.json`                       | Add 3 package refs      |
| `pkgs/claude-coordinator-core/*`      | New package             |
| `pkgs/claude-coordinator-server/*`    | New package             |
| `pkgs/claude-coordinator-mcp/*`       | New package             |

---

## Dependencies

### Core

- `zod@^3.24.0`

### Server

- `@spencerbeggs/claude-coordinator-core@workspace:*`
- `@trpc/server@^11.0.0`
- `ws@^8.18.0`
- `@types/ws@^8.5.0` (dev)

### MCP

- `@spencerbeggs/claude-coordinator-core@workspace:*`
- `@modelcontextprotocol/sdk@^1.25.2`
- `@trpc/client@^11.0.0`
- `ws@^8.18.0`
- `@types/ws@^8.5.0` (dev)
