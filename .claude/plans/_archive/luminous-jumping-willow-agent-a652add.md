---
name: claude-coordinator-design-docs
title: Create Design Documentation for Claude Coordinator Project
created: 2026-01-21
updated: 2026-01-21
status: ready
progress: 0
modules:
  - claude-coordinator-core
  - claude-coordinator-server
  - claude-coordinator-mcp
owner: "@spencerbeggs"
estimated-effort: "1-2 hours"
categories:
  - documentation
  - architecture
---

## Overview

Create the foundational design documentation system for the Claude Coordinator
project, which enables multi-Claude Code coordination via tRPC/WebSocket. This
includes the configuration file and design documents for the three core modules.

## Files to Create

### 1. Configuration File

**Path:** `.claude/design/design.config.json`

Configuration for the design documentation system with:

- Project: claude-design-coordinator
- Modules: claude-coordinator-core, claude-coordinator-server,
  claude-coordinator-mcp
- Quality standards following the JSON schema

### 2. Architecture Overview Document

**Path:** `.claude/design/architecture-overview.md`

Architecture overview covering:

- Purpose: Multi-Claude Code coordination via tRPC/WebSocket
- Data flow: Claude Code <-> MCP Bridge <-> Coordinator Server <-> MCP Bridge
  <-> Claude Code
- Domain objects: Agent, ContextEntry, Question, Decision
- Package relationships: core -> server -> mcp (build order)

### 3. Core Package Design Document

**Path:** `.claude/design/claude-coordinator-core/domain-schemas.md`

Core package design:

- Zod schemas: AgentSchema, ContextEntrySchema, QuestionSchema, DecisionSchema
- Input schemas: JoinInputSchema, ShareContextInputSchema, AskInputSchema, etc.
- Constants: DEFAULT_PORT=3030, DEFAULT_HOST="localhost"

### 4. Server Package Design Document

**Path:** `.claude/design/claude-coordinator-server/trpc-server.md`

Server package design:

- tRPC routers: session, context, questions, decisions
- State management: EventEmitter-based CoordinatorState class
- WebSocket adapter with keep-alive
- Subscription patterns using observable()

### 5. MCP Package Design Document

**Path:** `.claude/design/claude-coordinator-mcp/mcp-bridge.md`

MCP package design:

- 10 tools: coordinator_join, coordinator_leave, coordinator_list_agents,
  coordinator_share_context, coordinator_get_context, coordinator_ask,
  coordinator_answer, coordinator_pending_questions, coordinator_log_decision,
  coordinator_list_decisions
- StdioServerTransport
- tRPC WebSocket client bridge
- CRITICAL: stderr logging only (stdout breaks JSON-RPC)

## Implementation Phases

### Phase 1: Create Directory Structure and Config

1. Ensure directories exist:
   - `.claude/design/claude-coordinator-core/`
   - `.claude/design/claude-coordinator-server/`
   - `.claude/design/claude-coordinator-mcp/`
2. Create `design.config.json` with proper schema

### Phase 2: Create Architecture Overview

1. Write `architecture-overview.md` with frontmatter
2. Include system purpose, data flow, domain objects
3. Document package relationships and build order

### Phase 3: Create Core Package Design Doc

1. Write `domain-schemas.md` with frontmatter
2. Document all Zod schemas with TypeScript examples
3. Include constants and configuration values

### Phase 4: Create Server Package Design Doc

1. Write `trpc-server.md` with frontmatter
2. Document router structure and procedures
3. Include state management and subscription patterns

### Phase 5: Create MCP Package Design Doc

1. Write `mcp-bridge.md` with frontmatter
2. Document all 10 MCP tools with signatures
3. Include critical stderr-only logging requirement

### Phase 6: Validate All Documentation

1. Run `/design-validate all` to check all documents
2. Fix any validation errors
3. Generate initial design report

## File Contents

### design.config.json

