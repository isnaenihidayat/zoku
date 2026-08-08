import { describe, expect, test } from "bun:test";
import { sessionTurnRegistry } from "../../services/session-turn-registry";
import { streamTurnSubscribe, streamMessage } from "../shared";

describe("streamTurnSubscribe", () => {
  test("returns null when no active turn", () => {
    expect(streamTurnSubscribe("missing_session")).toBeNull();
  });

  test("replays buffered events to subscribe connection", async () => {
    const sessionId = `session_stream_test_${Date.now()}`;

    sessionTurnRegistry.beginTurn(sessionId);
    sessionTurnRegistry.publish(sessionId, { type: "chunk", delta: "hello" });

    const response = streamTurnSubscribe(sessionId);
    expect(response).not.toBeNull();

    const reader = response!.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      if (buffer.includes('"delta":"hello"')) {
        break;
      }
    }

    expect(buffer).toContain('"delta":"hello"');

    sessionTurnRegistry.endTurn(sessionId, { type: "done", reply: "hello" });
  });
});

import { createHonoApp } from "../app";
import { AuthService } from "../../services/auth-service";
import { OrgService } from "../../services/org-service";
import { ProfileService } from "../../services/profile-service";
import { createInMemoryDatabaseAdapter } from "@zoku/db";
import { setupFreshInstallSession } from "../test-session-helpers";

describe("tool approval route", () => {
  function createApp() {
    const databaseAdapter = createInMemoryDatabaseAdapter();
    return {
      databaseAdapter,
      app: createHonoApp({
        agent: {} as never,
        automationService: {} as never,
        taskService: {} as never,
        systemStatus: { getStatus: async () => ({ ok: true }) } as never,
        workerManager: {} as never,
        mcpService: {} as never,
        authService: new AuthService(),
        orgService: new OrgService(databaseAdapter, new AuthService()),
        databaseAdapter,
        webDistDir: null,
      }),
    };
  }

  test("rejects malformed body and unknown approvals with proper status codes", async () => {
    const { app, databaseAdapter } = createApp();
    const platformSession = await setupFreshInstallSession(app, databaseAdapter, "approval@org.com");
    const orgId = platformSession.orgId!;
    const BASE = "http://localhost:4310";

    const sessionId = "session_approval_test";

    // Malformed body -> 400
    const malformed = await app.fetch(
      new Request(`${BASE}/v1/sessions/${sessionId}/tool-approvals`, {
        method: "POST",
        headers: platformSession.headers({ "X-CSRF-Token": platformSession.csrfToken }, orgId),
        body: JSON.stringify({ toolCallId: "x" }), // missing decision
      }),
    );
    expect(malformed.status).toBe(400);

    // Unknown approval -> 404
    const unknown = await app.fetch(
      new Request(`${BASE}/v1/sessions/${sessionId}/tool-approvals`, {
        method: "POST",
        headers: platformSession.headers({ "X-CSRF-Token": platformSession.csrfToken }, orgId),
        body: JSON.stringify({ toolCallId: "nope", decision: "approve" }),
      }),
    );
    const unknownBody = await unknown.text();
    if (unknown.status !== 404) {
      console.log("UNKNOWN", unknown.status, unknownBody.slice(0, 300));
    }
    expect(unknown.status).toBe(404);
  });
});

describe("tool approval happy path", () => {
  test("approve resolves a pending approval registered by an active stream", async () => {
    const { app, databaseAdapter } = await Promise.resolve().then(async () => {
      const databaseAdapter = createInMemoryDatabaseAdapter();
      return {
        databaseAdapter,
        app: createHonoApp({
          agent: {} as never,
          automationService: {} as never,
          taskService: {} as never,
          systemStatus: { getStatus: async () => ({ ok: true }) } as never,
          workerManager: {} as never,
          mcpService: {} as never,
          authService: new AuthService(),
          orgService: new OrgService(databaseAdapter, new AuthService()),
          databaseAdapter,
          webDistDir: null,
        }),
      };
    });
    const platformSession = await setupFreshInstallSession(app, databaseAdapter, "approval2@org.com");
    const BASE = "http://localhost:4310";
    const sessionId = `session_approval_${Date.now()}`;
    let decision: string | undefined;

    const fakeSession = {
      sendStream: async (_input: unknown, handlers: any) => {
        decision = await handlers.onToolApprovalRequest?.({
          toolCallId: "t1",
          tool: "write_file",
          input: { path: "/tmp/x.txt", content: "hi" },
        });
        return decision;
      },
      getContextUsage: () => undefined,
    } as never;

    const streamResponse = streamMessage(sessionId, fakeSession, {
      content: "hi",
      mode: "ask",
    });
    expect(streamResponse.status).toBe(200);

    // Wait for the stream to register the approval, then approve via the route.
    let approved = false;
    for (let i = 0; i < 50; i++) {
      const res = await app.fetch(
        new Request(`${BASE}/v1/sessions/${sessionId}/tool-approvals`, {
          method: "POST",
          headers: platformSession.headers({ "X-CSRF-Token": platformSession.csrfToken }, platformSession.orgId!),
          body: JSON.stringify({ toolCallId: "t1", decision: "approve" }),
        }),
      );
      if (res.status === 200) {
        approved = true;
        break;
      }
      await Bun.sleep(20);
    }
    expect(approved).toBe(true);

    const reader = streamResponse.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (buffer.includes('"type":"done"')) break;
    }
    expect(decision).toBe("approve");
  });
});
