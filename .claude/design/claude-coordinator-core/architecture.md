---
status: current
module: claude-coordinator-core
category: architecture
created: 2026-01-21
updated: 2026-01-21
last-synced: 2026-01-21
completeness: 95
related:
  - ../claude-coordinator-server/architecture.md
  - ../claude-coordinator-mcp/architecture.md
dependencies: []
---

# Claude Coordinator Core - Architecture

Core schemas and TypeScript types for the Claude Coordinator system, providing
Zod-based validation and type-safe communication primitives.

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

The `@spencerbeggs/claude-coordinator-core` package provides the foundational
schemas and types for the Claude Coordinator system. It enables multiple
Claude Code instances to communicate with each other through a shared
coordination server.

- **What problem does this architecture solve?** Provides type-safe,
  validated schemas for all communication between Claude Code instances,
  ensuring consistent data structures across the distributed system.

- **What are the key design principles?**
  - Single source of truth for all shared types
  - Runtime validation with Zod schemas
  - Type inference for TypeScript consumers
  - Zero external runtime dependencies (except Zod)

- **Why is this architecture appropriate for the use case?** Claude Code
  instances need consistent data contracts to reliably share context,
  ask questions, and log decisions. Zod provides both runtime validation
  and compile-time type safety.

**Key Design Principles:**

- **Schema-First Design:** All data structures are defined as Zod schemas first,
  with TypeScript types inferred automatically
- **Separation of Concerns:** Schemas are grouped by domain (agent, context,
  question, decision)
- **Minimal Dependencies:** Only Zod is required at runtime
- **Export Everything:** All schemas and types are re-exported from index for
  easy consumption

**When to reference this document:**

- When adding new message types to the coordination protocol
- When modifying existing schema structures
- When debugging serialization/validation issues
- When integrating a new client with the coordinator

---

## Current State

### Schema Modules

The package contains four schema modules, each handling a specific domain of
the coordination protocol.

#### Agent Schema (`src/schemas/agent.ts`)

**Location:** `pkgs/claude-coordinator-core/src/schemas/agent.ts`

**Purpose:** Defines agent identity and session management

**Schemas:**

- `AgentRoleSchema` - Enum for agent roles ("source" | "target")
- `AgentSchema` - Connected agent with id, role, name, repoPath, connectedAt
- `JoinInputSchema` - Input for joining a session
- `JoinResultSchema` - Result containing agent and sessionId

**Key interfaces:**

```typescript
interface Agent {
  id: string;           // UUID
  role: "source" | "target";
  name: string;
  repoPath: string;
  connectedAt: Date;
}

interface JoinInput {
  name: string;
  role: "source" | "target";
  repoPath: string;
}

interface JoinResult {
  agent: Agent;
  sessionId: string;    // UUID
}
```

#### Context Schema (`src/schemas/context.ts`)

**Location:** `pkgs/claude-coordinator-core/src/schemas/context.ts`

**Purpose:** Defines shared context entries for knowledge transfer

**Schemas:**

- `ContextEntrySchema` - A shared piece of context with key, value, tags
- `ShareContextInputSchema` - Input for sharing context
- `GetContextInputSchema` - Input for retrieving context by key
- `ListContextInputSchema` - Input for listing context with filters

**Key interfaces:**

```typescript
interface ContextEntry {
  id: string;           // UUID
  key: string;
  value: string;
  tags: string[];
  createdBy: string;    // Agent UUID
  createdAt: Date;
  updatedAt: Date;
}
```

#### Question Schema (`src/schemas/question.ts`)

**Location:** `pkgs/claude-coordinator-core/src/schemas/question.ts`

**Purpose:** Defines question/answer interactions between agents

**Schemas:**

- `QuestionStatusSchema` - Enum for status ("pending" | "answered")
- `QuestionSchema` - A question with optional targeting and answer
- `AskInputSchema` - Input for asking a question
- `AnswerInputSchema` - Input for answering a question
- `QuestionEventSchema` - Event when question is asked
- `AnswerEventSchema` - Event when question is answered

**Key interfaces:**

```typescript
interface Question {
  id: string;           // UUID
  question: string;
  from: string;         // Asking agent UUID
  to?: string;          // Optional target agent UUID
  answer?: string;
  answeredBy?: string;  // UUID
  status: "pending" | "answered";
  createdAt: Date;
  answeredAt?: Date;
}
```

