import { randomUUID } from "node:crypto";
import { Store } from "./store.js";
import { Parser, actionId, validateActions } from "./parser.js";
import { NativeBridge } from "./native.js";
import { Twitch } from "./twitch.js";
import { GameContext } from "./context.js";
import { GamePreview } from "./preview.js";
import {
  settingsSchema,
  profileSchema,
  type State,
  type Entry,
  type Execution,
  type Candidate,
} from "../shared/types.js";
export class Engine {
  state: State;
  parser = new Parser();
  context = new GameContext();
  native: NativeBridge;
  preview = new GamePreview();
  twitch: Twitch;
  generation = 0;
  roundGeneration = 0;
  busy = false;
  lastExecution = 0;
  cooldowns = new Map<string, number>();
  votes = new Set<string>();
  controller = new AbortController();
  sessionId = "";
  timer?: ReturnType<typeof setInterval>;
  requests = 0;
  counts = new Map<string, number>();
  sessionStarted = Date.now();
  constructor(
    public store: Store,
    private changed: (s: State) => void = () => {},
    tokensUpdated: () => Promise<void> = async () => {},
  ) {
    this.state = {
      revision: 0,
      running: false,
      panic: false,
      startedAt: null,
      settings: store.settings,
      profiles: store.profiles,
      entries: [],
      candidates: [],
      roundEndsAt: null,
      executions: [],
      sessions: store.sessions,
      audit: [],
      stats: {
        messages: 0,
        accepted: 0,
        blocked: 0,
        executed: 0,
        latencyMs: 0,
      },
      twitch: { status: "disconnected", channel: "" },
      credentials: {
        openai: !!process.env.OPENAI_API_KEY,
        twitch: !!(
          process.env.TWITCH_CLIENT_ID && process.env.TWITCH_ACCESS_TOKEN
        ),
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      },
      native: { available: process.platform === "win32", ready: false },
      game: {
        x: 70,
        y: 0,
        facing: 1,
        jumps: 0,
        score: 0,
        steps: 0,
        lastAction: "Waiting for chat",
      },
      leaderboard: [],
    };
    this.native = new NativeBridge(
      () => this.stop(true),
      () => this.emit(),
    );
    this.twitch = new Twitch(
      (user, text) => void this.ingest(user, text, "twitch"),
      () => this.emit(),
      () => this.stop(),
      tokensUpdated,
      (user, text) => void this.ingest(user, text, "reward"),
    );
  }
  initialize() {
    this.native.start();
    this.timer = setInterval(() => {
      if (
        this.state.running &&
        this.state.roundEndsAt &&
        Date.now() >= this.state.roundEndsAt
      )
        this.finishRound();
    }, 100);
    this.audit("system", "Studio started. Inputs are paused.");
  }
  get profile() {
    return this.state.profiles.find(
      (p) => p.id === this.state.settings.profileId,
    )!;
  }
  emit() {
    if (this.native)
      this.state.native = {
        available: this.native.available,
        ready: this.native.ready,
        error: this.native.error,
      };
    if (this.twitch)
      this.state.twitch = {
        status: this.twitch.status,
        channel: this.twitch.channel,
        error: this.twitch.error,
        rewardId: process.env.TWITCH_REWARD_ID || "",
        refreshable: !!process.env.TWITCH_REFRESH_TOKEN,
      };
    this.state.credentials = {
      openai: !!process.env.OPENAI_API_KEY,
      twitch: !!(
        process.env.TWITCH_CLIENT_ID && process.env.TWITCH_ACCESS_TOKEN
      ),
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    };
    this.state.revision++;
    this.changed(this.state);
  }
  audit(kind: string, message: string) {
    const record = { id: randomUUID(), at: Date.now(), kind, message };
    this.state.audit.unshift(record);
    this.state.audit = this.state.audit.slice(0, 100);
    this.store.audit(record);
    this.emit();
  }
  start() {
    if (this.state.running) return;
    if (this.state.settings.parser === "openai" && !process.env.OPENAI_API_KEY)
      throw Error("Add an OpenAI key or choose the local parser.");
    if (
      this.state.settings.input === "windows" &&
      (!this.native.ready || !this.state.settings.targetWindow)
    )
      throw Error("Choose a game window and wait for the Windows bridge.");
    if (this.state.settings.input === "windows") this.native.arm();
    this.state.panic = false;
    this.state.running = true;
    this.state.startedAt = Date.now();
    this.sessionId = randomUUID();
    this.sessionStarted = Date.now();
    this.state.stats = {
      messages: 0,
      accepted: 0,
      blocked: 0,
      executed: 0,
      latencyMs: 0,
    };
    this.cooldowns.clear();
    this.counts.clear();
    this.state.leaderboard = [];
    this.lastExecution = 0;
    this.audit("session", "Session started. Community control is active.");
  }
  invalidate() {
    this.generation++;
    this.controller.abort();
    this.controller = new AbortController();
    this.state.candidates = [];
    this.state.roundEndsAt = null;
    this.votes.clear();
    this.native.cancel();
    this.context.clear();
    for (const e of this.state.executions)
      if (e.status === "pending") {
        e.status = "cancelled";
        e.reason = "Session or controls changed.";
      }
  }
  stop(panic = false) {
    const wasRunning = this.state.running;
    this.state.running = false;
    this.state.panic = panic || this.state.panic;
    this.invalidate();
    if (wasRunning) {
      const s = {
        id: this.sessionId,
        startedAt: this.sessionStarted,
        endedAt: Date.now(),
        messages: this.state.stats.messages,
        executed: this.state.stats.executed,
        blocked: this.state.stats.blocked,
        profile: this.profile.name,
      };
      this.store.sessions.unshift(s);
      this.store.sessions = this.store.sessions.slice(0, 100);
      this.state.sessions = this.store.sessions;
      this.store.save();
    }
    if (wasRunning || panic)
      this.audit(
        panic ? "panic" : "session",
        panic
          ? "Emergency stop: pending actions cancelled, keys released."
          : "Session paused. Pending actions cleared.",
      );
    else this.emit();
  }
  updateSettings(raw: unknown) {
    if (this.state.running)
      throw Error("Pause the session before changing controls.");
    const settings = settingsSchema.parse(raw);
    if (!this.state.profiles.some((p) => p.id === settings.profileId))
      throw Error("Profile not found.");
    this.invalidate();
    this.store.settings = settings;
    this.state.settings = settings;
    this.store.save();
    this.audit("settings", "Studio settings saved.");
  }
  saveProfile(raw: unknown) {
    if (this.state.running)
      throw Error("Pause the session before editing a profile.");
    const profile = profileSchema.parse(raw);
    if (
      Object.values(profile.aliases).some(
        (k) => !profile.allowedKeys.includes(k),
      )
    )
      throw Error("All aliases must refer to allowed keys.");
    const index = this.state.profiles.findIndex((p) => p.id === profile.id);
    if (index < 0) {
      if (this.state.profiles.length >= 30)
        throw Error("Profile limit reached.");
      this.state.profiles.push(profile);
    } else this.state.profiles[index] = profile;
    this.store.profiles = this.state.profiles;
    this.store.save();
    this.audit("profile", `Saved profile: ${profile.name}`);
  }
  deleteProfile(id: string) {
    if (this.state.running) throw Error("Pause before deleting a profile.");
    if (id === this.profile.id)
      throw Error("Choose another active profile before deleting this one.");
    this.state.profiles = this.state.profiles.filter((p) => p.id !== id);
    this.store.profiles = this.state.profiles;
    this.store.save();
    this.audit("profile", "Profile deleted.");
  }
  async ingest(
    user: string,
    text: string,
    source: "test" | "twitch" | "reward" = "test",
  ) {
    const entry: Entry = {
      id: randomUUID(),
      at: Date.now(),
      user,
      text,
      source,
      status: "blocked",
    };
    const record = () => {
      this.state.entries.unshift(entry);
      this.state.entries = this.state.entries.slice(0, 120);
      if (entry.status === "blocked") this.state.stats.blocked++;
      this.emit();
      return entry;
    };
    this.state.stats.messages++;
    if (text.startsWith("!")) {
      entry.status = "info";
      entry.reason =
        text === "!help"
          ? "Try “go right” or “jump twice”. One vote per round."
          : text === "!profile"
            ? `${this.profile.name}: ${this.profile.allowedKeys.join(", ")}`
            : text === "!stats"
              ? `${this.state.stats.executed} actions executed, ${this.state.stats.accepted} votes accepted.`
              : "Available commands: !help, !profile, !stats";
      return record();
    }
    if (!this.state.running) {
      entry.reason = this.state.panic
        ? "Emergency stop is active. Start a new session to resume."
        : "Session is paused.";
      return record();
    }
    if (this.requests >= 20) {
      entry.reason = "Message queue is full. Please retry.";
      return record();
    }
    const identity =
      (source === "reward" ? "twitch" : source) + ":" + user.toLowerCase();
    const now = Date.now();
    if (
      now - (this.cooldowns.get(identity) || 0) <
      this.profile.userCooldownMs
    ) {
      entry.reason = "Viewer cooldown is active.";
      return record();
    }
    if (
      source !== "reward" &&
      this.state.settings.mode === "democracy" &&
      this.votes.has(identity)
    ) {
      entry.reason = "You already voted in this round.";
      return record();
    }
    this.cooldowns.set(identity, now);
    if (this.cooldowns.size > 10000) {
      for (const [id, t] of this.cooldowns)
        if (now - t > 30000) this.cooldowns.delete(id);
    }
    const generation = this.generation;
    const round = this.roundGeneration;
    const mode =
      source === "reward" && this.state.settings.mode !== "approval"
        ? "anarchy"
        : this.state.settings.mode;
    this.requests++;
    try {
      const parsed = await this.parser.parse(
        text,
        this.profile,
        this.state.settings.parser,
        this.controller.signal,
        this.context.current,
      );
      if (generation !== this.generation || !this.state.running)
        throw Error("Session changed while parsing. Action discarded.");
      if (mode === "democracy" && round !== this.roundGeneration)
        throw Error("Voting round ended while parsing. Action discarded.");
      if (parsed.confidence < this.state.settings.minConfidence)
        throw Error("Confidence is below the safety threshold.");
      validateActions(parsed.actions, this.profile);
      this.state.stats.latencyMs = Date.now() - now;
      entry.parsed = parsed;
      if (mode === "democracy") {
        if (this.votes.has(identity))
          throw Error("You already voted in this round.");
        this.votes.add(identity);
        const id = actionId(parsed.actions);
        let candidate = this.state.candidates.find((c) => c.id === id);
        if (!candidate) {
          if (this.state.candidates.length >= 50)
            throw Error("This round has reached its action limit.");
          candidate = {
            id,
            label: parsed.label,
            actions: parsed.actions,
            votes: 0,
            users: [],
          };
          this.state.candidates.push(candidate);
        }
        candidate.votes++;
        if (candidate.users.length < 5) candidate.users.push(user);
        if (!this.state.roundEndsAt)
          this.state.roundEndsAt = Date.now() + this.profile.voteWindowMs;
      } else if (mode === "anarchy") {
        if (
          this.busy ||
          Date.now() - this.lastExecution < this.profile.globalCooldownMs
        )
          throw Error("Global input cooldown is active.");
        void this.execute({
          id: actionId(parsed.actions),
          label: parsed.label,
          actions: parsed.actions,
          votes: 1,
          users: [user],
        });
      } else {
        if (
          this.state.executions.filter((e) => e.status === "pending").length >=
          10
        )
          throw Error("Approval queue is full.");
        this.state.executions.unshift({
          id: randomUUID(),
          at: Date.now(),
          label: parsed.label,
          actions: parsed.actions,
          votes: 1,
          status: "pending",
          input: this.state.settings.input,
        });
        this.state.executions = this.state.executions.slice(0, 100);
      }
      entry.status = "accepted";
      this.state.stats.accepted++;
      this.counts.set(user, (this.counts.get(user) || 0) + 1);
      this.state.leaderboard = [...this.counts]
        .map(([user, votes]) => ({ user, votes }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 10);
    } catch (e) {
      entry.reason = (e as Error).message;
    } finally {
      this.requests--;
    }
    return record();
  }
  finishRound() {
    const winner = [...this.state.candidates].sort(
      (a, b) => b.votes - a.votes,
    )[0];
    this.roundGeneration++;
    this.state.candidates = [];
    this.votes.clear();
    this.state.roundEndsAt = null;
    if (winner) void this.execute(winner);
    this.emit();
  }
  async approve(id: string, allow: boolean) {
    const item = this.state.executions.find(
      (e) => e.id === id && e.status === "pending",
    );
    if (!item) throw Error("Pending action not found.");
    if (!allow) {
      item.status = "cancelled";
      item.reason = "Rejected by streamer.";
      this.emit();
      return;
    }
    if (!this.state.running) throw Error("Start the session first.");
    await this.execute(
      {
        id: item.id,
        label: item.label,
        actions: item.actions,
        votes: item.votes,
        users: [],
      },
      item,
    );
  }
  async execute(candidate: Candidate, existing?: Execution) {
    const item: Execution = existing || {
      id: randomUUID(),
      at: Date.now(),
      label: candidate.label,
      actions: candidate.actions,
      votes: candidate.votes,
      status: "pending",
      input: this.state.settings.input,
    };
    if (!existing) this.state.executions.unshift(item);
    this.state.executions = this.state.executions.slice(0, 100);
    const generation = this.generation;
    let ownsLock = false;
    try {
      if (!this.state.running || this.state.panic)
        throw Error("Session is paused.");
      if (
        this.busy ||
        Date.now() - this.lastExecution < this.profile.globalCooldownMs
      )
        throw Error("Input busy or global cooldown active.");
      validateActions(candidate.actions, this.profile);
      this.busy = true;
      ownsLock = true;
      this.lastExecution = Date.now();
      if (this.state.settings.input === "windows")
        await this.native.execute(
          candidate.actions,
          this.state.settings.targetWindow,
        );
      else {
        for (const action of candidate.actions) {
          for (let n = 0; n < action.repeat; n++) {
            if (generation !== this.generation) throw Error("Input cancelled.");
            const g = this.state.game;
            const amount = Math.round(action.durationMs / 12);
            if (["right", "d"].includes(action.key)) {
              g.x = Math.min(940, g.x + amount);
              g.facing = 1;
            }
            if (["left", "a"].includes(action.key)) {
              g.x = Math.max(24, g.x - amount);
              g.facing = -1;
            }
            if (["space", "up", "w"].includes(action.key)) {
              g.jumps++;
              g.y = (g.y + 1) % 3;
            }
            g.steps++;
            g.score = Math.max(g.score, Math.floor(g.x / 90) * 10);
            g.lastAction = candidate.label;
            this.emit();
            await new Promise((r) => setTimeout(r, action.durationMs));
          }
        }
      }
      if (generation !== this.generation) throw Error("Input cancelled.");
      item.status = "executed";
      this.state.stats.executed++;
      this.audit(
        "action",
        `${candidate.label} · ${candidate.votes} vote${candidate.votes === 1 ? "" : "s"} · ${item.input}`,
      );
    } catch (e) {
      item.status = generation !== this.generation ? "cancelled" : "blocked";
      item.reason = (e as Error).message;
      this.audit("blocked", item.reason);
    } finally {
      if (ownsLock) {
        this.busy = false;
        this.lastExecution = Date.now();
      }
      this.emit();
    }
  }
  close() {
    this.stop();
    if (this.timer) clearInterval(this.timer);
    this.twitch.disconnect();
    this.native.close();
    this.preview.close();
  }
}
