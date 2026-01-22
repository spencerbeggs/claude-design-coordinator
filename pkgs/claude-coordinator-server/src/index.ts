/**
 * \@spencerbeggs/claude-coordinator-server
 *
 * tRPC WebSocket server for the Claude Coordinator system.
 * Provides real-time communication between Claude Code instances.
 *
 * @packageDocumentation
 */

// Router
export { type AppRouter, type Context, appRouter, createContext } from "./router.js";
// Server
export { type CoordinatorServer, type ServerOptions, createServer } from "./server.js";

// State
export { CoordinatorState, type CoordinatorStateEvents, getOrCreateState, resetState } from "./state.js";