#### Decision Schema (`src/schemas/decision.ts`)

**Location:** `pkgs/claude-coordinator-core/src/schemas/decision.ts`

**Purpose:** Defines logged decisions made during coordination

**Schemas:**

- `DecisionSchema` - A logged decision with rationale
- `LogDecisionInputSchema` - Input for logging a decision

**Key interfaces:**

```typescript
interface Decision {
  id: string;           // UUID
  decision: string;
  rationale?: string;
  by: string;           // Agent UUID
  createdAt: Date;
}
```

### Constants

**Location:** `pkgs/claude-coordinator-core/src/index.ts`

```typescript
export const DEFAULT_PORT: number = 3030;
export const DEFAULT_HOST: string = "localhost";
export const DEFAULT_URL: string = `ws://${DEFAULT_HOST}:${DEFAULT_PORT}`;
```

### Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                     claude-coordinator-core                      │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  agent.ts      │  │  context.ts    │  │  question.ts   │    │
│  │  - AgentSchema │  │  - ContextEntry│  │  - Question    │    │
│  │  - JoinInput   │  │  - ShareInput  │  │  - AskInput    │    │
│  │  - JoinResult  │  │  - GetInput    │  │  - AnswerInput │    │
│  └────────────────┘  │  - ListInput   │  │  - Events      │    │
│                      └────────────────┘  └────────────────┘    │
│                                                                  │
│  ┌────────────────┐  ┌────────────────────────────────────┐    │
│  │  decision.ts   │  │            index.ts                 │    │
│  │  - Decision    │  │  - Re-exports all schemas/types     │    │
│  │  - LogInput    │  │  - Constants (PORT, HOST, URL)      │    │
│  └────────────────┘  └────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │         Consumers              │
              │  - claude-coordinator-server   │
              │  - claude-coordinator-mcp      │
              └───────────────────────────────┘
```

### Current Limitations

- **No schema versioning:** No mechanism for schema evolution/migration
- **String-based values:** Context values are strings only, no structured data
- **No pagination:** List operations don't support pagination

---

## Rationale

### Architectural Decisions

#### Decision 1: Zod for Schema Validation

**Context:** Need runtime validation with TypeScript type inference

**Options considered:**

1. **Zod (Chosen):**
   - Pros: Excellent TypeScript inference, composable, widely adopted
   - Cons: Bundle size (~50KB minified)
   - Why chosen: Best developer experience for type-safe validation

2. **io-ts:**
   - Pros: Functional programming style, Effect-TS compatible
   - Cons: More complex API, steeper learning curve
   - Why rejected: Complexity not justified for this use case

3. **JSON Schema + ajv:**
   - Pros: Standard format, broad tooling support
   - Cons: No native TypeScript inference
   - Why rejected: Poor TypeScript developer experience

#### Decision 2: Separate Schema Modules by Domain

**Context:** Organize schemas logically for maintainability

**Options considered:**

1. **Domain-based modules (Chosen):**
   - Pros: Clear separation, easier to find related schemas
   - Cons: More files to manage
   - Why chosen: Logical grouping improves maintainability

2. **Single schemas file:**
   - Pros: Simpler file structure
   - Cons: Large file, mixed concerns
   - Why rejected: Would become unwieldy as schemas grow

### Design Patterns Used

#### Pattern 1: Schema-First Design

- **Where used:** All schema definitions
- **Why used:** Ensures runtime validation matches compile-time types
- **Implementation:** Define Zod schema, infer TypeScript type

```typescript
export const AgentSchema = z.object({ ... });
export type Agent = z.infer<typeof AgentSchema>;
```

#### Pattern 2: Input/Output Schema Separation

- **Where used:** All API operations
- **Why used:** Input schemas can omit generated fields (id, timestamps)
- **Implementation:** Separate `*InputSchema` for mutations

### Constraints and Trade-offs

#### Constraint 1: Zod 4.x Compatibility

- **Description:** Must use Zod v4 for modern schema features
- **Impact:** Cannot use Zod v3 codebases without migration
- **Mitigation:** Zod v4 is stable and well-supported

#### Trade-off 1: String Context Values

