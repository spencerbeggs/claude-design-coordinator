import { describe, expect, it, vi } from "vitest";

// Mock the ws module before importing the client
vi.mock("ws", () => {
	const MockWebSocket = vi.fn();
	return {
		default: MockWebSocket,
		WebSocket: MockWebSocket,
	};
});

describe("createCoordinatorClient", () => {
	it("should be importable", async () => {
		// Dynamic import to ensure mocks are in place
		const { createCoordinatorClient } = await import("./client.js");
		expect(createCoordinatorClient).toBeDefined();
		expect(typeof createCoordinatorClient).toBe("function");
	});

	it("should accept a URL option", async () => {
		const { createCoordinatorClient } = await import("./client.js");
		// This will fail to connect since there's no server, but we're testing the interface
		expect(() => createCoordinatorClient({ url: "ws://localhost:9999" })).not.toThrow();
	});
});
