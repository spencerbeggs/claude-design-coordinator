---
status: current
module: claude-coordinator-server
category: architecture
created: 2026-01-21
updated: 2026-01-21
last-synced: 2026-01-21
completeness: 95
related:
  - ../claude-coordinator-core/architecture.md
  - ../claude-coordinator-mcp/architecture.md
dependencies:
  - ../claude-coordinator-core/architecture.md
---

# Claude Coordinator Server - Architecture

tRPC WebSocket server enabling real-time coordination between Claude Code
instances through session management, context sharing, Q&A, and decision
logging.

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

The `@spencerbeggs/claude-coordinator-server` package provides a WebSocket-based
coordination server that enables multiple Claude Code instances to communicate
in real-time. It acts as the central hub for session management, context
sharing, questions, and decision logging.

- **What problem does this architecture solve?** Provides real-time
  bidirectional communication between Claude Code instances running in
  different terminals or repositories.

- **What are the key design principles?**
  - Real-time communication via WebSocket
  - Type-safe procedures with tRPC
  - Event-driven architecture for subscriptions
  - Singleton state management per session

- **Why is this architecture appropriate for the use case?** Claude Code
  instances need low-latency, bidirectional communication for effective
  coordination. WebSocket + tRPC provides type safety with real-time
  capabilities.

**Key Design Principles:**

- **Event-Driven State:** All state changes emit events for real-time
  subscriptions
- **Stateful Sessions:** Single server maintains all session state in memory
- **Procedure-Based API:** tRPC procedures provide type-safe RPC semantics
- **Graceful Shutdown:** Proper cleanup and reconnection notification

**When to reference this document:**

- When adding new coordination features
- When debugging connection issues
- When modifying the tRPC router structure
- When implementing server-side state management

---

## Current State

### Server Components

The package contains four main components: server setup, state management,
router definition, and CLI entry point.

#### Server (`src/server.ts`)

**Location:** `pkgs/claude-coordinator-server/src/server.ts`

**Purpose:** Creates and manages the WebSocket server

**Key interfaces:**

```typescript
interface ServerOptions {
  port?: number;   // Default: 3030
  host?: string;   // Default: "localhost"
}

interface CoordinatorServer {
  wss: WebSocketServer;
  close: () => void;
}

function createServer(options?: ServerOptions): CoordinatorServer;
```

**Features:**

- WebSocket server on configurable port/host
- tRPC handler with keep-alive (30s ping, 5s pong timeout)
- Connection logging to stderr
- Graceful shutdown with reconnection notification

#### State Manager (`src/state.ts`)

**Location:** `pkgs/claude-coordinator-server/src/state.ts`

**Purpose:** Manages all session state with EventEmitter pattern

**Key interfaces:**

```typescript
interface CoordinatorStateEvents {
  agentChange: [agents: Agent[]];
  contextChange: [entry: ContextEntry];
  question: [question: Question];
  answer: [question: Question];
}

class CoordinatorState extends EventEmitter<CoordinatorStateEvents> {
  // Agent management
  addAgent(agent: Agent): void;
  removeAgent(agentId: string): boolean;
  getAgent(agentId: string): Agent | undefined;
  listAgents(): Agent[];

  // Context management
  setContext(entry: ContextEntry): void;
  getContext(key: string): ContextEntry | undefined;
  listContext(filters?: { tags?: string[]; createdBy?: string }): ContextEntry[];

  // Question management
  addQuestion(question: Question): void;
  answerQuestion(id: string, answer: string, by: string): Question | undefined;
  getQuestion(id: string): Question | undefined;
  listPendingQuestions(forAgentId?: string): Question[];

  // Decision management
  addDecision(decision: Decision): void;
  listDecisions(): Decision[];
}
```

**Singleton Pattern:**

```typescript
function getOrCreateState(sessionId?: string): CoordinatorState;
function resetState(): void;  // For testing
```

#### Router (`src/router.ts`)

**Location:** `pkgs/claude-coordinator-server/src/router.ts`

**Purpose:** Defines all tRPC procedures grouped by domain

