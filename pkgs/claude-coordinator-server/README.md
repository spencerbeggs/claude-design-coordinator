# @spencerbeggs/claude-coordinator-server

tRPC WebSocket server enabling real-time coordination between Claude Code
instances through session management, context sharing, Q&A, and decision
logging.

## Features

- **Real-time communication** - WebSocket-based with tRPC subscriptions
- **Session management** - Agents join/leave coordinated sessions
- **Context sharing** - Share and retrieve key-value context entries
- **Q&A system** - Ask and answer questions between agents
- **Decision logging** - Track decisions made during coordination

## Installation

```bash
npm install @spencerbeggs/claude-coordinator-server
```

## Quick Start

### Start the Server

```bash
# Using npx
npx @spencerbeggs/claude-coordinator-server

# With custom port
PORT=3031 npx @spencerbeggs/claude-coordinator-server

# With custom host
HOST=0.0.0.0 PORT=3030 npx @spencerbeggs/claude-coordinator-server
```

### Use Programmatically

```typescript
import { createServer } from "@spencerbeggs/claude-coordinator-server";

const server = createServer({
  port: 3030,
  host: "localhost",
});

console.log("Server started on ws://localhost:3030");

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close();
});
```

## API Overview

The server exposes tRPC procedures organized by domain:

### Session

| Procedure | Type | Description |
| --------- | ---- | ----------- |
| `session.join` | mutation | Join session as an agent |
| `session.leave` | mutation | Leave current session |
| `session.list` | query | List connected agents |
| `session.onAgentChange` | subscription | Real-time agent updates |

### Context

| Procedure | Type | Description |
| --------- | ---- | ----------- |
| `context.share` | mutation | Share a context entry |
| `context.get` | query | Get context by key |
| `context.list` | query | List context entries |
| `context.onContextChange` | subscription | Real-time context updates |

### Questions

| Procedure | Type | Description |
| --------- | ---- | ----------- |
| `questions.ask` | mutation | Ask a question |
| `questions.answer` | mutation | Answer a question |
| `questions.listPending` | query | List unanswered questions |
| `questions.onQuestion` | subscription | Real-time Q&A updates |

### Decisions

| Procedure | Type | Description |
| --------- | ---- | ----------- |
| `decisions.log` | mutation | Log a decision |
| `decisions.list` | query | List all decisions |

## Configuration

| Environment Variable | Default | Description |
| -------------------- | ------- | ----------- |
| `PORT` | `3030` | Server port |
| `HOST` | `localhost` | Server host |

## Documentation

- [Architecture Design Doc](../../.claude/design/claude-coordinator-server/architecture.md)
- [Core Schemas Package](../claude-coordinator-core/README.md)
- [MCP Bridge Package](../claude-coordinator-mcp/README.md)

## License

MIT
