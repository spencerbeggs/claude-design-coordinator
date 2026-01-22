#!/usr/bin/env node
import { DEFAULT_HOST, DEFAULT_PORT } from "@spencerbeggs/claude-coordinator-core";
import type { CoordinatorServer } from "../server.js";
import { createServer } from "../server.js";

// Read configuration from environment
const port: number = Number(process.env.PORT) || DEFAULT_PORT;
const host: string = process.env.HOST ?? DEFAULT_HOST;

// Create and start the server
const server: CoordinatorServer = createServer({ port, host });

// Handle graceful shutdown
const shutdown = (): void => {
	server.close();
	process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Keep the process running
console.error(`[coordinator] Server started. Press Ctrl+C to stop.`);
