import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import { appRouter, createContext } from "./router.js";

/**
 * Options for creating the coordinator server
 */
export interface ServerOptions {
	port?: number;
	host?: string;
}

/**
 * Server instance with cleanup method
 */
export interface CoordinatorServer {
	wss: WebSocketServer;
	close: () => void;
}

/**
 * Create and start the coordinator WebSocket server
 */
export function createServer(options: ServerOptions = {}): CoordinatorServer {
	const port = options.port ?? 3030;
	const host = options.host ?? "localhost";

	const wss = new WebSocketServer({
		port,
		host,
	});

	const handler = applyWSSHandler({
		wss,
		router: appRouter,
		createContext,
		// Keep-alive configuration
		keepAlive: {
			enabled: true,
			pingMs: 30000,
			pongWaitMs: 5000,
		},
	});

	// Log to stderr (not stdout) to avoid interfering with JSON-RPC
	console.error(`[coordinator] WebSocket server listening on ws://${host}:${port}`);

	wss.on("connection", (ws) => {
		console.error(`[coordinator] Client connected (${wss.clients.size} total)`);
		ws.on("close", () => {
			console.error(`[coordinator] Client disconnected (${wss.clients.size} total)`);
		});
	});

	const close = (): void => {
		console.error("[coordinator] Shutting down server...");
		handler.broadcastReconnectNotification();
		wss.close();
	};

	return { wss, close };
}
