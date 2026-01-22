import type { Agent, ContextEntry, Decision, Question } from "@spencerbeggs/claude-coordinator-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoordinatorState } from "./state.js";

describe("CoordinatorState", () => {
	let state: CoordinatorState;

	beforeEach(() => {
		state = new CoordinatorState("test-session-id");
	});

	describe("session management", () => {
		it("should have a session ID", () => {
			expect(state.getSessionId()).toBe("test-session-id");
		});

		it("should add and list agents", () => {
			const agent: Agent = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				name: "test-agent",
				role: "source",
				repoPath: "/path/to/repo",
				connectedAt: new Date(),
			};

			state.addAgent(agent);
			const agents = state.listAgents();

			expect(agents).toHaveLength(1);
			expect(agents[0]).toEqual(agent);
		});

		it("should emit agentChange event when agent is added", () => {
			const handler = vi.fn();
			state.on("agentChange", handler);

			const agent: Agent = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				name: "test-agent",
				role: "source",
				repoPath: "/path/to/repo",
				connectedAt: new Date(),
			};

			state.addAgent(agent);

			expect(handler).toHaveBeenCalledWith([agent]);
		});

		it("should remove agent and emit event", () => {
			const handler = vi.fn();
			const agent: Agent = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				name: "test-agent",
				role: "source",
				repoPath: "/path/to/repo",
				connectedAt: new Date(),
			};

			state.addAgent(agent);
			state.on("agentChange", handler);

			const removed = state.removeAgent(agent.id);

			expect(removed).toBe(true);
			expect(state.listAgents()).toHaveLength(0);
			expect(handler).toHaveBeenCalledWith([]);
		});

		it("should return false when removing non-existent agent", () => {
			const removed = state.removeAgent("non-existent-id");
			expect(removed).toBe(false);
		});
	});

	describe("context management", () => {
		it("should set and get context", () => {
			const entry: ContextEntry = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				key: "test-key",
				value: "test-value",
				tags: ["tag1"],
				createdBy: "456e4567-e89b-12d3-a456-426614174000",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			state.setContext(entry);
			const retrieved = state.getContext("test-key");

			expect(retrieved).toEqual(entry);
		});

		it("should return undefined for non-existent key", () => {
			const retrieved = state.getContext("non-existent");
			expect(retrieved).toBeUndefined();
		});

		it("should emit contextChange event", () => {
			const handler = vi.fn();
			state.on("contextChange", handler);

			const entry: ContextEntry = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				key: "test-key",
				value: "test-value",
				tags: [],
				createdBy: "456e4567-e89b-12d3-a456-426614174000",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			state.setContext(entry);

			expect(handler).toHaveBeenCalledWith(entry);
		});

		it("should list context filtered by createdBy", () => {
			const entry1: ContextEntry = {
				id: "1",
				key: "config.db",
				value: "postgres",
				tags: [],
				createdBy: "agent1",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const entry2: ContextEntry = {
				id: "2",
				key: "config.cache",
				value: "redis",
				tags: [],
				createdBy: "agent1",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const entry3: ContextEntry = {
				id: "3",
				key: "other.setting",
				value: "value",
				tags: [],
				createdBy: "agent2",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			state.setContext(entry1);
			state.setContext(entry2);
			state.setContext(entry3);

			const agent1Entries = state.listContext({ createdBy: "agent1" });

			expect(agent1Entries).toHaveLength(2);
			expect(agent1Entries.map((e) => e.key)).toContain("config.db");
			expect(agent1Entries.map((e) => e.key)).toContain("config.cache");
		});

		it("should list context with tag filter", () => {
			const entry1: ContextEntry = {
				id: "1",
				key: "key1",
				value: "value1",
				tags: ["important"],
				createdBy: "agent1",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const entry2: ContextEntry = {
				id: "2",
				key: "key2",
				value: "value2",
				tags: ["other"],
				createdBy: "agent1",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			state.setContext(entry1);
			state.setContext(entry2);

			const filtered = state.listContext({ tags: ["important"] });

			expect(filtered).toHaveLength(1);
			expect(filtered[0]?.key).toBe("key1");
		});
	});

	describe("questions management", () => {
		it("should add question and emit event", () => {
			const handler = vi.fn();
			state.on("question", handler);

			const question: Question = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				question: "What is the API?",
				from: "456e4567-e89b-12d3-a456-426614174000",
				status: "pending",
				createdAt: new Date(),
			};

			state.addQuestion(question);

			expect(handler).toHaveBeenCalledWith(question);
		});

		it("should list pending questions", () => {
			const question1: Question = {
				id: "1",
				question: "Q1",
				from: "agent1",
				status: "pending",
				createdAt: new Date(),
			};
			const question2: Question = {
				id: "2",
				question: "Q2",
				from: "agent2",
				status: "answered",
				createdAt: new Date(),
			};

			state.addQuestion(question1);
			state.addQuestion(question2);

			const pending = state.listPendingQuestions();

			expect(pending).toHaveLength(1);
			expect(pending[0]?.id).toBe("1");
		});

		it("should filter pending questions by target agent", () => {
			const question1: Question = {
				id: "1",
				question: "Q1",
				from: "agent1",
				to: "agent2",
				status: "pending",
				createdAt: new Date(),
			};
			const question2: Question = {
				id: "2",
				question: "Q2",
				from: "agent1",
				to: "agent3",
				status: "pending",
				createdAt: new Date(),
			};

			state.addQuestion(question1);
			state.addQuestion(question2);

			const forAgent2 = state.listPendingQuestions("agent2");

			expect(forAgent2).toHaveLength(1);
			expect(forAgent2[0]?.id).toBe("1");
		});

		it("should answer question and emit event", () => {
			const handler = vi.fn();

			const question: Question = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				question: "What is the API?",
				from: "agent1",
				status: "pending",
				createdAt: new Date(),
			};

			state.addQuestion(question);
			state.on("answer", handler);

			const answered = state.answerQuestion(question.id, "The API is /api/v1", "agent2");

			expect(answered).toBeDefined();
			expect(answered?.status).toBe("answered");
			expect(answered?.answer).toBe("The API is /api/v1");
			expect(answered?.answeredBy).toBe("agent2");
			expect(handler).toHaveBeenCalled();
		});

		it("should return undefined when answering non-existent question", () => {
			const answered = state.answerQuestion("non-existent", "answer", "agent");
			expect(answered).toBeUndefined();
		});
	});

	describe("decisions management", () => {
		it("should add and list decisions", () => {
			const decision: Decision = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				decision: "Use TypeScript",
				rationale: "Type safety",
				by: "agent1",
				createdAt: new Date(),
			};

			state.addDecision(decision);
			const decisions = state.listDecisions();

			expect(decisions).toHaveLength(1);
			expect(decisions[0]).toEqual(decision);
		});
	});
});
