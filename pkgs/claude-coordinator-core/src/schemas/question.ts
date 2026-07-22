import { z } from "zod";

/**
 * Status of a question
 *
 * @public
 */
export const QuestionStatusSchema = z.enum(["pending", "answered"]).describe("Status of the question");

/**
 * Status of a question
 *
 * @public
 */
export type QuestionStatus = z.infer<typeof QuestionStatusSchema>;

/**
 * Schema for a question between agents
 *
 * @public
 */
export const QuestionSchema = z
	.object({
		id: z.string().uuid().describe("Unique identifier for this question"),
		question: z.string().min(1).describe("The question being asked"),
		from: z.string().uuid().describe("ID of the agent asking the question"),
		to: z.string().uuid().optional().describe("ID of a specific agent to answer (optional)"),
		answer: z.string().optional().describe("The answer to the question"),
		answeredBy: z.string().uuid().optional().describe("ID of the agent that answered"),
		status: QuestionStatusSchema,
		createdAt: z.coerce.date().describe("Timestamp when the question was asked"),
		answeredAt: z.coerce.date().optional().describe("Timestamp when the question was answered"),
	})
	.describe("A question between agents");

/**
 * A question between agents
 *
 * @public
 */
export type Question = z.infer<typeof QuestionSchema>;

/**
 * Input schema for asking a question
 *
 * @public
 */
export const AskInputSchema = z
	.object({
		question: z.string().min(1).describe("The question to ask"),
		to: z.string().uuid().optional().describe("ID of a specific agent to answer (optional)"),
	})
	.describe("Input for asking a question");

/**
 * Input for asking a question
 *
 * @public
 */
export type AskInput = z.infer<typeof AskInputSchema>;

/**
 * Input schema for answering a question
 *
 * @public
 */
export const AnswerInputSchema = z
	.object({
		questionId: z.string().uuid().describe("ID of the question to answer"),
		answer: z.string().min(1).describe("The answer to the question"),
	})
	.describe("Input for answering a question");

/**
 * Input for answering a question
 *
 * @public
 */
export type AnswerInput = z.infer<typeof AnswerInputSchema>;

/**
 * Event emitted when a question is asked
 *
 * @public
 */
export const QuestionEventSchema = z
	.object({
		type: z.literal("question"),
		question: QuestionSchema,
	})
	.describe("Event emitted when a question is asked");

/**
 * Event emitted when a question is asked
 *
 * @public
 */
export type QuestionEvent = z.infer<typeof QuestionEventSchema>;

/**
 * Event emitted when a question is answered
 *
 * @public
 */
export const AnswerEventSchema = z
	.object({
		type: z.literal("answer"),
		question: QuestionSchema,
	})
	.describe("Event emitted when a question is answered");

/**
 * Event emitted when a question is answered
 *
 * @public
 */
export type AnswerEvent = z.infer<typeof AnswerEventSchema>;
