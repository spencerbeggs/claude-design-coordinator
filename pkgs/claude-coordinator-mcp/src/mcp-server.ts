import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	AnswerInputSchema,
	AskInputSchema,
	DEFAULT_URL,
	GetContextInputSchema,
	JoinInputSchema,
	ListContextInputSchema,
	LogDecisionInputSchema,
	ShareContextInputSchema,
} from "@spencerbeggs/claude-coordinator-core";
import { z } from "zod";
import type { CoordinatorClient } from "./client.js";
import { createCoordinatorClient } from "./client.js";

/**
 * Format connection errors with helpful guidance
 */
function formatConnectionError(error: unknown, url: string): string {
	const errorStr = String(error);
	if (
		errorStr.includes("ECONNREFUSED") ||
		errorStr.includes("ENOTFOUND") ||
		errorStr.includes("WebSocket") ||
		errorStr.includes("connect")
	) {
		return `Could not connect to coordinator server at ${url}. Please start the server with: npx @spencerbeggs/claude-coordinator-server`;
	}
	return errorStr;
}

/**
 * MCP server options
 */
export interface McpServerOptions {
	url?: string;
}

/**
 * Create and run the MCP server
 */
export async function createMcpServer(options: McpServerOptions = {}): Promise<void> {
	const serverUrl = options.url ?? DEFAULT_URL;
	let client: CoordinatorClient | null = null;
	let agentId: string | null = null;

	const server = new McpServer({
		name: "claude-coordinator",
		version: "0.1.0",
	});

	// Helper to ensure client is connected
	const getClient = (): CoordinatorClient => {
		if (!client) {
			client = createCoordinatorClient({ url: serverUrl });
		}
		return client;
	};

	// Helper to format errors with connection guidance
	const formatError = (error: unknown): string => formatConnectionError(error, serverUrl);

	// Helper to ensure agent is joined
	const requireAgentId = (): string => {
		if (!agentId) {
			throw new Error("Not joined to session. Call coordinator_join first.");
		}
		return agentId;
	};

	// Tool: Join session
	server.tool(
		"coordinator_join",
		"Join the coordination session as an agent",
		JoinInputSchema.shape,
		async (params) => {
			try {
				const result = await getClient().trpc.session.join.mutate(params);
				agentId = result.agent.id;
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify({ success: true, agent: result.agent, sessionId: result.sessionId }),
						},
					],
				};
			} catch (error) {
				return {
					content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
					isError: true,
				};
			}
		},
	);

	// Tool: Leave session
	server.tool("coordinator_leave", "Leave the coordination session", {}, async () => {
		try {
			const id = requireAgentId();
			const result = await getClient().trpc.session.leave.mutate({ agentId: id });
			if (result.success) {
				agentId = null;
			}
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: result.success }) }],
			};
		} catch (error) {
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
				isError: true,
			};
		}
	});

	// Tool: List agents
	server.tool("coordinator_list_agents", "List all connected agents in the session", {}, async () => {
		try {
			const agents = await getClient().trpc.session.list.query();
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: true, agents }) }],
			};
		} catch (error) {
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
				isError: true,
			};
		}
	});

	// Tool: Share context
	server.tool(
		"coordinator_share_context",
		"Share a context entry with other agents",
		ShareContextInputSchema.shape,
		async (params) => {
			try {
				const id = requireAgentId();
				const entry = await getClient().trpc.context.share.mutate({ ...params, agentId: id });
				return {
					content: [{ type: "text" as const, text: JSON.stringify({ success: true, entry }) }],
				};
			} catch (error) {
				return {
					content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
					isError: true,
				};
			}
		},
	);

	// Tool: Get context
	server.tool("coordinator_get_context", "Get a context entry by key", GetContextInputSchema.shape, async (params) => {
		try {
			const entry = await getClient().trpc.context.get.query(params);
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: true, entry }) }],
			};
		} catch (error) {
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
				isError: true,
			};
		}
	});

	// Tool: List context
	server.tool(
		"coordinator_list_context",
		"List context entries with optional filters",
		{
			...ListContextInputSchema.shape,
		},
		async (params) => {
			try {
				const entries = await getClient().trpc.context.list.query(params);
				return {
					content: [{ type: "text" as const, text: JSON.stringify({ success: true, entries }) }],
				};
			} catch (error) {
				return {
					content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
					isError: true,
				};
			}
		},
	);

	// Tool: Ask question
	server.tool("coordinator_ask", "Ask a question to other agents", AskInputSchema.shape, async (params) => {
		try {
			const id = requireAgentId();
			const question = await getClient().trpc.questions.ask.mutate({ ...params, agentId: id });
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: true, question }) }],
			};
		} catch (error) {
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
				isError: true,
			};
		}
	});

	// Tool: Answer question
	server.tool("coordinator_answer", "Answer a pending question", AnswerInputSchema.shape, async (params) => {
		try {
			const id = requireAgentId();
			const question = await getClient().trpc.questions.answer.mutate({ ...params, agentId: id });
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: true, question }) }],
			};
		} catch (error) {
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
				isError: true,
			};
		}
	});

	// Tool: List pending questions
	server.tool(
		"coordinator_pending_questions",
		"List pending questions (optionally for a specific agent)",
		{
			agentId: z.string().uuid().optional().describe("Filter questions directed to this agent"),
		},
		async (params) => {
			try {
				const questions = await getClient().trpc.questions.listPending.query(params);
				return {
					content: [{ type: "text" as const, text: JSON.stringify({ success: true, questions }) }],
				};
			} catch (error) {
				return {
					content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
					isError: true,
				};
			}
		},
	);

	// Tool: Log decision
	server.tool(
		"coordinator_log_decision",
		"Log a decision made during the session",
		LogDecisionInputSchema.shape,
		async (params) => {
			try {
				const id = requireAgentId();
				const decision = await getClient().trpc.decisions.log.mutate({ ...params, agentId: id });
				return {
					content: [{ type: "text" as const, text: JSON.stringify({ success: true, decision }) }],
				};
			} catch (error) {
				return {
					content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
					isError: true,
				};
			}
		},
	);

	// Tool: List decisions
	server.tool("coordinator_list_decisions", "List all decisions made during the session", {}, async () => {
		try {
			const decisions = await getClient().trpc.decisions.list.query();
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: true, decisions }) }],
			};
		} catch (error) {
			return {
				content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: formatError(error) }) }],
				isError: true,
			};
		}
	});

	// Start the server with stdio transport
	const transport = new StdioServerTransport();
	await server.connect(transport);

	// Log to stderr (CRITICAL: stdout is for JSON-RPC only)
	console.error("[coordinator-mcp] MCP server started");

	// Cleanup on exit
	process.on("exit", () => {
		if (client) {
			client.close();
		}
	});
}
