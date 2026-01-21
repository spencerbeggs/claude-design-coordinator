import { describe, expect, it } from "vitest";
import {
	ContextEntrySchema,
	GetContextInputSchema,
	ListContextInputSchema,
	ShareContextInputSchema,
} from "./context.js";

describe("ContextEntrySchema", () => {
	it("should validate a valid context entry", () => {
		const entry = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			key: "test-key",
			value: "test-value",
			tags: ["tag1", "tag2"],
			createdBy: "456e4567-e89b-12d3-a456-426614174000",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const result = ContextEntrySchema.safeParse(entry);
		expect(result.success).toBe(true);
	});

	it("should reject empty key", () => {
		const entry = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			key: "",
			value: "test-value",
			tags: [],
			createdBy: "456e4567-e89b-12d3-a456-426614174000",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const result = ContextEntrySchema.safeParse(entry);
		expect(result.success).toBe(false);
	});
});

describe("ShareContextInputSchema", () => {
	it("should validate valid share context input", () => {
		const input = {
			key: "config.setting",
			value: JSON.stringify({ enabled: true }),
			tags: ["config"],
		};
		const result = ShareContextInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("should allow missing optional tags", () => {
		const input = {
			key: "simple-key",
			value: "simple-value",
		};
		const result = ShareContextInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});
});

describe("GetContextInputSchema", () => {
	it("should validate valid get context input", () => {
		const input = { key: "my-key" };
		const result = GetContextInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("should reject empty key", () => {
		const input = { key: "" };
		const result = GetContextInputSchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});

describe("ListContextInputSchema", () => {
	it("should validate valid list context input", () => {
		const input = {
			prefix: "config.",
			tags: ["important"],
		};
		const result = ListContextInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("should allow empty input", () => {
		const input = {};
		const result = ListContextInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});
});
