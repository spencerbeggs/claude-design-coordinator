import { describe, expect, it } from "vitest";
import { DecisionSchema, LogDecisionInputSchema } from "./decision.js";

describe("DecisionSchema", () => {
	it("should validate a valid decision", () => {
		const decision = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			decision: "Use PostgreSQL for the database",
			rationale: "It provides better support for complex queries and JSON data types",
			by: "456e4567-e89b-12d3-a456-426614174000",
			createdAt: new Date(),
		};
		const result = DecisionSchema.safeParse(decision);
		expect(result.success).toBe(true);
	});

	it("should reject invalid UUID for id", () => {
		const decision = {
			id: "invalid",
			decision: "Use PostgreSQL",
			rationale: "Good choice",
			by: "456e4567-e89b-12d3-a456-426614174000",
			createdAt: new Date(),
		};
		const result = DecisionSchema.safeParse(decision);
		expect(result.success).toBe(false);
	});

	it("should reject empty decision text", () => {
		const decision = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			decision: "",
			rationale: "Good choice",
			by: "456e4567-e89b-12d3-a456-426614174000",
			createdAt: new Date(),
		};
		const result = DecisionSchema.safeParse(decision);
		expect(result.success).toBe(false);
	});
});

describe("LogDecisionInputSchema", () => {
	it("should validate valid log decision input", () => {
		const input = {
			decision: "Implement caching with Redis",
			rationale: "Redis provides fast in-memory caching with persistence options",
		};
		const result = LogDecisionInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("should reject empty decision", () => {
		const input = {
			decision: "",
			rationale: "Some rationale",
		};
		const result = LogDecisionInputSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it("should allow empty rationale since it is optional", () => {
		const input = {
			decision: "Some decision",
			rationale: "",
		};
		const result = LogDecisionInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("should allow missing rationale", () => {
		const input = {
			decision: "Some decision",
		};
		const result = LogDecisionInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});
});