**Router Structure:**

```typescript
const appRouter = t.router({
  session: sessionRouter,    // Agent join/leave, list, subscribe
  context: contextRouter,    // Share, get, list, subscribe
  questions: questionsRouter, // Ask, answer, list pending, subscribe
  decisions: decisionsRouter, // Log, list
});
```

**Procedures by Router:**

| Router | Procedure | Type | Description |
| ------ | --------- | ---- | ----------- |
| session | join | mutation | Join session as agent |
| session | leave | mutation | Leave session |
| session | list | query | List all connected agents |
| session | onAgentChange | subscription | Real-time agent updates |
| context | share | mutation | Share context entry |
| context | get | query | Get context by key |
| context | list | query | List context with filters |
| context | onContextChange | subscription | Real-time context updates |
| questions | ask | mutation | Ask a question |
| questions | answer | mutation | Answer a question |
| questions | listPending | query | List unanswered questions |
| questions | onQuestion | subscription | Real-time Q&A updates |
| decisions | log | mutation | Log a decision |
| decisions | list | query | List all decisions |

#### CLI Entry Point (`src/bin/cli.ts`)

**Location:** `pkgs/claude-coordinator-server/src/bin/cli.ts`

**Purpose:** Standalone server execution

**Configuration:**

- `PORT` environment variable (default: 3030)
- `HOST` environment variable (default: "localhost")

**Signal Handling:**

- SIGINT (Ctrl+C): Graceful shutdown
- SIGTERM: Graceful shutdown

### Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    claude-coordinator-server                         │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     CLI (bin/cli.ts)                          │  │
│  │  - Parse environment (PORT, HOST)                             │  │
│  │  - Create server                                              │  │
│  │  - Handle signals (SIGINT, SIGTERM)                           │  │
│  └───────────────────────────┬──────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Server (server.ts)                          │  │
│  │  ┌─────────────────┐  ┌────────────────────────────────┐    │  │
│  │  │  WebSocketServer │  │  tRPC WS Handler               │    │  │
│  │  │  (ws library)    │──│  - Keep-alive: 30s/5s         │    │  │
│  │  └─────────────────┘  │  - createContext()             │    │  │
│  │                       └────────────────────────────────┘    │  │
│  └───────────────────────────┬──────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Router (router.ts)                         │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│  │
│  │  │  session    │ │  context    │ │  questions  │ │decisions││  │
│  │  │  router     │ │  router     │ │  router     │ │ router  ││  │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └────┬────┘│  │
│  └─────────┼───────────────┼───────────────┼─────────────┼──────┘  │
│            │               │               │             │         │
│            ▼               ▼               ▼             ▼         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    State (state.ts)                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│  │
│  │  │  agents     │ │  context    │ │  questions  │ │decisions││  │
│  │  │  Map<id,    │ │  Map<key,   │ │  Map<id,    │ │ Array   ││  │
│  │  │  Agent>     │ │  Entry>     │ │  Question>  │ │         ││  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│  │
│  │                                                               │  │
│  │  EventEmitter: agentChange | contextChange | question | answer│  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      WebSocket Clients         │
              │  (claude-coordinator-mcp)      │
              └───────────────────────────────┘
