import type { Agent, ContextEntry, Question } from "@spencerbeggs/claude-coordinator-core";
import {
	AnswerInputSchema,
	AskInputSchema,
	GetContextInputSchema,
	JoinInputSchema,
	ListContextInputSchema,
	LogDecisionInputSchema,
	ShareContextInputSchema,
} from "@spencerbeggs/claude-coordinator-core";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import type { CoordinatorState } from "./state.js";
import { getOrCreateState } from "./state.js";

/**
 * Context passed to each tRPC procedure
 */
export interface Context {
	state: CoordinatorState;
	agentId?: string;
}

// Initialize tRPC with context
const t = initTRPC.context<Context>().create();

const publicProcedure = t.procedure;

// Session management router
const sessionRouter = t.router({
	join: publicProcedure.input(JoinInputSchema).mutation(({ input, ctx }) => {
		const agent: Agent = {
			id: crypto.randomUUID(),
			name: input.name,
			role: input.role,
			repoPath: input.repoPath,
			connectedAt: new Date(),
		};
		ctx.state.addAgent(agent);
		return {
			agent,
			sessionId: ctx.state.getSessionId(),
		};
	}),

	leave: publicProcedure.input(z.object({ agentId: z.string().uuid() })).mutation(({ input, ctx }) => {
		const removed = ctx.state.removeAgent(input.agentId);
		return { success: removed };
	}),

	list: publicProcedure.query(({ ctx }) => {
		return ctx.state.listAgents();
	}),

	onAgentChange: publicProcedure.subscription(({ ctx }) => {
		return observable<Agent[]>((emit) => {
			const handler = (agents: Agent[]): void => {
				emit.next(agents);
			};
			ctx.state.on("agentChange", handler);
			emit.next(ctx.state.listAgents());
			return (): void => {
				ctx.state.off("agentChange", handler);
			};
		});
	}),
});

// Context sharing router
const contextRouter = t.router({
	share: publicProcedure
		.input(ShareContextInputSchema.extend({ agentId: z.string().uuid() }))
		.mutation(({ input, ctx }) => {
			const now = new Date();
			const existing = ctx.state.getContext(input.key);
			const entry: ContextEntry = {
				id: existing?.id ?? crypto.randomUUID(),
				key: input.key,
				value: input.value,
				tags: input.tags ?? [],
				createdBy: existing?.createdBy ?? input.agentId,
				createdAt: existing?.createdAt ?? now,
				updatedAt: now,
			};
			ctx.state.setContext(entry);
			return entry;
		}),

	get: publicProcedure.input(GetContextInputSchema).query(({ input, ctx }) => {
		return ctx.state.getContext(input.key) ?? null;
	}),

	list: publicProcedure.input(ListContextInputSchema.optional()).query(({ input, ctx }) => {
		return ctx.state.listContext(input);
	}),

	onContextChange: publicProcedure.subscription(({ ctx }) => {
		return observable<ContextEntry>((emit) => {
			const handler = (entry: ContextEntry): void => {
				emit.next(entry);
			};
			ctx.state.on("contextChange", handler);
			return (): void => {
				ctx.state.off("contextChange", handler);
			};
		});
	}),
});

// Questions router
const questionsRouter = t.router({
	ask: publicProcedure.input(AskInputSchema.extend({ agentId: z.string().uuid() })).mutation(({ input, ctx }) => {
		const question: Question = {
			id: crypto.randomUUID(),
			question: input.question,
			from: input.agentId,
			to: input.to,
			status: "pending",
			createdAt: new Date(),
		};
		ctx.state.addQuestion(question);
		return question;
	}),

	answer: publicProcedure.input(AnswerInputSchema.extend({ agentId: z.string().uuid() })).mutation(({ input, ctx }) => {
		const answered = ctx.state.answerQuestion(input.questionId, input.answer, input.agentId);
		if (!answered) {
			throw new Error(`Question not found: ${input.questionId}`);
		}
		return answered;
	}),

	listPending: publicProcedure
		.input(z.object({ agentId: z.string().uuid().optional() }).optional())
		.query(({ input, ctx }) => {
			return ctx.state.listPendingQuestions(input?.agentId);
		}),

	onQuestion: publicProcedure.subscription(({ ctx }) => {
		return observable<Question>((emit) => {
			const questionHandler = (question: Question): void => {
				emit.next(question);
			};
			const answerHandler = (question: Question): void => {
				emit.next(question);
			};
			ctx.state.on("question", questionHandler);
			ctx.state.on("answer", answerHandler);
			return (): void => {
				ctx.state.off("question", questionHandler);
				ctx.state.off("answer", answerHandler);
			};
		});
	}),
});

// Decisions router
const decisionsRouter = t.router({
	log: publicProcedure
		.input(LogDecisionInputSchema.extend({ agentId: z.string().uuid() }))
		.mutation(({ input, ctx }) => {
			const decision = {
				id: crypto.randomUUID(),
				decision: input.decision,
				rationale: input.rationale,
				by: input.agentId,
				createdAt: new Date(),
			};
			ctx.state.addDecision(decision);
			return decision;
		}),

	list: publicProcedure.query(({ ctx }) => {
		return ctx.state.listDecisions();
	}),
});

/**
 * Main application router
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const appRouter: typeof t.router extends (...args: any) => infer R ? R : unknown = t.router({
	session: sessionRouter,
	context: contextRouter,
	questions: questionsRouter,
	decisions: decisionsRouter,
});

/**
 * Type exports for clients
 */
export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * Create context for a request
 */
export function createContext(): Context {
	return {
		state: getOrCreateState(),
	};
}
