import { EventEmitter } from "node:events";
import type { Agent, ContextEntry, Decision, Question } from "@spencerbeggs/claude-coordinator-core";

/**
 * Events emitted by the coordinator state
 */
export interface CoordinatorStateEvents {
	agentChange: [agents: Agent[]];
	contextChange: [entry: ContextEntry];
	question: [question: Question];
	answer: [question: Question];
}

/**
 * EventEmitter-based state manager for the coordinator
 */
export class CoordinatorState extends EventEmitter<CoordinatorStateEvents> {
	private sessionId: string;
	private agents: Map<string, Agent> = new Map();
	private context: Map<string, ContextEntry> = new Map();
	private questions: Map<string, Question> = new Map();
	private decisions: Decision[] = [];

	constructor(sessionId: string) {
		super();
		this.sessionId = sessionId;
	}

	getSessionId(): string {
		return this.sessionId;
	}

	// Agent management
	addAgent(agent: Agent): void {
		this.agents.set(agent.id, agent);
		this.emit("agentChange", this.listAgents());
	}

	removeAgent(agentId: string): boolean {
		const removed = this.agents.delete(agentId);
		if (removed) {
			this.emit("agentChange", this.listAgents());
		}
		return removed;
	}

	getAgent(agentId: string): Agent | undefined {
		return this.agents.get(agentId);
	}

	listAgents(): Agent[] {
		return Array.from(this.agents.values());
	}

	// Context management
	setContext(entry: ContextEntry): void {
		this.context.set(entry.key, entry);
		this.emit("contextChange", entry);
	}

	getContext(key: string): ContextEntry | undefined {
		return this.context.get(key);
	}

	listContext(filters?: { tags?: string[]; createdBy?: string }): ContextEntry[] {
		let entries = Array.from(this.context.values());

		const filterTags = filters?.tags;
		if (filterTags && filterTags.length > 0) {
			entries = entries.filter((entry) => filterTags.every((tag) => entry.tags.includes(tag)));
		}

		if (filters?.createdBy) {
			entries = entries.filter((entry) => entry.createdBy === filters.createdBy);
		}

		return entries;
	}

	// Question management
	addQuestion(question: Question): void {
		this.questions.set(question.id, question);
		this.emit("question", question);
	}

	answerQuestion(questionId: string, answer: string, answeredBy: string): Question | undefined {
		const question = this.questions.get(questionId);
		if (!question) {
			return undefined;
		}

		const answered: Question = {
			...question,
			answer,
			answeredBy,
			status: "answered",
			answeredAt: new Date(),
		};

		this.questions.set(questionId, answered);
		this.emit("answer", answered);
		return answered;
	}

	getQuestion(questionId: string): Question | undefined {
		return this.questions.get(questionId);
	}

	listPendingQuestions(forAgentId?: string): Question[] {
		return Array.from(this.questions.values()).filter((q) => {
			if (q.status !== "pending") return false;
			if (forAgentId && q.to && q.to !== forAgentId) return false;
			return true;
		});
	}

	// Decision management
	addDecision(decision: Decision): void {
		this.decisions.push(decision);
	}

	listDecisions(): Decision[] {
		return [...this.decisions];
	}
}

/**
 * Global state instance (singleton per server)
 */
let globalState: CoordinatorState | null = null;

export function getOrCreateState(sessionId?: string): CoordinatorState {
	if (!globalState) {
		globalState = new CoordinatorState(sessionId ?? crypto.randomUUID());
	}
	return globalState;
}

export function resetState(): void {
	globalState = null;
}