```

### Current Limitations

- **In-memory state:** All state is lost on server restart
- **Single server:** No clustering or horizontal scaling
- **No authentication:** Any client can join any session
- **No persistence:** Decisions and context not persisted to disk

---

## Rationale

### Architectural Decisions

#### Decision 1: tRPC over WebSocket

**Context:** Need type-safe real-time communication

**Options considered:**

1. **tRPC + WebSocket (Chosen):**
   - Pros: Type safety, subscriptions, mature ecosystem
   - Cons: Additional dependency
   - Why chosen: Best balance of type safety and real-time capabilities

2. **Plain WebSocket + JSON:**
   - Pros: Simpler, no framework
   - Cons: No type safety, manual message handling
   - Why rejected: Too much boilerplate, error-prone

3. **Socket.io:**
   - Pros: Fallback transports, rooms
   - Cons: Heavy, no native TypeScript inference
   - Why rejected: Unnecessary complexity for our use case

#### Decision 2: EventEmitter-Based State

**Context:** Need to notify clients of state changes

**Options considered:**

1. **Node.js EventEmitter (Chosen):**
   - Pros: Native, well-understood, typed with TypeScript
   - Cons: Memory leaks if listeners not cleaned up
   - Why chosen: Simple, effective, no additional dependencies

2. **RxJS Observables:**
   - Pros: Powerful operators, backpressure
   - Cons: Learning curve, overkill for this use case
   - Why rejected: Complexity not justified

3. **Polling:**
   - Pros: Simpler client implementation
   - Cons: Latency, unnecessary load
   - Why rejected: Real-time updates are essential

#### Decision 3: Singleton State Per Server

**Context:** Need shared state across all connections

**Options considered:**

1. **Global singleton (Chosen):**
   - Pros: Simple, all connections share same state
   - Cons: Testing requires reset function
   - Why chosen: Appropriate for single-server deployment

2. **Per-connection state:**
   - Pros: Isolated testing
   - Cons: Doesn't match use case (shared session)
   - Why rejected: Coordination requires shared state

### Design Patterns Used

#### Pattern 1: Singleton State Manager

- **Where used:** `getOrCreateState()` function
- **Why used:** All clients must see same session state
- **Implementation:** Module-level variable with lazy initialization

#### Pattern 2: Event-Driven Updates

- **Where used:** All state mutations emit events
- **Why used:** tRPC subscriptions need event source
- **Implementation:** State extends typed EventEmitter

#### Pattern 3: Router Composition

- **Where used:** appRouter combines domain routers
- **Why used:** Logical grouping, maintainability
- **Implementation:** `t.router({ session, context, questions, decisions })`

### Constraints and Trade-offs

#### Constraint 1: MCP stdio Requirements

- **Description:** MCP bridge uses stdio for JSON-RPC
- **Impact:** Server must log to stderr only
- **Mitigation:** All `console.log` replaced with `console.error`

#### Trade-off 1: In-Memory vs Persistent State

- **What we gained:** Simplicity, no database setup required
- **What we sacrificed:** Persistence across restarts
- **Why it's worth it:** Coordination sessions are ephemeral by nature

---

## System Architecture

### Request Flow

1. Client establishes WebSocket connection
2. tRPC handler creates context with state reference
3. Client calls procedures (mutations/queries/subscriptions)
4. State manager updates in-memory data
5. EventEmitter notifies subscribers
6. tRPC subscription pushes updates to clients

### Layered Architecture

#### Layer 1: Transport (WebSocket)

**Responsibilities:**

- Accept/close connections
- Handle WebSocket protocol
- Keep-alive management

**Communication:** Raw WebSocket messages to tRPC handler

#### Layer 2: RPC (tRPC)

**Responsibilities:**

- Parse incoming messages
- Route to correct procedure
- Validate input with Zod schemas
- Serialize responses

**Communication:** Procedure calls to state manager

#### Layer 3: State (CoordinatorState)

**Responsibilities:**

- Store session data
- Emit events on changes
- Query and filter data

**Communication:** Events to tRPC subscriptions

### Component Interactions

#### Interaction 1: Agent Joins Session

**Participants:** Client, Router, State

**Flow:**

1. Client calls `session.join` with JoinInput
2. Router creates Agent with UUID, timestamps
3. State adds agent to Map
4. State emits "agentChange" event
5. Router returns JoinResult
6. Other clients receive update via `onAgentChange` subscription

**Sequence diagram:**

```text
Client        Router        State
  │             │             │
  ├──join()────>│             │
  │             ├──addAgent()─>│
  │             │             ├──emit("agentChange")
  │<──result────┤             │
  │             │             │
  │             │             │  (other clients)
  │             │<──event─────┤
  │             ├──next()────>│  subscription
