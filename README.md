# Claude Design Coordinator

A coordination system that enables multiple Claude Code instances to communicate
and share knowledge in real-time. Perfect for scenarios where you need Claude
to transfer knowledge between repositories, coordinate complex multi-project
tasks, or synchronize work across different codebases.

## The Problem

When working with Claude Code across multiple projects, each instance operates
in isolation. If you need Claude to:

- Transfer architecture knowledge from one project to another
- Coordinate implementation across multiple repositories
- Share decisions and context between parallel work streams
- Ask questions across project boundaries

...you're stuck manually copying information between sessions.

## The Solution

Claude Design Coordinator provides a WebSocket-based coordination server that
Claude Code instances can connect to via MCP (Model Context Protocol). Multiple
Claude instances can:

- **Join sessions** as "source" (knowledge provider) or "target" (knowledge receiver)
- **Share context** with key-value pairs and tags for organized knowledge transfer
- **Ask and answer questions** across project boundaries
- **Log decisions** with rationale for cross-project visibility

## Architecture

```text
┌─────────────────────┐     ┌─────────────────────┐
│   Claude Code #1    │     │   Claude Code #2    │
│   (Source Repo)     │     │   (Target Repo)     │
└─────────┬───────────┘     └─────────┬───────────┘
          │                           │
          │ MCP (stdio)               │ MCP (stdio)
          │                           │
┌─────────▼───────────┐     ┌─────────▼───────────┐
│  coordinator-mcp    │     │  coordinator-mcp    │
│  (MCP Bridge)       │     │  (MCP Bridge)       │
└─────────┬───────────┘     └─────────┬───────────┘
          │                           │
          │ WebSocket                 │ WebSocket
          │                           │
          └───────────┬───────────────┘
                      │
            ┌─────────▼─────────┐
            │ coordinator-server │
            │ (tRPC WebSocket)   │
            └───────────────────┘
```

## Packages

- **[@spencerbeggs/claude-coordinator-core][core]** -
  Zod schemas and TypeScript types
- **[@spencerbeggs/claude-coordinator-server][server]** -
  tRPC WebSocket coordination server
- **[@spencerbeggs/claude-coordinator-mcp][mcp]** -
  MCP stdio bridge for Claude Code

[core]: ./pkgs/claude-coordinator-core
[server]: ./pkgs/claude-coordinator-server
[mcp]: ./pkgs/claude-coordinator-mcp

## Quick Start

### 1. Install the Packages

```bash
# Install globally for CLI access
npm install -g @spencerbeggs/claude-coordinator-server
npm install -g @spencerbeggs/claude-coordinator-mcp
```

### 2. Start the Coordination Server

In a terminal that will stay open:

```bash
claude-coordinator-server
```

You should see:

```text
[coordinator] Server started on ws://localhost:3030
```

### 3. Configure Claude Code

Add the MCP server to your Claude Code settings. On macOS, edit
`~/Library/Application Support/Claude/claude_desktop_config.json`:

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

If your server is running on a different host or port:

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

### 4. Restart Claude Code

After updating the configuration, restart Claude Code (or Claude Desktop) to
load the MCP server.

## Usage Scenarios

### Scenario 1: Knowledge Transfer Between Repositories

You have an existing project with complex architecture, and you want Claude to
apply similar patterns to a new project.

**In the source repository (Terminal 1):**

```text
You: Join the coordinator as a source agent for this project

Claude: I'll join the coordination session as a source.
[Uses coordinator_join tool]

You: Share the key architectural decisions from this codebase

Claude: I'll analyze the codebase and share the important context.
[Uses coordinator_share_context multiple times to share:
 - "architecture/patterns" → Event-driven with Effect-TS
 - "architecture/structure" → Monorepo with packages in pkgs/
 - "testing/strategy" → Vitest with integration tests
 - etc.]
```

**In the target repository (Terminal 2):**

```text
You: Join the coordinator as a target agent

Claude: I'll join as a target to receive knowledge.
[Uses coordinator_join tool]

You: What architectural patterns should I follow based on the source project?

Claude: Let me check what context has been shared.
[Uses coordinator_list_context tool]

I can see the source project uses:
- Event-driven architecture with Effect-TS
- Monorepo structure with packages in pkgs/
- Vitest for testing

Would you like me to set up similar patterns here?
```

### Scenario 2: Cross-Project Q&A

The target project needs specific information that requires analyzing the
source codebase.

**In the target repository:**

```text
You: Ask the source project how they handle authentication

Claude: I'll ask the source agent.
[Uses coordinator_ask tool with question: "How is authentication handled
 in this codebase? What libraries and patterns are used?"]

The question has been sent. Let me check for a response.
[Uses coordinator_pending_questions tool periodically]
```

**In the source repository:**

```text
Claude: [Receives notification of pending question]
I have a question from the target project about authentication.

Let me analyze the codebase and respond.
[Analyzes code, then uses coordinator_answer tool]

I've shared that authentication uses JWT tokens with the jose library,
middleware validates tokens on protected routes, and tokens are stored
in HTTP-only cookies.
```

### Scenario 3: Coordinated Multi-Repository Changes

You need to make coordinated changes across multiple repositories.

**Coordinator session with both projects joined:**

```text
Source Claude: I'll log the decision to migrate from REST to GraphQL.
[Uses coordinator_log_decision with decision and rationale]

Target Claude: I can see the decision to migrate to GraphQL.
[Uses coordinator_list_decisions]
I'll update this repository's API client to use GraphQL accordingly.
```

## Available MCP Tools

Once configured, Claude Code has access to these tools:

| Tool                           | Description                            |
| ------------------------------ | -------------------------------------- |
| `coordinator_join`             | Join a session as source or target     |
| `coordinator_leave`            | Leave the current session              |
| `coordinator_list_agents`      | See who's connected                    |
| `coordinator_share_context`    | Share knowledge with key, value, tags  |
| `coordinator_get_context`      | Retrieve specific context by key       |
| `coordinator_list_context`     | List all shared context                |
| `coordinator_ask`              | Ask a question to other agents         |
| `coordinator_answer`           | Answer a pending question              |
| `coordinator_pending_questions`| Check for unanswered questions         |
| `coordinator_log_decision`     | Record a decision with rationale       |
| `coordinator_list_decisions`   | View all logged decisions              |

## Configuration

### Server Environment Variables

| Variable | Default     | Description           |
| -------- | ----------- | --------------------- |
| `PORT`   | `3030`      | WebSocket server port |
| `HOST`   | `localhost` | Server bind address   |

### MCP Command Line Arguments

| Argument | Default                | Description              |
| -------- | ---------------------- | ------------------------ |
| `--url`  | `ws://localhost:3030`  | Coordinator server URL   |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, testing, and
contribution guidelines.

## Use Cases

- **Project migrations**: Transfer knowledge from legacy to new codebase
- **Microservices coordination**: Share API contracts and patterns
- **Team onboarding**: Source project explains patterns to target
- **Code reviews**: Reviewer and author in different repos coordinate
- **Documentation**: Generate docs in one repo based on another's code
- **Dependency updates**: Coordinate breaking changes across consumers

## Limitations

- **In-memory state**: Session data is not persisted across server restarts
- **Single server**: No clustering or horizontal scaling (yet)
- **No authentication**: Any client can join any session
- **No subscriptions in MCP**: Real-time updates require polling

## License

MIT © C. Spencer Beggs

## Related

- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Claude Code](https://claude.ai/code) - AI-powered coding assistant
