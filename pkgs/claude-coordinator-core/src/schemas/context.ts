import { z } from "zod";

/**
 * Schema for a shared context entry
 */
export const ContextEntrySchema = z
	.object({
		id: z.string().uuid().describe("Unique identifier for this context entry"),
		key: z.string().min(1).describe("Key to identify this context entry"),
		value: z.string().describe("The context value/content"),
		tags: z.array(z.string()).describe("Tags for categorizing context"),
		createdBy: z.string().uuid().describe("ID of the agent that created this entry"),
		createdAt: z.coerce.date().describe("Timestamp when the entry was created"),
		updatedAt: z.coerce.date().describe("Timestamp when the entry was last updated"),
	})
	.describe("A shared context entry");

export type ContextEntry = z.infer<typeof ContextEntrySchema>;

/**
 * Input schema for sharing a context entry
 */
export const ShareContextInputSchema = z
	.object({
		key: z.string().min(1).describe("Key to identify this context entry"),
		value: z.string().describe("The context value/content to share"),
		tags: z.array(z.string()).optional().describe("Optional tags for categorizing context"),
	})
	.describe("Input for sharing a context entry");

export type ShareContextInput = z.infer<typeof ShareContextInputSchema>;

/**
 * Input schema for retrieving a context entry by key
 */
export const GetContextInputSchema = z
	.object({
		key: z.string().min(1).describe("Key of the context entry to retrieve"),
	})
	.describe("Input for retrieving a context entry by key");

export type GetContextInput = z.infer<typeof GetContextInputSchema>;

/**
 * Input schema for listing context entries with optional filters
 */
export const ListContextInputSchema = z
	.object({
		tags: z.array(z.string()).optional().describe("Filter by tags (entries must have all specified tags)"),
		createdBy: z.string().uuid().optional().describe("Filter by creator agent ID"),
	})
	.describe("Input for listing context entries with optional filters");

export type ListContextInput = z.infer<typeof ListContextInputSchema>;
