# @spencerbeggs/claude-coordinator-core

Core schemas and TypeScript types for the Claude Coordinator system, providing
Zod-based validation and type-safe communication primitives.

## Features

- **Type-safe schemas** - Zod schemas with full TypeScript inference
- **Runtime validation** - Validate all data at runtime with helpful error
  messages
- **Zero runtime deps** - Only Zod required at runtime
- **Schema-first design** - Define once, use everywhere

## Installation

```bash
npm install @spencerbeggs/claude-coordinator-core
```

## Quick Start

```typescript
import {
  AgentSchema,
  JoinInputSchema,
  QuestionSchema,
  type Agent,
  type JoinInput,
} from "@spencerbeggs/claude-coordinator-core";

// Validate input data
const input = JoinInputSchema.parse({
  name: "my-agent",
  role: "source",
  repoPath: "/path/to/repo",
});

// Type inference works automatically
const agent: Agent = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  role: "source",
  name: "my-agent",
  repoPath: "/path/to/repo",
  connectedAt: new Date(),
};

// Validate the agent
AgentSchema.parse(agent);
```

## API Overview

### Schemas

| Schema | Description |
| ------ | ----------- |
| `AgentSchema` | Connected agent identity |
| `JoinInputSchema` | Input for joining a session |
| `JoinResultSchema` | Result from joining (agent + sessionId) |
| `ContextEntrySchema` | Shared context key-value entry |
| `ShareContextInputSchema` | Input for sharing context |
| `QuestionSchema` | Question with optional answer |
| `AskInputSchema` | Input for asking a question |
| `AnswerInputSchema` | Input for answering a question |
| `DecisionSchema` | Logged decision with rationale |
| `LogDecisionInputSchema` | Input for logging a decision |

### Types

All types are inferred from schemas:

```typescript
import type {
  Agent,
  JoinInput,
  JoinResult,
  ContextEntry,
  Question,
  Decision,
} from "@spencerbeggs/claude-coordinator-core";
```

### Constants

```typescript
import {
  DEFAULT_PORT,   // 3030
  DEFAULT_HOST,   // "localhost"
  DEFAULT_URL,    // "ws://localhost:3030"
} from "@spencerbeggs/claude-coordinator-core";
```

## Documentation

- [Architecture Design Doc](../../.claude/design/claude-coordinator-core/architecture.md)
- [Server Package](../claude-coordinator-server/README.md)
- [MCP Bridge Package](../claude-coordinator-mcp/README.md)

## License

MIT
