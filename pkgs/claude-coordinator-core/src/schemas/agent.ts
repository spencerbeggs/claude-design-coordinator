import { z } from "zod";

/**
 * Role of an agent in the coordination session
 */
export const AgentRoleSchema = z
	.enum(["source", "target"])
	.describe("The role of the agent: 'source' provides knowledge, 'target' receives knowledge");

export type AgentRole = z.infer<typeof AgentRoleSchema>;

/**
 * Schema for a connected agent in the coordination session
 */
export const AgentSchema = z
	.object({
		id: z.string().uuid().describe("Unique identifier for the agent"),
		role: AgentRoleSchema,
		name: z.string().min(1).describe("Human-readable name for the agent"),
		repoPath: z.string().min(1).describe("Path to the repository this agent is working in"),
		connectedAt: z.coerce.date().describe("Timestamp when the agent connected"),
	})
	.describe("A connected agent in the coordination session");

export type Agent = z.infer<typeof AgentSchema>;

/**
 * Input schema for joining a coordination session
 */
export const JoinInputSchema = z
	.object({
		name: z.string().min(1).describe("Human-readable name for the agent"),
		role: AgentRoleSchema,
		repoPath: z.string().min(1).describe("Path to the repository this agent is working in"),
	})
	.describe("Input for joining a coordination session");

export type JoinInput = z.infer<typeof JoinInputSchema>;

/**
 * Result of joining a coordination session
 */
export const JoinResultSchema = z
	.object({
		agent: AgentSchema,
		sessionId: z.string().uuid().describe("Unique identifier for the session"),
	})
	.describe("Result of joining a coordination session");

export type JoinResult = z.infer<typeof JoinResultSchema>;
