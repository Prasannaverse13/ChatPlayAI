import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
vi.mock("ws", async () => {
  const { EventEmitter } = await import("node:events");
  class FakeSocket extends EventEmitter {
    static instances: FakeSocket[] = [];
    url: string;
    constructor(url: string) {
      super();
      this.url = url;
      FakeSocket.instances.push(this);
    }
    close() {
      this.emit("close");
    }
    terminate() {
      this.emit("close");
    }
  }
  return { default: FakeSocket };
});
import WebSocket from "ws";
import { Twitch } from "../server/twitch";
const sockets = () => (WebSocket as any).instances as any[];
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const send = (
  socket: any,
  type: string,
  payload: object = {},
  metadata: object = {},
) =>
  socket.emit(
    "message",
    Buffer.from(
      JSON.stringify({
        metadata: {
          message_type: type,
          message_id: "id",
          message_timestamp: new Date().toISOString(),
          ...metadata,
        },
        payload,
      }),
    ),
  );
let message: ReturnType<typeof vi.fn<(user: string, text: string) => void>>;
let changed: ReturnType<typeof vi.fn<() => void>>;
let lost: ReturnType<typeof vi.fn<() => void>>;
let twitch: Twitch;
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.useFakeTimers();
  (WebSocket as any).instances = [];
  vi.stubEnv("TWITCH_CLIENT_ID", "client");
  vi.stubEnv("TWITCH_ACCESS_TOKEN", "token");
  vi.stubEnv("TWITCH_CHANNEL", "channel");
  message = vi.fn<(user: string, text: string) => void>();
  changed = vi.fn<() => void>();
  lost = vi.fn<() => void>();
  twitch = new Twitch(message, changed, lost);
  fetcher = vi.fn().mockImplementation(async (url: string) => ({
    ok: true,
    json: async () =>
      url.includes("/validate")
        ? {
            client_id: "client",
            user_id: "viewer",
            scopes: ["user:read:chat"],
          }
        : url.includes("/users")
          ? { data: [{ id: "broadcaster" }] }
          : { data: [{ id: "subscription" }] },
  }));
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => {
  twitch.disconnect();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
async function connected() {
  await twitch.connect();
  const socket = sockets()[0];
  send(socket, "session_welcome", {
    session: { id: "session", keepalive_timeout_seconds: 10 },
  });
  await flush();
  expect(twitch.status).toBe("connected");
  return socket;
}
describe("Twitch EventSub lifecycle", () => {
  it("validates the token and subscribes to the correct channel and reader", async () => {
    await connected();
    const call = fetcher.mock.calls.find(([url]) =>
      url.includes("/subscriptions"),
    );
    expect(JSON.parse(call![1].body)).toMatchObject({
      type: "channel.chat.message",
      condition: { broadcaster_user_id: "broadcaster", user_id: "viewer" },
      transport: { session_id: "session" },
    });
  });
  it("deduplicates notifications and discards stale events", async () => {
    const socket = await connected();
    const payload = {
      event: { chatter_user_login: "alice", message: { text: "hop" } },
    };
    send(socket, "notification", payload);
    send(socket, "notification", payload);
    send(socket, "notification", payload, {
      message_id: "old",
      message_timestamp: new Date(Date.now() - 120000).toISOString(),
    });
    expect(message).toHaveBeenCalledTimes(1);
    expect(message).toHaveBeenCalledWith("alice", "hop");
  });
  it("migrates a session without creating duplicate subscriptions", async () => {
    const old = await connected();
    send(old, "session_reconnect", {
      session: { reconnect_url: "wss://eventsub.wss.twitch.tv/ws?reconnect=1" },
    });
    expect(sockets()).toHaveLength(2);
    send(sockets()[1], "session_welcome", {
      session: { id: "migrated", keepalive_timeout_seconds: 10 },
    });
    await flush();
    expect(twitch.status).toBe("connected");
    expect(
      fetcher.mock.calls.filter(([url]) => url.includes("/subscriptions")),
    ).toHaveLength(1);
    expect(lost).not.toHaveBeenCalled();
  });
  it("pauses control on loss and retries with a fresh session", async () => {
    const socket = await connected();
    socket.close();
    expect(lost).toHaveBeenCalledTimes(1);
    expect(twitch.status).toBe("reconnecting");
    await vi.advanceTimersByTimeAsync(1000);
    expect(sockets()).toHaveLength(2);
  });
  it("detects a missing keepalive", async () => {
    await connected();
    await vi.advanceTimersByTimeAsync(16000);
    expect(lost).toHaveBeenCalled();
    expect(twitch.status).toBe("reconnecting");
  });
  it("stops on revocation", async () => {
    const socket = await connected();
    send(socket, "revocation", {
      subscription: { status: "authorization_revoked" },
    });
    expect(twitch.status).toBe("error");
    expect(lost).toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60000);
    expect(sockets()).toHaveLength(1);
  });
  it("does not reconnect after an explicit disconnect", async () => {
    await connected();
    twitch.disconnect();
    await vi.advanceTimersByTimeAsync(60000);
    expect(sockets()).toHaveLength(1);
    expect(twitch.status).toBe("disconnected");
  });
  it("rejects mismatched client IDs before opening a socket", async () => {
    fetcher.mockResolvedValue({
      ok: true,
      json: async () => ({ client_id: "wrong", scopes: ["user:read:chat"] }),
    });
    await twitch.connect();
    expect(twitch.status).toBe("error");
    expect(twitch.error).toContain("client ID");
    expect(sockets()).toHaveLength(0);
  });
  it("rejects missing read-chat scope", async () => {
    fetcher.mockResolvedValue({
      ok: true,
      json: async () => ({ client_id: "client", scopes: [] }),
    });
    await twitch.connect();
    expect(twitch.error).toContain("user:read:chat");
    expect(sockets()).toHaveLength(0);
  });
  it("does not follow arbitrary reconnect hosts", async () => {
    const socket = await connected();
    send(socket, "session_reconnect", {
      session: { reconnect_url: "wss://attacker.example/steal" },
    });
    expect(sockets()).toHaveLength(1);
    expect(twitch.status).toBe("error");
  });
});
