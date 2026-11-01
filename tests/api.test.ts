import { describe, it, expect, afterAll, beforeAll, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import WebSocket from "ws";
import { createApplication } from "../server/index";
import { CredentialVault } from "../server/vault";
let application: ReturnType<typeof createApplication>;
let base: string;
let cookie: string;
let csrf: string;
let overlayToken: string;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chatplay-api-"));
beforeAll(async () => {
  vi.stubEnv("CHATPLAY_DATA_DIR", dir);
  application = createApplication(false);
  await new Promise<void>((resolve) =>
    application.server.listen(0, "127.0.0.1", resolve),
  );
  const address = application.server.address() as { port: number };
  base = `http://127.0.0.1:${address.port}`;
  const r = await fetch(base + "/api/bootstrap");
  cookie = r.headers.get("set-cookie")!.split(";")[0];
  const body = await r.json();
  csrf = body.csrf;
  overlayToken = body.overlayToken;
});
afterAll(() => {
  application.close();
  vi.unstubAllEnvs();
  fs.rmSync(dir, { recursive: true, force: true });
});
const post = (route: string, body: unknown, token = csrf) =>
  fetch(base + route, {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-ChatPlay-CSRF": token,
    },
    body: JSON.stringify(body),
  });
describe("local control API", () => {
  it("keeps credentials usable when optional encrypted storage fails", async () => {
    const save = vi
      .spyOn(CredentialVault.prototype, "save")
      .mockImplementation(async function (this: CredentialVault) {
        this.remembered = true;
      });
    try {
      expect(
        (await post("/api/credentials/remember", { remember: true })).ok,
      ).toBe(true);
      save.mockRejectedValue(new Error("Storage unavailable"));
      const response = await post("/api/credentials", {
        openaiKey: "dummy-session-value",
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        ok: true,
        warning: expect.stringContaining("loaded for this session"),
      });
      expect(process.env.OPENAI_API_KEY).toBe("dummy-session-value");
      expect(application.engine.state.running).toBe(false);
    } finally {
      save.mockRestore();
      await post("/api/credentials/remember", { remember: false });
      delete process.env.OPENAI_API_KEY;
    }
  });
  it("requires authentication for game screenshots", async () => {
    expect((await fetch(base + "/api/preview")).status).toBe(401);
  });
  it("does not capture a window when Windows input is off", async () => {
    const frame = vi.spyOn(application.engine.preview, "frame");
    try {
      const response = await fetch(base + "/api/preview", {
        headers: { Cookie: cookie },
      });
      expect(await response.json()).toEqual({ error: "Windows input is off." });
      expect(frame).not.toHaveBeenCalled();
    } finally {
      frame.mockRestore();
    }
  });
  it("returns a useful error when Twitch authentication fails", async () => {
    const connect = vi
      .spyOn(application.engine.twitch, "connect")
      .mockImplementation(async () => {
        application.engine.twitch.set(
          "error",
          "Twitch token is invalid or expired.",
        );
      });
    try {
      const response = await post("/api/twitch/connect", {});
      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe(
        "Twitch token is invalid or expired.",
      );
    } finally {
      connect.mockRestore();
    }
  });
  it("reports missing release archives without offering a broken download", async () => {
    const original = fs.existsSync;
    const exists = vi
      .spyOn(fs, "existsSync")
      .mockImplementation((file) =>
        String(file).includes(path.resolve("artifacts/ChatPlayAI-")) &&
        String(file).endsWith(".zip")
          ? false
          : original(file),
      );
    try {
      const response = await fetch(base + "/download/availability");
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ windows: false });
      expect((await fetch(base + "/download/windows")).status).toBe(503);
    } finally {
      exists.mockRestore();
    }
  });
  it("requires authentication for state", async () => {
    expect((await fetch(base + "/api/state")).status).toBe(401);
  });
  it("requires CSRF protection for control mutations", async () => {
    expect((await post("/api/session/start", {}, "wrong")).status).toBe(403);
    expect(application.engine.state.running).toBe(false);
  });
  it("rejects remote origins", async () => {
    const r = await fetch(base + "/api/bootstrap", {
      headers: { Origin: "https://attacker.example" },
    });
    expect(r.status).toBe(403);
  });
  it("rejects DNS rebinding hosts", async () => {
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const r = http.get(
        base + "/api/bootstrap",
        { headers: { Host: "attacker.example" } },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        },
      );
      r.on("error", reject);
    });
    expect(status).toBe(403);
  });
  it("runs the real request → parser → vote → playground flow", async () => {
    expect((await post("/api/session/start", {})).ok).toBe(true);
    const r = await post("/api/messages", {
      user: "alice",
      text: "jump twice",
    });
    expect((await r.json()).status).toBe("accepted");
    expect(application.engine.state.candidates[0].actions[0].repeat).toBe(2);
    application.engine.finishRound();
    await new Promise((r) => setTimeout(r, 250));
    expect(application.engine.state.game.jumps).toBe(2);
    await post("/api/session/stop", {});
  });
  it("validates the message body", async () => {
    expect(
      (await post("/api/messages", { user: "<script>", text: "jump" })).status,
    ).toBe(400);
    expect(
      (await post("/api/messages", { user: "alice", text: "a".repeat(301) }))
        .status,
    ).toBe(400);
  });
  it("does not disclose credentials in state or export", async () => {
    await post("/api/credentials", { openaiKey: "secret-for-test" });
    const r = await fetch(base + "/api/state", { headers: { Cookie: cookie } });
    expect(await r.text()).not.toContain("secret-for-test");
    const exp = await fetch(base + "/api/export", {
      headers: { Cookie: cookie },
    });
    expect(await exp.text()).not.toContain("secret-for-test");
    delete process.env.OPENAI_API_KEY;
  });
  it("provides a read-only overlay websocket without raw chat or audit", async () => {
    const data: any = await new Promise((resolve, reject) => {
      const ws = new WebSocket(
        base.replace("http", "ws") +
          `/events?role=overlay&token=${overlayToken}`,
      );
      ws.on("message", (raw) => {
        resolve(JSON.parse(raw.toString()));
        ws.close();
      });
      ws.on("error", reject);
    });
    expect(data.state.entries).toEqual([]);
    expect(data.state.audit).toEqual([]);
    expect(data.state.sessions).toEqual([]);
    expect(data.state.settings.targetWindow).toBe("");
  });
});
