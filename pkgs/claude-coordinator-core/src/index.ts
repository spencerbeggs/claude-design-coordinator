/**
 * \@spencerbeggs/claude-coordinator-core
 *
 * Core schemas and types for the Claude Coordinator system.
 * Provides Zod schemas for validation and TypeScript types for
 * communication between Claude Code instances.
 *
 * @packageDocumentation
 */

// Agent schemas and types
export {
	type Agent,
	type AgentRole,
	AgentRoleSchema,
	AgentSchema,
	type JoinInput,
	JoinInputSchema,
	type JoinResult,
	JoinResultSchema,
} from "./schemas/agent.js";

// Context schemas and types
export {
	type ContextEntry,
	ContextEntrySchema,
	type GetContextInput,
	GetContextInputSchema,
	type ListContextInput,
	ListContextInputSchema,
	type ShareContextInput,
	ShareContextInputSchema,
} from "./schemas/context.js";
// Decision schemas and types
export { type Decision, DecisionSchema, type LogDecisionInput, LogDecisionInputSchema } from "./schemas/decision.js";
// Question schemas and types
export {
	type AnswerEvent,
	AnswerEventSchema,
	type AnswerInput,
	AnswerInputSchema,
	type AskInput,
	AskInputSchema,
	type Question,
	type QuestionEvent,
	QuestionEventSchema,
	QuestionSchema,
	type QuestionStatus,
	QuestionStatusSchema,
} from "./schemas/question.js";

// Constants
export const DEFAULT_PORT: number = 3030;
export const DEFAULT_HOST: string = "localhost";
export const DEFAULT_URL: string = `ws://${DEFAULT_HOST}:${DEFAULT_PORT}`;
