/**
 * \@spencerbeggs/claude-coordinator-mcp
 *
 * MCP stdio bridge for the Claude Coordinator system.
 * Provides MCP tools that Claude Code can use to communicate
 * with other Claude Code instances through the coordinator server.
 *
 * @packageDocumentation
 */

// Client
export { type ClientOptions, type CoordinatorClient, createCoordinatorClient } from "./client.js";

// MCP Server
export { type McpServerOptions, createMcpServer } from "./mcp-server.js";