```

#### Interaction 2: Question Asked and Answered

**Participants:** Source Client, Target Client, Router, State

**Flow:**

1. Source calls `questions.ask` with question text
2. State stores Question with "pending" status
3. State emits "question" event
4. Target receives question via `onQuestion` subscription
5. Target calls `questions.answer` with answer text
6. State updates Question with answer, "answered" status
7. State emits "answer" event
8. Source receives answered question via subscription

---

## Data Flow

### Data Model

All data stored in Maps keyed by string identifiers:

```typescript
// State storage
private agents: Map<string, Agent> = new Map();
private context: Map<string, ContextEntry> = new Map();
private questions: Map<string, Question> = new Map();
private decisions: Decision[] = [];  // Append-only
```

### State Updates

```text
[Mutation Request]
       │
       ▼
[Router Procedure]
       │
       ├── Validate input (Zod schema)
       │
       ▼
[State Manager Method]
       │
       ├── Update Map/Array
       ├── Emit Event
       │
       ▼
[Return Response]
       │
       └── Push to Subscriptions
```

### Subscription Flow

```text
[Client subscribes]
       │
       ▼
[tRPC observable() created]
       │
       ├── Attach event listener to State
       ├── Return cleanup function
       │
       ▼
[Event emitted by State]
       │
       ├── emit.next(data)
       │
       ▼
[Client receives update]
```

---

## Integration Points

### Internal Integrations

#### Integration 1: claude-coordinator-core

**How it integrates:** Imports schemas and types

```typescript
import type {
  Agent,
  ContextEntry,
  Question,
  Decision,
} from "@spencerbeggs/claude-coordinator-core";

import {
  JoinInputSchema,
  ShareContextInputSchema,
  // ...
} from "@spencerbeggs/claude-coordinator-core";
```

**Data exchange:** Types define state structure, schemas validate mutations

### External Integrations

#### Integration 1: WebSocket Clients (MCP Bridge)

**Purpose:** Enable Claude Code instances to coordinate

**Protocol:** WebSocket with tRPC JSON-RPC messages

**Authentication:** None currently (open session)

**Error handling:** tRPC error responses with typed errors

---

## Testing Strategy

### Unit Tests

**Location:** `pkgs/claude-coordinator-server/src/*.test.ts`

**What to test:**

1. State management methods
2. Event emission on state changes
3. Filter logic for queries

**Current tests:**

- `state.test.ts` - CoordinatorState unit tests

**Running tests:**

```bash
pnpm vitest run pkgs/claude-coordinator-server
```

### Integration Tests

**What to test:**

1. Client connection/disconnection
2. Multi-client coordination flows
3. Subscription delivery
4. Keep-alive behavior

**Running integration tests:**

```bash
# Start server
pnpm --filter @spencerbeggs/claude-coordinator-server run build:dev
node pkgs/claude-coordinator-server/dist/dev/bin/cli.js

# Run client tests in another terminal
pnpm vitest run pkgs/claude-coordinator-mcp
```

---

## Future Enhancements

### Phase 1: Short-term (next release)

- Add server health check endpoint
- Add agent timeout/cleanup for disconnected clients
- Add session ID validation

### Phase 2: Medium-term (2-3 releases)

- Add authentication (API key or token)
- Add state persistence to disk (JSON or SQLite)
- Add multiple session support

### Phase 3: Long-term (future consideration)

- Horizontal scaling with Redis pub/sub
- Rate limiting per agent
- Audit logging for compliance

---

## Related Documentation

**Internal Design Docs:**

- [Core Schemas](../claude-coordinator-core/architecture.md) - Schema definitions
- [MCP Bridge](../claude-coordinator-mcp/architecture.md) - Client implementation

**Package Documentation:**

- `pkgs/claude-coordinator-server/README.md` - Package overview and deployment guide
- `pkgs/claude-coordinator-server/package.json` - Package metadata

**External Resources:**

- [tRPC Documentation](https://trpc.io) - Type-safe API framework
- [ws Library](https://github.com/websockets/ws) - WebSocket implementation

---

**Document Status:** Current - Reflects implemented architecture as of
2026-01-21

**Next Steps:** Consider adding authentication and state persistence
