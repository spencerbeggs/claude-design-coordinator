# @spencerbeggs/claude-coordinator-mcp

MCP stdio bridge that exposes coordination tools to Claude Code instances,
enabling them to communicate through the coordinator server.

## Features

- **MCP tool integration** - Expose coordination as Claude Code tools
- **stdio transport** - Standard MCP communication protocol
- **Lazy connection** - Connect to server only when needed
- **Consistent responses** - All tools return predictable JSON format

## Installation

```bash
npm install @spencerbeggs/claude-coordinator-mcp
```

## Quick Start

### Configure in Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "claude-coordinator": {
      "command": "npx",
      "args": ["@spencerbeggs/claude-coordinator-mcp"]
    }
  }
}
```

With a custom server URL:

```json
{
  "mcpServers": {
    "claude-coordinator": {
      "command": "npx",
      "args": [
        "@spencerbeggs/claude-coordinator-mcp",
        "--url=ws://192.168.1.100:3030"
      ]
    }
  }
}
```

### Run Standalone

```bash
# Default URL (ws://localhost:3030)
npx @spencerbeggs/claude-coordinator-mcp

# Custom URL
npx @spencerbeggs/claude-coordinator-mcp --url=ws://server:3030
```

## Available Tools

Once configured, Claude Code can use these tools:

### Session Tools

| Tool | Parameters | Description |
| ---- | ---------- | ----------- |
| `coordinator_join` | name, role, repoPath | Join session as agent |
| `coordinator_leave` | (none) | Leave current session |
| `coordinator_list_agents` | (none) | List connected agents |

### Context Tools

| Tool | Parameters | Description |
| ---- | ---------- | ----------- |
| `coordinator_share_context` | key, value, tags? | Share context entry |
| `coordinator_get_context` | key | Get context by key |
| `coordinator_list_context` | tags?, createdBy? | List context entries |

### Question Tools

| Tool | Parameters | Description |
| ---- | ---------- | ----------- |
| `coordinator_ask` | question, to? | Ask a question |
| `coordinator_answer` | questionId, answer | Answer a question |
| `coordinator_pending_questions` | agentId? | List pending questions |

### Decision Tools

| Tool | Parameters | Description |
| ---- | ---------- | ----------- |
| `coordinator_log_decision` | decision, rationale? | Log a decision |
| `coordinator_list_decisions` | (none) | List all decisions |

## Usage Example

Once configured, Claude Code can coordinate with other instances:

```text
User: "Join the coordinator as a source agent"

Claude: I'll join the coordination session.
[Uses coordinator_join tool with role="source"]

User: "Share that we're using React 18"

Claude: I'll share that context.
[Uses coordinator_share_context with key="framework" value="React 18"]

User: "Ask the other agent what testing framework they prefer"

Claude: I'll ask the question.
[Uses coordinator_ask with question="What testing framework do you prefer?"]
```

## Response Format

All tools return JSON with consistent structure:

```json
// Success
{ "success": true, "agent": {...}, "sessionId": "..." }

// Error
{ "success": false, "error": "Error description" }
```

## Documentation

- [Architecture Design Doc](../../.claude/design/claude-coordinator-mcp/architecture.md)
- [Core Schemas Package](../claude-coordinator-core/README.md)
- [Server Package](../claude-coordinator-server/README.md)

## License

MIT
