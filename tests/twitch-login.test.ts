import { describe, it, expect, vi, afterEach } from "vitest";
import { TwitchLogin } from "../server/twitch-login";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe("Twitch device authorization", () => {
  it("keeps the device secret server-side and respects the polling interval", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        device_code: "private-device-secret",
        user_code: "PUBLICCODE",
        verification_uri: "https://www.twitch.tv/activate",
        interval: 5,
        expires_in: 600,
      }),
    });
    vi.stubGlobal("fetch", fetcher);
    const complete = vi.fn();
    const login = new TwitchLogin(complete);
    const started = await login.start("client", "streamer");
    expect(JSON.stringify(started)).not.toContain("private-device-secret");
    expect(await login.poll(started.id)).toEqual({ status: "pending" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("exchanges a completed authorization once and rotates into refreshable credentials", async () => {
    vi.stubEnv("TWITCH_ACCESS_TOKEN", "");
    vi.stubEnv("TWITCH_REFRESH_TOKEN", "");
    vi.stubEnv("TWITCH_CLIENT_ID", "");
    vi.stubEnv("TWITCH_CHANNEL", "");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          device_code: "secret",
          user_code: "CODE",
          verification_uri: "https://www.twitch.tv/activate",
          interval: 5,
          expires_in: 600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "access-test",
          refresh_token: "refresh-test",
        }),
      });
    vi.stubGlobal("fetch", fetcher);
    const complete = vi.fn(async () => {});
    const login = new TwitchLogin(complete);
    const started = await login.start("client", "streamer", true);
    login.pending!.next = 0;
    expect(await login.poll(started.id)).toEqual({ status: "complete" });
    expect(complete).toHaveBeenCalledWith(true);
    expect(process.env.TWITCH_REFRESH_TOKEN).toBe("refresh-test");
    await expect(login.poll(started.id)).rejects.toThrow("not found");
  });
  it("rejects an untrusted verification address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          verification_uri: "https://attacker.example",
          device_code: "secret",
          interval: 5,
          expires_in: 600,
        }),
      }),
    );
    await expect(
      new TwitchLogin(async () => {}).start("client", "channel"),
    ).rejects.toThrow("invalid sign-in");
  });
});
