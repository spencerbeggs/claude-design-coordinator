# Design Documentation Implementation Plan

## Overview

Create comprehensive design documentation for the Claude Coordinator project - a
tRPC-based system enabling multiple Claude Code instances to communicate and
collaborate in real-time for knowledge transfer between repositories.

## Scope

This plan covers:

1. Initialize the design documentation system (design.config.json)
2. Create design docs for each package (core, server, mcp)
3. Create an architecture overview design doc
4. Ensure all docs follow project conventions and pass validation

## Files to Create

### 1. Configuration File

**File:** `.claude/design/design.config.json`

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
      "maintainer": "C. Spencer Beggs",
      "userDocs": {
        "readme": "pkgs/claude-coordinator-core/README.md",
        "repoDocs": null,
        "siteDocs": null
      }
    },
    "claude-coordinator-server": {
      "path": "pkgs/claude-coordinator-server",
      "designDocsPath": ".claude/design/claude-coordinator-server",
      "categories": ["architecture", "integration", "performance"],
      "maintainer": "C. Spencer Beggs",
      "userDocs": {
        "readme": "pkgs/claude-coordinator-server/README.md",
        "repoDocs": null,
        "siteDocs": null
      }
    },
    "claude-coordinator-mcp": {
      "path": "pkgs/claude-coordinator-mcp",
      "designDocsPath": ".claude/design/claude-coordinator-mcp",
      "categories": ["architecture", "integration"],
      "maintainer": "C. Spencer Beggs",
      "userDocs": {
        "readme": "pkgs/claude-coordinator-mcp/README.md",
        "repoDocs": null,
        "siteDocs": null
      }
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
      "stalenessThresholdDays": 30,
      "archiveAfterDays": 30
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
      "autoSyncProgress": false,
      "validateOnCommit": true,
      "cacheMetadata": true,
      "cacheTTL": 300
    }
  }
}
```

### 2. Architecture Overview Document

**File:** `.claude/design/architecture-overview.md`

This will be the master architecture document covering:

- System-wide architecture (tRPC + WebSocket + MCP bridge)
- Data flow between Claude Code instances
- Domain objects (Agent, ContextEntry, Question, Decision)
- Package relationships and build order
- Communication protocols
- Security considerations

### 3. Core Package Design Doc

**File:** `.claude/design/claude-coordinator-core/domain-schemas.md`

This document will cover:

- Zod schema definitions for all domain objects
- Type exports and inference patterns
- Constants (DEFAULT_PORT, DEFAULT_HOST)
- Validation rules and error messages
- Schema composition patterns

### 4. Server Package Design Doc

**File:** `.claude/design/claude-coordinator-server/trpc-server.md`

This document will cover:

- tRPC router architecture (session, context, questions, decisions)
- EventEmitter-based state management
- WebSocket subscription patterns
- Session lifecycle management
- Error handling strategy
- CLI entry point design

### 5. MCP Package Design Doc

**File:** `.claude/design/claude-coordinator-mcp/mcp-bridge.md`

This document will cover:

- MCP stdio server integration
- tRPC client wrapper
- Tool definitions (10 tools) with Zod schemas
- Error handling within MCP constraints
- Session state management
- CLI entry point design

## Directory Structure to Create

```text
.claude/
  design/
    design.config.json              # NEW: System configuration
    architecture-overview.md        # NEW: System architecture
    claude-coordinator-core/
      domain-schemas.md             # NEW: Core schemas design
    claude-coordinator-server/
      trpc-server.md                # NEW: Server architecture
    claude-coordinator-mcp/
      mcp-bridge.md                 # NEW: MCP bridge design
