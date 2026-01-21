import { describe, expect, it } from "vitest";
import { AgentSchema, JoinInputSchema, JoinResultSchema } from "./agent.js";

describe("AgentSchema", () => {
	it("should validate a valid agent", () => {
		const agent = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			name: "test-agent",
			role: "source" as const,
			repoPath: "/path/to/repo",
			connectedAt: new Date(),
		};
		const result = AgentSchema.safeParse(agent);
		expect(result.success).toBe(true);
	});

	it("should reject invalid role", () => {
		const agent = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			name: "test-agent",
			role: "invalid",
			repoPath: "/path/to/repo",
			connectedAt: new Date(),
		};
		const result = AgentSchema.safeParse(agent);
		expect(result.success).toBe(false);
	});

	it("should reject invalid UUID", () => {
		const agent = {
			id: "not-a-uuid",
			name: "test-agent",
			role: "target" as const,
			repoPath: "/path/to/repo",
			connectedAt: new Date(),
		};
		const result = AgentSchema.safeParse(agent);
		expect(result.success).toBe(false);
	});
});

describe("JoinInputSchema", () => {
	it("should validate valid join input", () => {
		const input = {
			name: "my-agent",
			role: "source" as const,
			repoPath: "/workspace/project",
		};
		const result = JoinInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("should reject missing required fields", () => {
		const input = {
			name: "my-agent",
		};
		const result = JoinInputSchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});

describe("JoinResultSchema", () => {
	it("should validate valid join result", () => {
		const result = {
			agent: {
				id: "123e4567-e89b-12d3-a456-426614174000",
				name: "test-agent",
				role: "target" as const,
				repoPath: "/path/to/repo",
				connectedAt: new Date(),
			},
			sessionId: "789e4567-e89b-12d3-a456-426614174000",
		};
		const parsed = JoinResultSchema.safeParse(result);
		expect(parsed.success).toBe(true);
	});
});