```json
{
  "$schema": ".claude/skills/design-config/json-schemas/current.json",
  "version": "1.0.0",
  "project": {
    "name": "spencerbeggs/claude-design-coordinator",
    "type": "monorepo",
    "repository": "https://github.com/spencerbeggs/claude-design-coordinator",
    "maintainer": "C. Spencer Beggs"
  },
  "paths": {
    "designDocs": ".claude/design",
    "plans": ".claude/plans",
    "skills": ".claude/skills",
    "context": "CLAUDE.md",
    "localContext": "CLAUDE.local.md"
  },
  "modules": {
    "claude-coordinator-core": {
      "path": "pkgs/claude-coordinator-core",
      "designDocsPath": ".claude/design/claude-coordinator-core",
      "categories": ["architecture", "integration"],
      "maintainer": "C. Spencer Beggs"
    },
    "claude-coordinator-server": {
      "path": "pkgs/claude-coordinator-server",
      "designDocsPath": ".claude/design/claude-coordinator-server",
      "categories": ["architecture", "integration", "performance"],
      "maintainer": "C. Spencer Beggs"
    },
    "claude-coordinator-mcp": {
      "path": "pkgs/claude-coordinator-mcp",
      "designDocsPath": ".claude/design/claude-coordinator-mcp",
      "categories": ["architecture", "integration"],
      "maintainer": "C. Spencer Beggs"
    }
  },
  "skills": {
    "baseNamespace": "/",
    "enabled": [
      "design-init",
      "design-validate",
      "design-update",
      "design-sync",
      "design-review",
      "design-audit",
      "design-search",
      "design-report",
      "plan-create",
      "plan-validate",
      "plan-list"
    ]
  },
  "quality": {
    "designDocs": {
      "maxLineLength": 120,
      "requireFrontmatter": true,
      "requireTOC": true,
      "minSections": ["Overview", "Current State", "Rationale"]
    },
    "context": {
      "rootMaxLines": 500,
      "childMaxLines": 300,
      "requireDesignDocPointers": true
    },
    "plans": {
      "maxLineLength": 120,
      "requireFrontmatter": true,
      "requiredFields": ["name", "title", "created", "status", "progress"],
      "validStatuses": ["ready", "in-progress", "blocked", "completed", "abandoned"],
      "progressRange": [0, 100],
      "stalenessThresholdDays": 30
    }
  },
  "integration": {
    "ci": {
      "enabled": false,
      "validateOnPR": false,
      "syncOnMerge": false
    },
    "git": {
      "trackDesignDocs": true,
      "requireReviewForChanges": false
    },
    "plans": {
      "enabled": true,
      "bidirectionalLinking": true,
      "validateOnCommit": true
    }
  }
}
```

### architecture-overview.md Frontmatter

```yaml
---
status: draft
module: root
category: architecture
created: 2026-01-21
updated: 2026-01-21
last-synced: 2026-01-21
completeness: 70
related:
  - claude-coordinator-core/domain-schemas.md
  - claude-coordinator-server/trpc-server.md
  - claude-coordinator-mcp/mcp-bridge.md
dependencies: []
---
```

### domain-schemas.md Frontmatter

```yaml
---
status: draft
module: claude-coordinator-core
category: architecture
created: 2026-01-21
updated: 2026-01-21
last-synced: 2026-01-21
completeness: 70
related:
  - ../architecture-overview.md
dependencies: []
---
```

### trpc-server.md Frontmatter

```yaml
---
status: draft
module: claude-coordinator-server
category: architecture
created: 2026-01-21
updated: 2026-01-21
last-synced: 2026-01-21
completeness: 70
related:
  - ../architecture-overview.md
  - ../claude-coordinator-core/domain-schemas.md
dependencies:
  - ../claude-coordinator-core/domain-schemas.md
---
```

### mcp-bridge.md Frontmatter

```yaml
---
status: draft
module: claude-coordinator-mcp
category: architecture
created: 2026-01-21
updated: 2026-01-21
last-synced: 2026-01-21
completeness: 70
related:
  - ../architecture-overview.md
  - ../claude-coordinator-core/domain-schemas.md
  - ../claude-coordinator-server/trpc-server.md
dependencies:
  - ../claude-coordinator-core/domain-schemas.md
  - ../claude-coordinator-server/trpc-server.md
---
```

## Success Criteria

- [ ] All directories created
- [ ] design.config.json validates against schema
- [ ] architecture-overview.md created with complete content
- [ ] domain-schemas.md created with Zod schema documentation
- [ ] trpc-server.md created with server architecture
- [ ] mcp-bridge.md created with MCP tool documentation
- [ ] All documents pass `/design-validate all`

## Next Steps After Completion

1. Create package directories in `pkgs/` for actual implementation
2. Set up initial TypeScript configurations
3. Begin implementing core package schemas
