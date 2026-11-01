import { randomUUID } from "node:crypto";
export class TwitchLogin {
  pending?: {
    id: string;
    client: string;
    channel: string;
    code: string;
    expires: number;
    next: number;
    interval: number;
    remember: boolean;
    scopes: string;
    busy: boolean;
  };
  constructor(private complete: (remember: boolean) => Promise<void>) {}
  async start(
    client: string,
    channel: string,
    remember = false,
    rewards = false,
  ) {
    const scopes =
      "user:read:chat" + (rewards ? " channel:read:redemptions" : "");
    const response = await fetch("https://id.twitch.tv/oauth2/device", {
      method: "POST",
      body: new URLSearchParams({ client_id: client, scopes }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw Error(
        "Twitch could not start sign-in. Check your registered client ID and use a Public application for device sign-in.",
      );
    const data = await response.json();
    const url = new URL(data.verification_uri);
    if (
      url.protocol !== "https:" ||
      !["www.twitch.tv", "twitch.tv", "id.twitch.tv"].includes(url.hostname)
    )
      throw Error("Twitch returned an invalid sign-in address.");
    if (
      !data.device_code ||
      !Number.isFinite(data.expires_in) ||
      !Number.isFinite(data.interval)
    )
      throw Error("Twitch returned an incomplete sign-in request.");
    this.pending = {
      id: randomUUID(),
      client,
      channel,
      code: data.device_code,
      expires: Date.now() + data.expires_in * 1000,
      next: Date.now() + Math.max(5, data.interval) * 1000,
      interval: Math.max(5, data.interval) * 1000,
      remember,
      scopes,
      busy: false,
    };
    return {
      id: this.pending.id,
      url: url.toString(),
      userCode: data.user_code,
      expiresAt: this.pending.expires,
      intervalMs: this.pending.interval,
    };
  }
  async poll(id: string) {
    const pending = this.pending;
    if (!pending || id !== pending.id)
      throw Error("Sign-in request not found. Start again.");
    if (Date.now() > pending.expires) {
      this.pending = undefined;
      throw Error("Twitch sign-in expired. Start again.");
    }
    if (pending.busy || Date.now() < pending.next) return { status: "pending" };
    pending.busy = true;
    pending.next = Date.now() + pending.interval;
    try {
      const response = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        body: new URLSearchParams({
          client_id: pending.client,
          device_code: pending.code,
          scopes: pending.scopes,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data.message || data.error || "";
        if (message === "authorization_pending") return { status: "pending" };
        if (message === "slow_down") {
          pending.interval += 5000;
          pending.next = Date.now() + pending.interval;
          return { status: "pending" };
        }
        this.pending = undefined;
        throw Error(
          "Twitch authorization was denied or expired. Start sign-in again.",
        );
      }
      if (this.pending !== pending)
        throw Error("Sign-in was replaced. Start again.");
      if (
        typeof data.access_token !== "string" ||
        typeof data.refresh_token !== "string"
      )
        throw Error("Twitch did not return refreshable credentials.");
      process.env.TWITCH_CLIENT_ID = pending.client;
      process.env.TWITCH_CHANNEL = pending.channel;
      process.env.TWITCH_ACCESS_TOKEN = data.access_token;
      process.env.TWITCH_REFRESH_TOKEN = data.refresh_token;
      this.pending = undefined;
      await this.complete(pending.remember);
      return { status: "complete" };
    } finally {
      pending.busy = false;
    }
  }
  cancel() {
    this.pending = undefined;
  }
}
