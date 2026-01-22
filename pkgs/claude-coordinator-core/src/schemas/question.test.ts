import { describe, expect, it } from "vitest";
import { AnswerInputSchema, AskInputSchema, QuestionSchema } from "./question.js";

describe("QuestionSchema", () => {
	it("should validate a pending question", () => {
		const question = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			question: "What is the API endpoint?",
			from: "456e4567-e89b-12d3-a456-426614174000",
			status: "pending" as const,
			createdAt: new Date(),
		};
		const result = QuestionSchema.safeParse(question);
		expect(result.success).toBe(true);
	});

	it("should validate an answered question", () => {
		const question = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			question: "What is the API endpoint?",
			from: "456e4567-e89b-12d3-a456-426614174000",
			to: "789e4567-e89b-12d3-a456-426614174000",
			answer: "The endpoint is /api/v1/users",
			answeredBy: "789e4567-e89b-12d3-a456-426614174000",
			status: "answered" as const,
			createdAt: new Date(),
			answeredAt: new Date(),
		};
		const result = QuestionSchema.safeParse(question);
		expect(result.success).toBe(true);
	});

	it("should reject invalid status", () => {
		const question = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			question: "Test?",
			from: "456e4567-e89b-12d3-a456-426614174000",
			status: "invalid",
			createdAt: new Date(),
		};
		const result = QuestionSchema.safeParse(question);
		expect(result.success).toBe(false);
	});
});

describe("AskInputSchema", () => {
	it("should validate valid ask input", () => {
		const input = {
			question: "How do I configure the database?",
		};
		const result = AskInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("should validate ask input with target", () => {
		const input = {
			question: "How do I configure the database?",
			to: "123e4567-e89b-12d3-a456-426614174000",
		};
		const result = AskInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("should reject empty question", () => {
		const input = {
			question: "",
		};
		const result = AskInputSchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});

describe("AnswerInputSchema", () => {
	it("should validate valid answer input", () => {
		const input = {
			questionId: "123e4567-e89b-12d3-a456-426614174000",
			answer: "You need to set the DATABASE_URL environment variable.",
		};
		const result = AnswerInputSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("should reject invalid question ID", () => {
		const input = {
			questionId: "not-a-uuid",
			answer: "Some answer",
		};
		const result = AnswerInputSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it("should reject empty answer", () => {
		const input = {
			questionId: "123e4567-e89b-12d3-a456-426614174000",
			answer: "",
		};
		const result = AnswerInputSchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});
