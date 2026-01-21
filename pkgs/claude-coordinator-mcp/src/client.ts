import type {
	Agent,
	ContextEntry,
	Decision,
	JoinInput,
	JoinResult,
	Question,
} from "@spencerbeggs/claude-coordinator-core";
import { DEFAULT_URL } from "@spencerbeggs/claude-coordinator-core";
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";
import WebSocket from "ws";

/**
 * Options for creating the coordinator client
 */
export interface ClientOptions {
	url?: string;
}

/**
 * Typed tRPC client interface matching the coordinator server's router
 * This provides type safety without requiring cross-package type inference
 */
export interface TypedTRPCClient {
	session: {
		join: {
			mutate: (input: JoinInput) => Promise<JoinResult>;
		};
		leave: {
			mutate: (input: { agentId: string }) => Promise<{ success: boolean }>;
		};
		list: {
			query: () => Promise<Agent[]>;
		};
	};
	context: {
		share: {
			mutate: (input: { key: string; value: string; tags?: string[]; agentId: string }) => Promise<ContextEntry>;
		};
		get: {
			query: (input: { key: string }) => Promise<ContextEntry | null>;
		};
		list: {
			query: (input?: { prefix?: string; tags?: string[] }) => Promise<ContextEntry[]>;
		};
	};
	questions: {
		ask: {
			mutate: (input: { question: string; to?: string; agentId: string }) => Promise<Question>;
		};
		answer: {
			mutate: (input: { questionId: string; answer: string; agentId: string }) => Promise<Question>;
		};
		listPending: {
			query: (input?: { agentId?: string }) => Promise<Question[]>;
		};
	};
	decisions: {
		log: {
			mutate: (input: { decision: string; rationale?: string; agentId: string }) => Promise<Decision>;
		};
		list: {
			query: () => Promise<Decision[]>;
		};
	};
}

/**
 * Coordinator client instance
 */
export interface CoordinatorClient {
	trpc: TypedTRPCClient;
	close: () => void;
}

/**
 * Create a tRPC client that connects to the coordinator server
 */
export function createCoordinatorClient(options: ClientOptions = {}): CoordinatorClient {
	const url = options.url ?? DEFAULT_URL;

	const wsClient = createWSClient({
		url,
		WebSocket: WebSocket as unknown as typeof globalThis.WebSocket,
	});

	// Create an untyped client and cast to our typed interface
	// Runtime validation is handled by Zod schemas on the server
	const trpc = createTRPCClient({
		links: [wsLink({ client: wsClient })],
	}) as unknown as TypedTRPCClient;

	const close = (): void => {
		wsClient.close();
	};

	return { trpc, close };
}
