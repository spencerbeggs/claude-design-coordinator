#!/usr/bin/env node
import { DEFAULT_URL } from "@spencerbeggs/claude-coordinator-core";
import { createMcpServer } from "../mcp-server.js";

// Parse command line arguments
const args: string[] = process.argv.slice(2);
let url: string = DEFAULT_URL;

for (let i = 0; i < args.length; i++) {
	const arg = args[i];
	if (arg === "--url" && args[i + 1]) {
		url = args[i + 1];
		i++;
	} else if (arg?.startsWith("--url=")) {
		url = arg.slice(6);
	}
}

// Start the MCP server
console.error(`[coordinator-mcp] Connecting to coordinator at ${url}`);
createMcpServer({ url }).catch((error: unknown) => {
	console.error("[coordinator-mcp] Failed to start:", error);
	process.exit(1);
});
