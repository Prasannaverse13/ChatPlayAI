import "./env.js";
import express from "express";
import http from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { Engine } from "./engine.js";
import { Store } from "./store.js";
import type { State } from "../shared/types.js";
import { CredentialVault } from "./vault.js";
import { TwitchLogin } from "./twitch-login.js";
import { version, currentArchive, checkUpdates } from "./releases.js";
const secret = () => randomBytes(32).toString("hex");
const equal = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function createApplication(initialize = true) {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  const store = new Store();
  const vault = new CredentialVault();
  const auth = secret(),
    csrf = secret();
  const overlayFile = path.join(store.dir, "overlay-token");
  const overlayToken = fs.existsSync(overlayFile)
    ? fs.readFileSync(overlayFile, "utf8")
    : secret();
  if (!fs.existsSync(overlayFile))
    fs.writeFileSync(overlayFile, overlayToken, { mode: 0o600 });
  const clients = new Map<WebSocket, boolean>();
  const publicState = (s: State) => ({
    ...s,
    entries: [],
    sessions: [],
    audit: [],
    leaderboard: [],
    credentials: { openai: false, twitch: false, model: "" },
    native: { available: false, ready: false },
    settings: { ...s.settings, targetWindow: "" },
    candidates: s.candidates.map((c) => ({
      ...c,
      users: s.settings.showUsernames ? c.users : [],
    })),
    executions: s.executions.slice(0, 5),
  });
  const engine = new Engine(
    store,
    (s) => {
      for (const [ws, overlay] of clients)
        if (ws.readyState === WebSocket.OPEN) {
          if (ws.bufferedAmount > 1_000_000) {
            ws.terminate();
            continue;
          }
          ws.send(
            JSON.stringify({
              type: "state",
              state: overlay ? publicState(s) : s,
            }),
          );
        }
    },
    async () => {
      if (vault.remembered) await vault.save();
    },
  );
  const login = new TwitchLogin(async (remember) => {
    await engine.twitch.connect();
    if (engine.twitch.status === "error") throw Error(engine.twitch.error);
    if (remember) await vault.save();
    else vault.forget();
  });
  const localHost = (host: string) =>
    /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host);
  const originAllowed = (origin: string | undefined) =>
    !origin ||
    (() => {
      try {
        const u = new URL(origin);
        return (
          u.protocol === "http:" &&
          localHost(u.host) &&
          ["4310", "5173", String(process.env.PORT || 4310)].includes(u.port)
        );
      } catch {
        return false;
      }
    })();
  const hasAuth = (cookie: string | undefined) =>
    cookie?.split(";").some((c) => equal(c.trim(), `chatplay_session=${auth}`));
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    if (!localHost(req.headers.host || ""))
      return res.status(403).json({ error: "Local access only." });
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    if (req.path.startsWith("/api")) {
      res.setHeader("Cache-Control", "no-store");
      if (!originAllowed(req.headers.origin))
        return res.status(403).json({ error: "Untrusted origin." });
    }
    next();
  });
  app.use(express.json({ limit: "24kb" }));
  app.get("/download/availability", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      windows: !!currentArchive(),
    });
  });
  app.get("/download/windows", (_req, res) => {
    const archive = currentArchive();
    if (!archive) {
      res
        .status(503)
        .type("text/plain")
        .send(
          "The Windows release has not been packaged on this computer. Run npm run package in the ChatPlay project folder, then try again.",
        );
      return;
    }
    res.download(archive, path.basename(archive));
  });
  const requests = new Map<string, { at: number; n: number }>();
  app.use("/api", (req, res, next) => {
    const key = req.socket.remoteAddress || "local";
    const now = Date.now();
    let bucket = requests.get(key);
    if (!bucket || now - bucket.at > 60000) {
      bucket = { at: now, n: 0 };
      requests.set(key, bucket);
    }
    if (++bucket.n > 600)
      return res
        .status(429)
        .json({ error: "Too many requests. Wait a minute." });
    next();
  });
  app.get("/api/bootstrap", (_req, res) => {
    res.cookie("chatplay_session", auth, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
    res.json({ csrf, state: engine.state, overlayToken });
  });
  app.get("/api/health", (_req, res) => res.json({ ok: true, version }));
  app.use("/api", (req, res, next) => {
    if (!hasAuth(req.headers.cookie))
      return res
        .status(401)
        .json({ error: "Open the studio to authenticate." });
    if (
      req.method !== "GET" &&
      !equal(String(req.headers["x-chatplay-csrf"] || ""), csrf)
    )
      return res
        .status(403)
        .json({ error: "Invalid request token. Reload the studio." });
    next();
  });
  app.get("/api/state", (_req, res) => res.json(engine.state));
  app.get("/api/updates", async (_req, res) => res.json(await checkUpdates()));
  app.post("/api/session/start", (_req, res) => {
    engine.start();
    res.json({ ok: true });
  });
  app.post("/api/session/stop", (_req, res) => {
    engine.stop();
    res.json({ ok: true });
  });
  app.post("/api/session/panic", (_req, res) => {
    engine.stop(true);
    res.json({ ok: true });
  });
  app.put("/api/settings", (req, res) => {
    engine.updateSettings(req.body);
    res.json({ ok: true });
  });
  app.post("/api/profiles", (req, res) => {
    engine.saveProfile(req.body);
    res.json({ ok: true });
  });
  app.delete("/api/profiles/:id", (req, res) => {
    engine.deleteProfile(String(req.params.id));
    res.json({ ok: true });
  });
  app.post("/api/messages", async (req, res) => {
    const data = z
      .object({
        user: z
          .string()
          .trim()
          .regex(/^[a-zA-Z0-9_]{1,25}$/),
        text: z.string().trim().min(1).max(300),
      })
      .strict()
      .parse(req.body);
    res.json(await engine.ingest(data.user, data.text));
  });
  app.post("/api/approve", async (req, res) => {
    const data = z
      .object({ id: z.string().uuid(), allow: z.boolean() })
      .strict()
      .parse(req.body);
    await engine.approve(data.id, data.allow);
    res.json({ ok: true });
  });
  app.get("/api/windows", async (_req, res) =>
    res.json(await engine.native.windows()),
  );
  app.get("/api/preview", async (_req, res) => {
    res.json(
      engine.state.settings.input === "windows"
        ? await engine.preview.frame(engine.state.settings.targetWindow)
        : { error: "Windows input is off." },
    );
  });
  app.post("/api/context/capture", async (_req, res) => {
    if (engine.state.running)
      throw Error("Pause before capturing game context.");
    if (engine.state.settings.input !== "windows")
      throw Error("Select Windows game input before capture.");
    const target = engine.state.settings.targetWindow;
    await new Promise((resolve) => setTimeout(resolve, 3000));
    if (engine.state.running || engine.state.settings.targetWindow !== target)
      throw Error("Session changed. Capture cancelled.");
    res.json(await engine.context.capture(target));
  });
  app.post("/api/context/enable", (req, res) => {
    if (engine.state.running)
      throw Error("Pause before changing screenshot context.");
    const { enabled } = z
      .object({ enabled: z.boolean() })
      .strict()
      .parse(req.body);
    if (enabled && !engine.context.image)
      throw Error("Capture a game image first.");
    if (enabled && engine.state.settings.parser !== "openai")
      throw Error("Select OpenAI parsing to use screenshot context.");
    engine.context.enabled = enabled;
    res.json({ enabled, expiresAt: engine.context.expires });
  });
  app.post("/api/diagnostics/openai", async (req, res) => {
    const { text } = z
      .object({ text: z.string().trim().min(1).max(300) })
      .strict()
      .parse(req.body);
    const started = Date.now();
    const parsed = await engine.parser.parse(
      text,
      engine.profile,
      "openai",
      undefined,
      engine.context.current,
    );
    res.json({
      parsed,
      latencyMs: Date.now() - started,
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      inputExecuted: false,
    });
  });
  app.post("/api/game/reset", (_req, res) => {
    if (engine.state.running)
      throw Error("Pause the session before resetting the playground.");
    engine.state.game = {
      x: 70,
      y: 0,
      facing: 1,
      jumps: 0,
      score: 0,
      steps: 0,
      lastAction: "Waiting for chat",
    };
    engine.emit();
    res.json({ ok: true });
  });
  app.post("/api/credentials", async (req, res) => {
    if (engine.state.running) throw Error("Pause before changing credentials.");
    const data = z
      .object({
        openaiKey: z.string().max(300).optional(),
        model: z
          .string()
          .regex(/^[a-zA-Z0-9._-]{1,100}$/)
          .optional(),
        twitchClient: z
          .string()
          .regex(/^[a-zA-Z0-9]{1,100}$/)
          .optional(),
        twitchToken: z.string().max(300).optional(),
        channel: z
          .string()
          .regex(/^[a-zA-Z0-9_]{1,25}$/)
          .optional(),
      })
      .strict()
      .parse(req.body);
    if (data.openaiKey !== undefined)
      process.env.OPENAI_API_KEY = data.openaiKey.trim();
    if (data.model) process.env.OPENAI_MODEL = data.model;
    if (data.twitchClient || data.twitchToken || data.channel) {
      engine.twitch.disconnect();
      if (
        data.twitchToken ||
        (data.twitchClient &&
          data.twitchClient !== process.env.TWITCH_CLIENT_ID)
      )
        delete process.env.TWITCH_REFRESH_TOKEN;
      if (data.twitchClient) process.env.TWITCH_CLIENT_ID = data.twitchClient;
      if (data.twitchToken)
        process.env.TWITCH_ACCESS_TOKEN = data.twitchToken.trim();
      if (data.channel) process.env.TWITCH_CHANNEL = data.channel;
    }
    engine.parser.cache.clear();
    let warning: string | undefined;
    if (vault.remembered) {
      try {
        await vault.save();
      } catch {
        warning =
          "Credentials are loaded for this session, but encrypted storage is unavailable. Use Remember credentials to retry.";
      }
    }
    engine.audit("credentials", "Connection credentials updated in memory.");
    res.json({ ok: true, ...(warning ? { warning } : {}) });
  });
  app.post("/api/credentials/remember", async (req, res) => {
    if (engine.state.running)
      throw Error("Pause before changing credential storage.");
    const { remember } = z
      .object({ remember: z.boolean() })
      .strict()
      .parse(req.body);
    if (remember) await vault.save();
    else vault.forget();
    res.json({ remembered: vault.remembered });
  });
  app.get("/api/credentials/storage", (_req, res) =>
    res.json({
      remembered: vault.remembered,
      available: process.platform === "win32",
    }),
  );
  app.post("/api/twitch/login/start", async (req, res) => {
    if (engine.state.running) throw Error("Pause before signing into Twitch.");
    const data = z
      .object({
        client: z.string().regex(/^[a-zA-Z0-9]{1,100}$/),
        channel: z.string().regex(/^[a-zA-Z0-9_]{1,25}$/),
        remember: z.boolean().default(false),
        rewards: z.boolean().default(false),
      })
      .strict()
      .parse(req.body);
    res.json(
      await login.start(data.client, data.channel, data.remember, data.rewards),
    );
  });
  app.post("/api/twitch/login/poll", async (req, res) => {
    if (engine.state.running) throw Error("Pause before completing sign-in.");
    const { id } = z.object({ id: z.string().uuid() }).strict().parse(req.body);
    res.json(await login.poll(id));
  });
  app.post("/api/twitch/login/cancel", (_req, res) => {
    login.cancel();
    res.json({ ok: true });
  });
  app.post("/api/twitch/reward", (req, res) => {
    if (engine.state.running)
      throw Error("Pause before changing channel-point controls.");
    const { id } = z
      .object({ id: z.string().uuid().or(z.literal("")) })
      .strict()
      .parse(req.body);
    process.env.TWITCH_REWARD_ID = id;
    engine.emit();
    res.json({ ok: true });
  });
  app.post("/api/twitch/connect", async (_req, res) => {
    if (engine.state.running) throw Error("Pause before reconnecting Twitch.");
    await engine.twitch.connect();
    if (
      engine.twitch.status !== "connecting" &&
      engine.twitch.status !== "connected"
    ) {
      res.status(400).json({
        error:
          engine.twitch.error ||
          "Could not connect to Twitch. Check your client ID, user access token, and channel.",
      });
      return;
    }
    res.json({ ok: true });
  });
  app.post("/api/twitch/disconnect", (_req, res) => {
    engine.stop();
    engine.twitch.disconnect();
    res.json({ ok: true });
  });
  app.get("/api/export", (_req, res) => {
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="chatplay-session.json"',
    );
    res.json({
      exportedAt: new Date().toISOString(),
      sessions: engine.state.sessions,
      stats: engine.state.stats,
      messages: engine.state.entries,
      executions: engine.state.executions,
      audit: engine.state.audit,
    });
  });
  server.on("upgrade", (req, socket, head) => {
    try {
      if (
        !localHost(req.headers.host || "") ||
        !originAllowed(req.headers.origin)
      )
        return socket.destroy();
      const url = new URL(req.url || "", "http://127.0.0.1");
      if (url.pathname !== "/events") return socket.destroy();
      const overlay = url.searchParams.get("role") === "overlay";
      if (
        overlay
          ? !equal(url.searchParams.get("token") || "", overlayToken)
          : !hasAuth(req.headers.cookie)
      )
        return socket.destroy();
      if (clients.size >= 30) return socket.destroy();
      wss.handleUpgrade(req, socket, head, (ws) => {
        clients.set(ws, overlay);
        ws.send(
          JSON.stringify({
            type: "state",
            state: overlay ? publicState(engine.state) : engine.state,
          }),
        );
        ws.on("message", () => ws.close(1008, "Read-only socket"));
        ws.on("close", () => clients.delete(ws));
      });
    } catch {
      socket.destroy();
    }
  });
  const heartbeat = setInterval(() => {
    for (const ws of clients.keys()) {
      if ((ws as any).alive === false) {
        ws.terminate();
        continue;
      }
      (ws as any).alive = false;
      ws.once("pong", () => {
        (ws as any).alive = true;
      });
      ws.ping();
    }
  }, 30000);
  heartbeat.unref();
  const dist = path.resolve("dist");
  app.use(express.static(dist));
  app.get("/{*path}", (_req, res) => {
    const file = path.join(dist, "index.html");
    fs.existsSync(file)
      ? res.sendFile(file)
      : res
          .status(404)
          .send("Studio is not built. Run npm run dev or npm run build.");
  });
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(err instanceof z.ZodError ? 400 : err.status || 400).json({
        error:
          err instanceof z.ZodError
            ? err.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ")
            : err.message || "Request failed.",
      });
    },
  );
  if (initialize) engine.initialize();
  const close = () => {
    clearInterval(heartbeat);
    engine.close();
    for (const ws of clients.keys()) ws.terminate();
    wss.close();
    server.close();
  };
  return { app, server, engine, close };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await new CredentialVault().restore();
  } catch {
    console.warn(
      "Saved credentials could not be restored. Sign in again in Settings.",
    );
  }
  const { server, close } = createApplication();
  const port = Number(process.env.PORT) || 4310;
  server.listen(port, "127.0.0.1", () =>
    console.log(`ChatPlay AI studio: http://127.0.0.1:${port}`),
  );
  server.on("error", (e) => {
    console.error("Could not start ChatPlay:", e.message);
    close();
    process.exitCode = 1;
  });
  process.on("SIGINT", () => {
    close();
    setTimeout(() => process.exit(0), 150);
  });
  process.on("SIGTERM", () => {
    close();
    setTimeout(() => process.exit(0), 150);
  });
}