```

## Implementation Steps

### Step 1: Create Configuration

1. Create `.claude/design/design.config.json` with module definitions
2. Validate against the JSON schema

### Step 2: Create Directories

1. Create `.claude/design/claude-coordinator-core/`
2. Create `.claude/design/claude-coordinator-server/`
3. Create `.claude/design/claude-coordinator-mcp/`

### Step 3: Create Architecture Overview

1. Create `.claude/design/architecture-overview.md` using architecture template
2. Fill in system-wide design details from the existing plan
3. Document data flow, domain objects, and integration patterns

### Step 4: Create Core Package Design Doc

1. Create `.claude/design/claude-coordinator-core/domain-schemas.md`
2. Document all Zod schemas with their purposes
3. Include type inference patterns and constants

### Step 5: Create Server Package Design Doc

1. Create `.claude/design/claude-coordinator-server/trpc-server.md`
2. Document router structure and state management
3. Include WebSocket subscription patterns

### Step 6: Create MCP Package Design Doc

1. Create `.claude/design/claude-coordinator-mcp/mcp-bridge.md`
2. Document all 10 MCP tools
3. Include error handling and session management

### Step 7: Validate All Documents

1. Run `/design-validate all` to check structure
2. Fix any validation errors
3. Update completeness scores

## Document Content Details

### Architecture Overview Content

```markdown
# Claude Coordinator - System Architecture

System enabling multiple Claude Code instances to communicate in real-time.

## Overview
- Purpose: Knowledge transfer between repositories
- Use case: Source agent shares context, target agent receives
- Technology: tRPC + WebSocket + MCP

## System Architecture
- Data flow diagram
- Package relationships
- Communication protocols

## Domain Objects
- Agent: { id, role, name, repoPath, connectedAt }
- ContextEntry: { id, key, value, tags[], createdBy, timestamps }
- Question: { id, question, from, to?, answer?, status, timestamps }
- Decision: { id, decision, rationale, by, createdAt }

## Integration Points
- Claude Code <-> MCP (stdio)
- MCP <-> tRPC (WebSocket)
- Server state management (EventEmitter)
```

### Core Package Content

```markdown
# Domain Schemas - Design

Zod schemas providing type safety across the system.

## Schemas
- AgentSchema: Agent identity and role
- ContextEntrySchema: Shared knowledge entries
- QuestionSchema: Inter-agent questions
- DecisionSchema: Logged decisions

## Type Exports
- All schemas export inferred types
- Input schemas for mutations
- Constants for defaults

## Validation Rules
- UUID format validation
- Role enum validation
- Status enum validation
```

### Server Package Content

```markdown
# tRPC WebSocket Server - Design

Real-time coordination server with subscription support.

## Router Architecture
- session: join, leave, list, onAgentChange
- context: share, get, list, onContextChange
- questions: ask, answer, listPending, onQuestion
- decisions: log, list

## State Management
- CoordinatorState class (EventEmitter)
- In-memory Maps for agents, context, questions
- Event-driven updates

## WebSocket Configuration
- 30-second keep-alive
- applyWSSHandler integration
- Error propagation
```

### MCP Package Content

```markdown
# MCP Bridge - Design

Bridges Claude Code to tRPC server via MCP protocol.

## Tool Definitions
1. coordinator_join - Join as agent
2. coordinator_leave - Leave session
3. coordinator_list_agents - List agents
4. coordinator_share_context - Share context
5. coordinator_get_context - Get context
6. coordinator_ask - Ask question
7. coordinator_answer - Answer question
8. coordinator_pending_questions - List pending
9. coordinator_log_decision - Log decision
10. coordinator_list_decisions - List decisions

## MCP Integration
- StdioServerTransport
- All logging to stderr
- JSON-RPC error handling

## Session Management
- Must join before mutations
- Session state in closure
- Graceful disconnect handling
```

## Success Criteria

- [ ] design.config.json validates against schema
- [ ] All 4 design docs created with valid frontmatter
- [ ] All docs pass `/design-validate all`
- [ ] Architecture overview covers system-wide design
- [ ] Each package has documented:
  - Key components
  - APIs and interfaces
  - Integration points
  - Error handling strategy
- [ ] Related docs are cross-referenced

## Estimated Effort

- Configuration setup: 5 minutes
- Architecture overview: 15 minutes
- Core package doc: 10 minutes
- Server package doc: 15 minutes
- MCP package doc: 15 minutes
- Validation and fixes: 10 minutes
- Total: ~70 minutes

## Notes

- The existing plan in `luminous-jumping-willow.md` provides excellent detail
  for the implementation phase - design docs should complement, not duplicate
- Design docs focus on "why" and "how" decisions were made
- Implementation plans focus on "what" to build and "when"
- Cross-reference between plans and design docs as needed
