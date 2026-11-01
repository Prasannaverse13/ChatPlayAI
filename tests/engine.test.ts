import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Engine } from "../server/engine";
import { Store } from "../server/store";
const dirs: string[] = [];
function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chatplay-test-"));
  dirs.push(dir);
  vi.stubEnv("CHATPLAY_DATA_DIR", dir);
  return new Engine(new Store());
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  for (const d of dirs.splice(0))
    fs.rmSync(d, { recursive: true, force: true });
});
describe("session engine", () => {
  it("starts paused and rejects moves until explicitly started", async () => {
    const e = setup();
    expect(e.state.running).toBe(false);
    expect((await e.ingest("alice", "jump")).status).toBe("blocked");
    expect(e.state.game.steps).toBe(0);
  });
  it("groups equivalent votes and applies one vote per viewer", async () => {
    const e = setup();
    e.start();
    await e.ingest("alice", "jump");
    await e.ingest("bob", "hop");
    expect(e.state.candidates).toHaveLength(1);
    expect(e.state.candidates[0].votes).toBe(2);
    const retry = await e.ingest("ALICE", "right");
    expect(retry.status).toBe("blocked");
    expect(e.state.candidates[0].votes).toBe(2);
  });
  it("executes the winning vote in the playground", async () => {
    vi.useFakeTimers();
    const e = setup();
    e.start();
    await e.ingest("alice", "right");
    await e.ingest("bob", "jump");
    await e.ingest("charlie", "go right");
    e.finishRound();
    await vi.advanceTimersByTimeAsync(500);
    expect(e.state.game.x).toBe(95);
    expect(e.state.stats.executed).toBe(1);
    expect(e.state.candidates).toHaveLength(0);
    expect(e.state.executions[0].label).toBe("Right");
  });
  it("panic cancels votes and requires explicit restart", async () => {
    const e = setup();
    e.start();
    await e.ingest("alice", "jump");
    e.stop(true);
    expect(e.state.panic).toBe(true);
    expect(e.state.candidates).toHaveLength(0);
    expect(e.state.roundEndsAt).toBeNull();
    expect((await e.ingest("bob", "jump")).status).toBe("blocked");
    e.start();
    expect(e.state.panic).toBe(false);
  });
  it("discards an in-flight parser response after stop and restart", async () => {
    const e = setup();
    e.start();
    let release!: (value: any) => void;
    vi.spyOn(e.parser, "parse").mockReturnValue(
      new Promise((resolve) => (release = resolve)),
    );
    const waiting = e.ingest("alice", "jump");
    e.stop(true);
    e.start();
    release({
      actions: [{ key: "space", durationMs: 100, repeat: 1 }],
      confidence: 1,
      label: "Jump",
      provider: "local",
    });
    expect((await waiting).status).toBe("blocked");
    expect(e.state.candidates).toHaveLength(0);
  });
  it("cancels remaining actions when stopped during execution", async () => {
    vi.useFakeTimers();
    const e = setup();
    e.start();
    const executing = e.execute({
      id: "test",
      label: "Sequence",
      votes: 1,
      users: [],
      actions: [{ key: "right", durationMs: 300, repeat: 3 }],
    });
    expect(e.state.game.x).toBe(95);
    e.stop(true);
    await vi.advanceTimersByTimeAsync(1000);
    await executing;
    expect(e.state.game.x).toBe(95);
    expect(e.state.executions[0].status).toBe("cancelled");
    expect(e.state.stats.executed).toBe(0);
  });
  it("requires approval and never executes a rejected action", async () => {
    const e = setup();
    e.updateSettings({ ...e.state.settings, mode: "approval" });
    e.start();
    await e.ingest("alice", "jump");
    expect(e.state.game.jumps).toBe(0);
    const id = e.state.executions[0].id;
    await e.approve(id, false);
    expect(e.state.executions[0].status).toBe("cancelled");
    expect(e.state.game.jumps).toBe(0);
  });
  it("prevents changing controls during a live session", () => {
    const e = setup();
    e.start();
    expect(() =>
      e.updateSettings({ ...e.state.settings, mode: "anarchy" }),
    ).toThrow("Pause");
    expect(() => e.saveProfile({ ...e.profile, name: "changed" })).toThrow(
      "Pause",
    );
  });
  it("persists summaries and settings but always restores paused", async () => {
    const e = setup();
    e.updateSettings({ ...e.state.settings, mode: "approval" });
    e.start();
    await e.ingest("alice", "jump");
    e.stop();
    const next = new Engine(new Store());
    expect(next.state.settings.mode).toBe("approval");
    expect(next.state.running).toBe(false);
    expect(next.state.sessions).toHaveLength(1);
    expect(next.state.sessions[0].messages).toBe(1);
    expect(next.state.entries).toHaveLength(0);
  });
  it("rejects aliases outside the per-game allowlist", () => {
    const e = setup();
    expect(() =>
      e.saveProfile({ ...e.profile, aliases: { interact: "e" } }),
    ).toThrow("allowed keys");
  });
  it("serves chat help without sending game input", async () => {
    const e = setup();
    e.start();
    expect((await e.ingest("alice", "!help")).status).toBe("info");
    expect(e.state.candidates).toHaveLength(0);
  });
  it("discards late parser responses after their vote round closes", async () => {
    vi.useFakeTimers();
    const e = setup();
    e.start();
    await e.ingest("alice", "right");
    let release!: (value: any) => void;
    vi.spyOn(e.parser, "parse").mockReturnValue(
      new Promise((resolve) => (release = resolve)),
    );
    const late = e.ingest("bob", "hop");
    e.finishRound();
    release({
      actions: [{ key: "space", durationMs: 100, repeat: 1 }],
      confidence: 1,
      label: "Jump",
      provider: "local",
    });
    expect((await late).reason).toContain("round ended");
    expect(e.state.candidates).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(500);
  });
});
