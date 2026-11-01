import WebSocket from "ws";
export class Twitch {
  status = "disconnected";
  channel = "";
  error?: string;
  socket?: WebSocket;
  candidate?: WebSocket;
  timer?: ReturnType<typeof setTimeout>;
  watchdog?: ReturnType<typeof setInterval>;
  validation?: ReturnType<typeof setInterval>;
  lastSeen = 0;
  keepalive = 20;
  attempt = 0;
  stopped = true;
  generation = 0;
  seen = new Set<string>();
  token = "";
  client = "";
  user = "";
  broadcaster = "";
  scopes: string[] = [];
  refreshing?: Promise<void>;
  constructor(
    private message: (user: string, text: string) => void,
    private changed: () => void,
    private lost: () => void,
    private tokensUpdated: () => Promise<void> = async () => {},
    private reward: (user: string, text: string) => void = () => {},
  ) {}
  set(status: string, error?: string) {
    this.status = status;
    this.error = error;
    this.changed();
  }
  async connect() {
    this.disconnect();
    const generation = this.generation;
    this.stopped = false;
    this.set("connecting");
    try {
      this.token = (process.env.TWITCH_ACCESS_TOKEN || "").replace(
        /^oauth:/,
        "",
      );
      this.client = process.env.TWITCH_CLIENT_ID || "";
      this.channel = (process.env.TWITCH_CHANNEL || "")
        .replace(/^#/, "")
        .toLowerCase();
      if (!this.token || !this.client || !this.channel)
        throw Error(
          "Add your Twitch client ID, user access token, and channel in Connections.",
        );
      const auth = await this.validate();
      if (generation !== this.generation) return;
      this.user = auth.user_id;
      this.scopes = auth.scopes || [];
      const users = await this.api(
        `/users?login=${encodeURIComponent(this.channel)}`,
      );
      if (generation !== this.generation) return;
      this.broadcaster = users.data?.[0]?.id;
      if (!this.broadcaster) throw Error("Twitch channel not found.");
      this.open("wss://eventsub.wss.twitch.tv/ws", false);
      this.validation = setInterval(
        () =>
          void this.validate().catch(() => {
            this.disconnect();
            this.set(
              "error",
              "Twitch authorization expired. Reconnect with a valid user token.",
            );
            this.lost();
          }),
        3600000,
      );
    } catch (e) {
      if (generation === this.generation) {
        this.stopped = true;
        this.set("error", (e as Error).message);
      }
    }
  }
  async validate() {
    let r = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: { Authorization: `OAuth ${this.token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (r.status === 401 && process.env.TWITCH_REFRESH_TOKEN) {
      await this.refreshToken();
      r = await fetch("https://id.twitch.tv/oauth2/validate", {
        headers: { Authorization: `OAuth ${this.token}` },
        signal: AbortSignal.timeout(10000),
      });
    }
    if (!r.ok) throw Error("Twitch token is invalid or expired.");
    const data = await r.json();
    if (data.client_id !== this.client)
      throw Error("Token does not belong to this Twitch client ID.");
    if (!data.scopes?.includes("user:read:chat"))
      throw Error("Twitch token needs the user:read:chat permission.");
    return data;
  }
  async refreshToken() {
    if (this.refreshing) return this.refreshing;
    const client = this.client,
      generation = this.generation;
    this.refreshing = (async () => {
      const response = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: client,
          refresh_token: process.env.TWITCH_REFRESH_TOKEN || "",
          ...(process.env.TWITCH_CLIENT_SECRET
            ? { client_secret: process.env.TWITCH_CLIENT_SECRET }
            : {}),
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        throw Error("Twitch sign-in expired. Sign in again to renew access.");
      const data = await response.json();
      if (generation !== this.generation || client !== this.client)
        throw Error("Twitch account changed during refresh.");
      if (
        typeof data.access_token !== "string" ||
        typeof data.refresh_token !== "string"
      )
        throw Error("Twitch returned incomplete refreshed credentials.");
      this.token = data.access_token;
      process.env.TWITCH_ACCESS_TOKEN = data.access_token;
      process.env.TWITCH_REFRESH_TOKEN = data.refresh_token;
      await this.tokensUpdated();
    })().finally(() => {
      this.refreshing = undefined;
    });
    return this.refreshing;
  }
  async api(route: string, body?: unknown, retried = false): Promise<any> {
    const r = await fetch("https://api.twitch.tv/helix" + route, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Client-Id": this.client,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    if (r.status === 401 && !retried && process.env.TWITCH_REFRESH_TOKEN) {
      await this.refreshToken();
      return this.api(route, body, true);
    }
    if (!r.ok)
      throw Error(
        `Twitch request failed (${r.status}). Check token permissions.`,
      );
    return r.json();
  }
  open(url: string, migration: boolean) {
    if (this.stopped) return;
    const parsed = new URL(url);
    if (
      parsed.protocol !== "wss:" ||
      parsed.hostname !== "eventsub.wss.twitch.tv"
    ) {
      this.disconnect();
      this.set("error", "Twitch sent an invalid reconnect URL.");
      this.lost();
      return;
    }
    const generation = this.generation;
    const socket = new WebSocket(url);
    if (migration) this.candidate = socket;
    else this.socket = socket;
    let welcomed = false;
    const welcomeTimeout = setTimeout(() => {
      if (!welcomed) socket.terminate();
    }, 12000);
    socket.on("message", async (raw) => {
      if (this.stopped || generation !== this.generation) return;
      try {
        const m = JSON.parse(raw.toString());
        const type = m.metadata?.message_type;
        if (type === "session_welcome") {
          welcomed = true;
          clearTimeout(welcomeTimeout);
          if (!migration)
            await this.api("/eventsub/subscriptions", {
              type: "channel.chat.message",
              version: "1",
              condition: {
                broadcaster_user_id: this.broadcaster,
                user_id: this.user,
              },
              transport: {
                method: "websocket",
                session_id: m.payload.session.id,
              },
            });
          if (this.stopped || generation !== this.generation) {
            socket.close();
            return;
          }
          if (
            !migration &&
            process.env.TWITCH_REWARD_ID &&
            this.scopes.includes("channel:read:redemptions")
          ) {
            try {
              await this.api("/eventsub/subscriptions", {
                type: "channel.channel_points_custom_reward_redemption.add",
                version: "1",
                condition: {
                  broadcaster_user_id: this.broadcaster,
                  reward_id: process.env.TWITCH_REWARD_ID,
                },
                transport: {
                  method: "websocket",
                  session_id: m.payload.session.id,
                },
              });
            } catch {
              this.error =
                "Chat connected, but the channel-point reward subscription failed. Check reward ownership and permissions.";
            }
          }
          if (migration) {
            const old = this.socket;
            this.socket = socket;
            this.candidate = undefined;
            old?.close();
          }
          this.lastSeen = Date.now();
          this.keepalive =
            (m.payload.session.keepalive_timeout_seconds || 20) + 5;
          this.attempt = 0;
          this.set("connected");
          if (this.watchdog) clearInterval(this.watchdog);
          this.watchdog = setInterval(() => {
            if (Date.now() - this.lastSeen > this.keepalive * 1000)
              this.socket?.terminate();
          }, 1000);
        } else if (socket === this.socket) {
          this.lastSeen = Date.now();
          if (type === "session_reconnect") {
            if (!this.candidate)
              this.open(m.payload.session.reconnect_url, true);
          } else if (type === "revocation") {
            this.disconnect();
            this.set(
              "error",
              "Twitch revoked the chat subscription. Reconnect your account.",
            );
            this.lost();
          } else if (type === "notification") {
            const id = m.metadata.message_id;
            const timestamp = Date.parse(m.metadata.message_timestamp);
            if (
              !id ||
              !Number.isFinite(timestamp) ||
              Math.abs(Date.now() - timestamp) > 60000 ||
              this.seen.has(id)
            )
              return;
            this.seen.add(id);
            if (this.seen.size > 10000)
              this.seen.delete(this.seen.values().next().value!);
            const event = m.payload.event;
            if (
              m.payload.subscription?.type ===
              "channel.channel_points_custom_reward_redemption.add"
            ) {
              if (
                event?.reward?.id === process.env.TWITCH_REWARD_ID &&
                event.broadcaster_user_id === this.broadcaster &&
                event.user_input &&
                !this.seen.has(`redemption:${event.id}`)
              ) {
                this.seen.add(`redemption:${event.id}`);
                this.reward(
                  event.user_login || event.user_name,
                  event.user_input,
                );
              }
              return;
            }
            if (event?.message?.text)
              this.message(
                event.chatter_user_login || event.chatter_user_name,
                event.message.text,
              );
          }
        }
      } catch (e) {
        this.set("error", (e as Error).message);
        socket.close();
      }
    });
    socket.on("error", () => {
      /* close drives retry */
    });
    socket.on("close", () => {
      clearTimeout(welcomeTimeout);
      if (this.stopped || generation !== this.generation) return;
      if (socket === this.candidate) {
        this.candidate = undefined;
        return;
      }
      if (socket !== this.socket) return;
      if (this.watchdog) clearInterval(this.watchdog);
      this.lost();
      this.set(
        "reconnecting",
        "Connection interrupted. Inputs paused; resume manually after reconnect.",
      );
      this.timer = setTimeout(
        () => this.open("wss://eventsub.wss.twitch.tv/ws", false),
        Math.min(30000, 1000 * 2 ** this.attempt++),
      );
    });
  }
  disconnect() {
    this.stopped = true;
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    if (this.watchdog) clearInterval(this.watchdog);
    if (this.validation) clearInterval(this.validation);
    this.candidate?.close();
    this.socket?.close();
    this.candidate = undefined;
    this.socket = undefined;
    this.set("disconnected");
  }
}
