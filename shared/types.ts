import { z } from "zod";
export const SAFE_KEYS = [
  "left",
  "right",
  "up",
  "down",
  "space",
  "w",
  "a",
  "s",
  "d",
  "e",
  "q",
  "r",
  "z",
  "x",
  "c",
  "enter",
] as const;
export const actionSchema = z
  .object({
    key: z.enum(SAFE_KEYS),
    durationMs: z.number().int().min(40).max(1000),
    repeat: z.number().int().min(1).max(3),
  })
  .strict();
export type Action = z.infer<typeof actionSchema>;
export const profileSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,40}$/),
    name: z.string().trim().min(1).max(60),
    genre: z.string().max(40),
    description: z.string().max(240),
    allowedKeys: z.array(z.enum(SAFE_KEYS)).min(1).max(17),
    aliases: z.record(z.string().min(1).max(30), z.enum(SAFE_KEYS)),
    maxDurationMs: z.number().int().min(40).max(1000),
    maxRepeat: z.number().int().min(1).max(3),
    userCooldownMs: z.number().int().min(500).max(30000),
    globalCooldownMs: z.number().int().min(100).max(5000),
    voteWindowMs: z.number().int().min(1500).max(15000),
  })
  .strict();
export type Profile = z.infer<typeof profileSchema>;
export const settingsSchema = z
  .object({
    profileId: z.string(),
    parser: z.enum(["local", "openai"]),
    mode: z.enum(["democracy", "anarchy", "approval"]),
    input: z.enum(["playground", "windows"]),
    targetWindow: z.string().max(30),
    overlayTheme: z.enum(["dark", "light"]),
    showUsernames: z.boolean(),
    minConfidence: z.number().min(0.5).max(1),
  })
  .strict();
export type Settings = z.infer<typeof settingsSchema>;
export type Parsed = {
  actions: Action[];
  confidence: number;
  label: string;
  provider: "local" | "openai";
};
export type Entry = {
  id: string;
  at: number;
  user: string;
  text: string;
  source: "twitch" | "test" | "reward";
  status: "accepted" | "blocked" | "info";
  reason?: string;
  parsed?: Parsed;
};
export type Candidate = {
  id: string;
  label: string;
  actions: Action[];
  votes: number;
  users: string[];
};
export type Execution = {
  id: string;
  at: number;
  label: string;
  votes: number;
  actions: Action[];
  status: "executed" | "blocked" | "pending" | "cancelled";
  reason?: string;
  input: string;
};
export type Session = {
  id: string;
  startedAt: number;
  endedAt: number;
  messages: number;
  executed: number;
  blocked: number;
  profile: string;
};
export type Audit = { id: string; at: number; kind: string; message: string };
export type Game = {
  x: number;
  y: number;
  facing: number;
  jumps: number;
  score: number;
  steps: number;
  lastAction: string;
};
export type State = {
  revision: number;
  running: boolean;
  panic: boolean;
  startedAt: number | null;
  settings: Settings;
  profiles: Profile[];
  entries: Entry[];
  candidates: Candidate[];
  roundEndsAt: number | null;
  executions: Execution[];
  sessions: Session[];
  audit: Audit[];
  stats: {
    messages: number;
    accepted: number;
    blocked: number;
    executed: number;
    latencyMs: number;
  };
  twitch: {
    status: string;
    channel: string;
    error?: string;
    rewardId?: string;
    refreshable?: boolean;
  };
  credentials: { openai: boolean; twitch: boolean; model: string };
  native: { available: boolean; ready: boolean; error?: string };
  game: Game;
  leaderboard: { user: string; votes: number }[];
};