- **What we gained:** Simplicity, no serialization complexity
- **What we sacrificed:** Structured context data
- **Why it's worth it:** Agents can JSON.stringify structured data if needed

---

## System Architecture

### Module Organization

All schemas follow a consistent pattern:

1. **Schema definition** with `.describe()` documentation
2. **Type export** via `z.infer<>`
3. **Input schemas** for operations that create/modify data
4. **Event schemas** for real-time notifications

### Schema Composition

Schemas reference each other through UUID string fields rather than
nested objects to keep serialization simple:

```typescript
// Questions reference agents by ID, not by embedding Agent objects
export const QuestionSchema = z.object({
  from: z.string().uuid().describe("ID of the agent asking"),
  to: z.string().uuid().optional().describe("ID of target agent"),
  // ...
});
```

### Error Handling Strategy

- Zod parse errors provide detailed path and message information
- Schemas use `.describe()` to improve error messages
- All UUID fields use `.uuid()` for format validation

---

## Data Flow

### Type Flow

```text
[Schema Definition]
       │
       ▼
[z.infer<> Type]
       │
       ├──────────────────────────────────────┐
       ▼                                      ▼
[Server (validation)]                 [Client (type safety)]
       │                                      │
       ▼                                      ▼
[State Management]                    [MCP Tool Args]
```

### Validation Points

1. **Server receives mutation:** Validates input against InputSchema
2. **Server returns data:** Data conforms to output schema (no validation
   needed as server creates it)
3. **Client types:** TypeScript enforces correct usage at compile time

---

## Integration Points

### Internal Integrations

#### Integration 1: claude-coordinator-server

**How it integrates:** Imports schemas for tRPC procedure validation

**Interface:**

```typescript
import {
  JoinInputSchema,
  ShareContextInputSchema,
  AskInputSchema,
  AnswerInputSchema,
  LogDecisionInputSchema,
} from "@spencerbeggs/claude-coordinator-core";
```

**Data exchange:** Server uses schemas to validate incoming mutations

#### Integration 2: claude-coordinator-mcp

**How it integrates:** Imports schemas for MCP tool parameter definitions

**Interface:**

```typescript
import {
  JoinInputSchema,
  ShareContextInputSchema,
  // ...
} from "@spencerbeggs/claude-coordinator-core";

server.tool("coordinator_join", "...", JoinInputSchema.shape, handler);
```

**Data exchange:** MCP tools use `.shape` for parameter definitions

---

## Testing Strategy

### Unit Tests

**Location:** `pkgs/claude-coordinator-core/src/schemas/*.test.ts`

**What to test:**

1. Schema validation accepts valid data
2. Schema validation rejects invalid data
3. Type inference works correctly (compile-time test)
4. Edge cases (empty strings, missing optional fields)

**Running tests:**

```bash
pnpm vitest run pkgs/claude-coordinator-core
```

### Current Test Coverage

- `agent.test.ts` - Agent schema validation
- `context.test.ts` - Context schema validation
- `question.test.ts` - Question schema validation
- `decision.test.ts` - Decision schema validation

---

## Future Enhancements

### Phase 1: Short-term (next release)

- Add JSDoc comments to all exported types
- Add `.example()` to schemas for documentation

### Phase 2: Medium-term (2-3 releases)

- Add schema versioning mechanism
- Support structured context values (JSON-serializable objects)
- Add message batching schemas

### Phase 3: Long-term (future consideration)

- Add file transfer schemas for sharing code snippets
- Add streaming schemas for large context transfer
- Consider Effect Schema migration for better error handling

---

## Related Documentation

**Internal Design Docs:**

- [Server Architecture](../claude-coordinator-server/architecture.md) - Server
  implementation details
- [MCP Bridge Architecture](../claude-coordinator-mcp/architecture.md) - MCP
  tool implementation

**Package Documentation:**

- `pkgs/claude-coordinator-core/README.md` - Package overview and API reference
- `pkgs/claude-coordinator-core/package.json` - Package metadata

**External Resources:**

- [Zod Documentation](https://zod.dev) - Schema validation library
- [tRPC Documentation](https://trpc.io) - Type-safe API framework

---

**Document Status:** Current - Reflects implemented architecture as of
2026-01-21

**Next Steps:** Consider schema versioning for future breaking changes
