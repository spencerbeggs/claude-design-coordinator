import { z } from "zod";

/**
 * Schema for a logged decision
 *
 * @public
 */
export const DecisionSchema = z
	.object({
		id: z.string().uuid().describe("Unique identifier for this decision"),
		decision: z.string().min(1).describe("The decision that was made"),
		rationale: z.string().optional().describe("Explanation for why this decision was made"),
		by: z.string().uuid().describe("ID of the agent that made this decision"),
		createdAt: z.coerce.date().describe("Timestamp when the decision was logged"),
	})
	.describe("A logged decision");

/**
 * A logged decision
 *
 * @public
 */
export type Decision = z.infer<typeof DecisionSchema>;

/**
 * Input schema for logging a decision
 *
 * @public
 */
export const LogDecisionInputSchema = z
	.object({
		decision: z.string().min(1).describe("The decision that was made"),
		rationale: z.string().optional().describe("Explanation for why this decision was made"),
	})
	.describe("Input for logging a decision");

/**
 * Input for logging a decision
 *
 * @public
 */
export type LogDecisionInput = z.infer<typeof LogDecisionInputSchema>;
