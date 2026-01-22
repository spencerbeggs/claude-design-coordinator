---
status: current
module: claude-coordinator-mcp
category: architecture
created: 2026-01-21
updated: 2026-01-21
last-synced: 2026-01-21
completeness: 95
related:
  - ../claude-coordinator-core/architecture.md
  - ../claude-coordinator-server/architecture.md
dependencies:
  - ../claude-coordinator-core/architecture.md
  - ../claude-coordinator-server/architecture.md
---

# Claude Coordinator MCP - Architecture

MCP stdio bridge that exposes coordination tools to Claude Code instances,
enabling them to communicate through the coordinator server.

## Table of Contents

1. [Overview](#overview)
2. [Current State](#current-state)
3. [Rationale](#rationale)
4. [System Architecture](#system-architecture)
5. [Data Flow](#data-flow)
6. [Integration Points](#integration-points)
7. [Testing Strategy](#testing-strategy)
8. [Future Enhancements](#future-enhancements)
9. [Related Documentation](#related-documentation)

---

## Overview

The `@spencerbeggs/claude-coordinator-mcp` package provides an MCP (Model
Context Protocol) server that bridges Claude Code instances with the
coordinator server. It exposes tools that Claude can invoke to join sessions,
share context, ask questions, and log decisions.

- **What problem does this architecture solve?** Claude Code cannot directly
  use WebSocket connections, but it can use MCP tools. This package translates
  MCP tool calls into tRPC WebSocket operations.

- **What are the key design principles?**
  - stdio-based MCP transport for Claude Code compatibility
  - Lazy client connection (connect on first use)
  - Tool-per-operation mapping for clear API
  - JSON responses for easy parsing by Claude

- **Why is this architecture appropriate for the use case?** Claude Code's
  MCP integration provides a standardized way to extend its capabilities.
  Using MCP tools allows Claude to coordinate without custom transport code.

**Key Design Principles:**

- **Stateless Tool Design:** Each tool call is independent, state maintained
  in coordinator server
- **Lazy Connection:** WebSocket client created on first tool use
- **Consistent Response Format:** All tools return `{success, ...data}` JSON
- **Error Isolation:** Errors caught and returned as JSON, not thrown

**When to reference this document:**

- When adding new coordination tools
- When debugging MCP tool issues
- When modifying client connection logic
- When integrating with Claude Code configuration

---

## Current State

### Components

The package contains three main components: the tRPC client, the MCP server,
and the CLI entry point.

#### tRPC Client (`src/client.ts`)

**Location:** `pkgs/claude-coordinator-mcp/src/client.ts`

**Purpose:** Creates typed tRPC client for coordinator server

**Key interfaces:**

```typescript
interface ClientOptions {
  url?: string;  // Default: ws://localhost:3030
}

interface TypedTRPCClient {
  session: {
    join: { mutate: (input: JoinInput) => Promise<JoinResult> };
    leave: {
      mutate: (input: { agentId: string }) => Promise<{ success: boolean }>;
    };
    list: { query: () => Promise<Agent[]> };
  };
  context: {
    share: { mutate: (input: ShareInput) => Promise<ContextEntry> };
    get: {
      query: (input: { key: string }) => Promise<ContextEntry | null>;
    };
    list: { query: (input?: FilterInput) => Promise<ContextEntry[]> };
  };
  questions: {
    ask: { mutate: (input: AskInput) => Promise<Question> };
    answer: { mutate: (input: AnswerInput) => Promise<Question> };
    listPending: {
      query: (input?: { agentId?: string }) => Promise<Question[]>;
    };
  };
  decisions: {
    log: { mutate: (input: LogInput) => Promise<Decision> };
    list: { query: () => Promise<Decision[]> };
  };
}

interface CoordinatorClient {
  trpc: TypedTRPCClient;
  close: () => void;
}

function createCoordinatorClient(options?: ClientOptions): CoordinatorClient;
```

**Implementation notes:**

- Uses `ws` library for WebSocket in Node.js environment
- Typed interface manually defined to avoid cross-package type inference
- Server validates all input with Zod schemas

#### MCP Server (`src/mcp-server.ts`)

**Location:** `pkgs/claude-coordinator-mcp/src/mcp-server.ts`

**Purpose:** MCP server with coordinator tools

**Key interfaces:**

```typescript
interface McpServerOptions {
  url?: string;  // Coordinator server URL
}

async function createMcpServer(options?: McpServerOptions): Promise<void>;
```

**MCP Tools Exposed:**

| Tool | Parameters | Description |
| ---- | ---------- | ----------- |
| coordinator_join | name, role, repoPath | Join session as agent |
| coordinator_leave | (none) | Leave current session |
| coordinator_list_agents | (none) | List connected agents |
| coordinator_share_context | key, value, tags? | Share context entry |
| coordinator_get_context | key | Get context by key |
| coordinator_list_context | tags?, createdBy? | List context entries |
| coordinator_ask | question, to? | Ask a question |
| coordinator_answer | questionId, answer | Answer a question |
| coordinator_pending_questions | agentId? | List pending questions |
| coordinator_log_decision | decision, rationale? | Log a decision |
| coordinator_list_decisions | (none) | List all decisions |

**Tool response format:**

```typescript
// Success
{
  content: [
    { type: "text", text: JSON.stringify({ success: true, ...data }) }
  ]
}

// Error
{
  content: [
    { type: "text", text: JSON.stringify({ success: false, error: "..." }) }
  ],
  isError: true
}
```

#### CLI Entry Point (`src/bin/cli.ts`)

**Location:** `pkgs/claude-coordinator-mcp/src/bin/cli.ts`

**Purpose:** Standalone MCP server execution

**Command line arguments:**

- `--url=<url>` or `--url <url>`: Coordinator server URL

**Example usage:**

```bash
# Default URL (ws://localhost:3030)
claude-coordinator-mcp

# Custom URL
claude-coordinator-mcp --url=ws://192.168.1.100:3030
```

### Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│                      claude-coordinator-mcp                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     CLI (bin/cli.ts)                          │  │
│  │  - Parse --url argument                                       │  │
│  │  - Start MCP server                                           │  │
│  └───────────────────────────┬──────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                 MCP Server (mcp-server.ts)                    │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │              McpServer (from SDK)                       │  │  │
│  │  │  - name: "claude-coordinator"                           │  │  │
│  │  │  - version: "0.1.0"                                     │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │  │
│  │  │ Session Tools  │  │ Context Tools  │  │ Question Tools │ │  │
│  │  │ - join         │  │ - share        │  │ - ask          │ │  │
│  │  │ - leave        │  │ - get          │  │ - answer       │ │  │
│  │  │ - list_agents  │  │ - list         │  │ - pending      │ │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │  │
│  │                                                               │  │
│  │  ┌────────────────┐  ┌────────────────────────────────────┐ │  │
│  │  │ Decision Tools │  │ StdioServerTransport               │ │  │
│  │  │ - log          │  │ - stdin: JSON-RPC requests         │ │  │
│  │  │ - list         │  │ - stdout: JSON-RPC responses       │ │  │
│  │  └────────────────┘  └────────────────────────────────────┘ │  │
│  └───────────────────────────┬──────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Client (client.ts)                          │  │
│  │  ┌─────────────────┐  ┌────────────────────────────────┐    │  │
│  │  │  createWSClient │  │  createTRPCClient              │    │  │
│  │  │  (WebSocket)    │──│  - typed interface             │    │  │
│  │  └─────────────────┘  │  - wsLink transport            │    │  │
│  │                       └────────────────────────────────┘    │  │
│  └───────────────────────────┬──────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼ WebSocket
               ┌───────────────────────────────┐
               │  claude-coordinator-server     │
               │  (ws://localhost:3030)         │
               └───────────────────────────────┘
```

### State Management

The MCP server maintains minimal local state:

```typescript
let client: CoordinatorClient | null = null;  // Lazy initialized
let agentId: string | null = null;             // Set after join
```

**State lifecycle:**

1. Server starts with no client or agentId
2. First tool call creates client (lazy connection)
3. `coordinator_join` sets agentId
4. `coordinator_leave` clears agentId
5. Process exit closes client connection

### Current Limitations

- **Single session:** Can only be joined to one session at a time
- **No reconnection:** If WebSocket drops, client must be recreated
- **No subscriptions exposed:** Real-time events not available via MCP tools
- **Blocking operations:** All tool calls wait for server response

---

## Rationale

### Architectural Decisions

#### Decision 1: stdio Transport

**Context:** Need to communicate with Claude Code

**Options considered:**

1. **stdio transport (Chosen):**
   - Pros: Standard MCP pattern, works with Claude Code
   - Cons: Single stream, no parallel requests
   - Why chosen: Required by Claude Code MCP integration

2. **HTTP transport:**
   - Pros: Standard protocol, easy debugging
   - Cons: Not supported by Claude Code MCP
   - Why rejected: Incompatible with Claude Code

#### Decision 2: Lazy Client Connection

**Context:** When to establish WebSocket connection

**Options considered:**

1. **Lazy connection (Chosen):**
   - Pros: Fast startup, no connection if unused
   - Cons: First tool call slower
   - Why chosen: Better user experience for startup

2. **Eager connection:**
   - Pros: First call fast
   - Cons: Startup delay, wasted connection if unused
   - Why rejected: Poor startup experience

#### Decision 3: Manually Typed Client Interface

**Context:** Need type safety without cross-package inference

**Options considered:**

1. **Manual TypedTRPCClient (Chosen):**
   - Pros: Explicit, no build complexity
   - Cons: Must keep in sync with server
   - Why chosen: Simpler build, clearer code

2. **Import AppRouter type:**
   - Pros: Always in sync
   - Cons: Complex monorepo build order, circular deps
   - Why rejected: Build complexity not worth it

3. **No types (untyped client):**
   - Pros: Simplest
   - Cons: No compile-time safety
   - Why rejected: Too error-prone

### Design Patterns Used

#### Pattern 1: Tool-per-Operation

- **Where used:** Each tRPC procedure exposed as separate MCP tool
- **Why used:** Clear, discoverable API for Claude
- **Implementation:** `server.tool(name, description, schema, handler)`

#### Pattern 2: Consistent Response Format

- **Where used:** All tool handlers
- **Why used:** Predictable parsing by Claude
- **Implementation:** `{ success: boolean, ...data }` JSON

#### Pattern 3: Guard Functions

- **Where used:** `requireAgentId()` in tools that need agent context
- **Why used:** Clear error messages when not joined
- **Implementation:** Throws descriptive error if agentId null

### Constraints and Trade-offs

#### Constraint 1: MCP Tool Limitations

- **Description:** MCP tools must return text content
- **Impact:** All responses serialized as JSON strings
- **Mitigation:** Consistent JSON structure for easy parsing

#### Trade-off 1: Subscriptions Not Exposed

- **What we gained:** Simpler tool-based API
- **What we sacrificed:** Real-time updates to Claude
- **Why it's worth it:** Claude can poll pending questions; real-time
  updates would require MCP resources feature

---

## System Architecture

### Request Flow

1. Claude Code sends JSON-RPC request via stdin
2. MCP SDK parses request, identifies tool
3. Tool handler gets or creates client
4. Handler calls tRPC procedure via WebSocket
5. Server processes and responds
6. Handler formats response as JSON
7. MCP SDK sends JSON-RPC response via stdout
8. Claude Code receives tool result

### Tool Registration

Each tool is registered with:

```typescript
server.tool(
  "tool_name",           // Tool identifier
  "Description",         // Shown to Claude
  SchemaShape,          // Zod schema .shape for parameters
  async (params) => {    // Handler function
    // Implementation
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
);
```

### Error Handling Strategy

All tool handlers wrap operations in try/catch:

```typescript
try {
  const result = await getClient().trpc.operation.mutate(params);
  const text = JSON.stringify({ success: true, ...result });
  return { content: [{ type: "text", text }] };
} catch (error) {
  const text = JSON.stringify({ success: false, error: String(error) });
  return {
    content: [{ type: "text", text }],
    isError: true,
  };
}
```

This ensures Claude always receives a parseable response, even on errors.

---

## Data Flow

### Tool Invocation Flow

```text
┌──────────────┐
│  Claude Code │
└──────┬───────┘
       │ JSON-RPC (stdin)
       ▼
┌──────────────┐
│  MCP Server  │
└──────┬───────┘
       │ Tool handler
       ▼
┌──────────────┐
│ tRPC Client  │
└──────┬───────┘
       │ WebSocket
       ▼
┌──────────────┐
│ Coordinator  │
│   Server     │
└──────┬───────┘
       │ Response
       ▼
(reverse path back to Claude)
```

### State Transitions

```text
[Initial]
  │
  ▼
[No Client, No AgentId]
  │
  │ (any tool call)
  ▼
[Client Created, No AgentId]
  │
  │ (coordinator_join)
  ▼
[Client Created, AgentId Set]
  │
  │ (coordinator_leave)
  ▼
[Client Created, No AgentId]
  │
  │ (process exit)
  ▼
[Client Closed]
```

---

## Integration Points

### Internal Integrations

#### Integration 1: claude-coordinator-core

**How it integrates:** Imports schemas for tool parameter definitions

```typescript
import {
  JoinInputSchema,
  ShareContextInputSchema,
  AskInputSchema,
  AnswerInputSchema,
  LogDecisionInputSchema,
  DEFAULT_URL,
} from "@spencerbeggs/claude-coordinator-core";

server.tool("coordinator_join", "...", JoinInputSchema.shape, handler);
```

#### Integration 2: claude-coordinator-server

**How it integrates:** Connects via WebSocket to server

```typescript
import { createWSClient, createTRPCClient, wsLink } from "@trpc/client";

const wsClient = createWSClient({ url });
const trpc = createTRPCClient({ links: [wsLink({ client: wsClient })] });
```

### External Integrations

#### Integration 1: Claude Code (MCP Host)

**Purpose:** Enable Claude to use coordinator tools

**Protocol:** MCP over stdio (JSON-RPC 2.0)

**Configuration in Claude settings:**

```json
{
  "mcpServers": {
    "claude-coordinator": {
      "command": "npx",
      "args": ["@spencerbeggs/claude-coordinator-mcp"],
      "env": {}
    }
  }
}
```

**With custom URL:**

```json
{
  "mcpServers": {
    "claude-coordinator": {
      "command": "npx",
      "args": ["@spencerbeggs/claude-coordinator-mcp", "--url=ws://server:3030"],
      "env": {}
    }
  }
}
```

#### Integration 2: MCP SDK

**Purpose:** MCP protocol implementation

**Package:** `@modelcontextprotocol/sdk`

**Key imports:**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

---

## Testing Strategy

### Unit Tests

**Location:** `pkgs/claude-coordinator-mcp/src/*.test.ts`

**What to test:**

1. Client creation and connection
2. Tool parameter validation
3. Error response formatting

**Current tests:**

- `client.test.ts` - Client creation and typed interface

**Running tests:**

```bash
pnpm vitest run pkgs/claude-coordinator-mcp
```

### Integration Tests

**What to test:**

1. Full tool invocation flow
2. Multi-tool coordination scenarios
3. Error handling with server down

**Test setup:**

1. Start coordinator server
2. Start MCP server
3. Send JSON-RPC requests to stdin
4. Verify responses on stdout

### Manual Testing

**Testing with Claude Code:**

1. Configure MCP server in Claude settings
2. Start coordinator server
3. Open Claude Code session
4. Use tools via natural language: "Join the coordinator as source"
5. Verify responses and state

---

## Future Enhancements

### Phase 1: Short-term (next release)

- Add connection health check tool
- Add reconnection logic for dropped WebSocket
- Improve error messages with troubleshooting hints

### Phase 2: Medium-term (2-3 releases)

- Add MCP resources for agent list (real-time updates)
- Add batch operations for multiple context entries
- Add tool for downloading session transcript

### Phase 3: Long-term (future consideration)

- Add MCP prompts for common coordination workflows
- Support multiple simultaneous sessions
- Add authentication token support

---

## Related Documentation

**Internal Design Docs:**

- [Core Schemas](../claude-coordinator-core/architecture.md) - Schema definitions
- [Server Architecture](../claude-coordinator-server/architecture.md) - Server
  implementation

**Package Documentation:**

- `pkgs/claude-coordinator-mcp/README.md` - Package overview and Claude Code configuration
- `pkgs/claude-coordinator-mcp/package.json` - Package metadata

**External Resources:**

- [MCP Documentation](https://modelcontextprotocol.io) - Model Context Protocol
- [tRPC Client Documentation](https://trpc.io/docs/client) - tRPC client usage

---

**Document Status:** Current - Reflects implemented architecture as of
2026-01-21

**Next Steps:** Consider adding MCP resources for real-time agent list updates
