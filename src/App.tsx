import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Clock3,
  Code2,
  Copy,
  ExternalLink,
  Gamepad2,
  History,
  Layers3,
  Link2,
  LoaderCircle,
  MessageSquare,
  Monitor,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Send,
  Settings2,
  ShieldCheck,
  ShieldX,
  SlidersHorizontal,
  Sparkles,
  Square,
  Target,
  Trash2,
  Twitch,
  Users,
  Vote,
  X,
  Zap,
} from "lucide-react";
import type {
  State,
  Settings,
  Profile,
  Entry,
  Candidate,
} from "../shared/types";
import { api, bootstrap } from "./api";
import { ProfileEditor } from "./ProfileEditor";
import { useDialog } from "./useDialog";
import "./studio-theme.css";
import { ConnectionTools } from "./ConnectionTools";
import { GameContextPanel } from "./GameContextPanel";
import { UpdatePanel } from "./UpdatePanel";

const modes = {
  democracy: {
    name: "Democracy",
    description: "One viewer, one vote. The most popular move wins.",
  },
  anarchy: {
    name: "Anarchy",
    description: "Every accepted move plays immediately, within cooldowns.",
  },
  approval: {
    name: "Streamer approval",
    description: "You approve each move before it reaches the game.",
  },
};
const time = (n: number) =>
  new Date(n).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const duration = (n: number) =>
  `${Math.floor(n / 60000)
    .toString()
    .padStart(2, "0")}:${Math.floor((n / 1000) % 60)
    .toString()
    .padStart(2, "0")}`;
const keyName = (key: string) =>
  ({ left: "←", right: "→", up: "↑", down: "↓", space: "SPACE", enter: "↵" })[
    key
  ] || key.toUpperCase();
type View = "studio" | "profiles" | "overlay" | "history" | "settings";
function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="icon-button"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`pill ${tone}`}>
      <i />
      {children}
    </span>
  );
}
function Empty({
  icon,
  heading,
  children,
}: {
  icon: ReactNode;
  heading: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <strong>{heading}</strong>
      <p>{children}</p>
    </div>
  );
}

function LiveGame({ state }: { state: State }) {
  const [frame, setFrame] = useState<{
    title?: string;
    image?: string;
    error?: string;
  }>({});
  useEffect(() => {
    setFrame({});
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const f = await api("/preview");
        if (!stop) setFrame(f);
      } catch {
        if (!stop) setFrame({ error: "Live view unavailable." });
      }
      if (!stop) timer = setTimeout(tick, 450);
    };
    void tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [state.settings.targetWindow]);
  return (
    <div className="game-scene live-game">
      {frame.image ? (
        <img
          src={frame.image}
          alt={`Live view of ${frame.title || "the game"}`}
        />
      ) : (
        <div className="live-empty">
          <Gamepad2 size={26} />
          <strong>{frame.title || "No game selected"}</strong>
          <span>{frame.error || "Connecting to your game..."}</span>
        </div>
      )}
      <div className="game-hud">
        <span>
          <Gamepad2 size={13} /> {(frame.title || "LIVE GAME").toUpperCase()}
        </span>
        <span className="live-badge">LIVE VIEW</span>
      </div>
      {!state.running && (
        <div className="game-paused">
          <Pause size={12} />
          {state.panic ? "EMERGENCY STOP" : "AWAITING COMMUNITY"}
        </div>
      )}
    </div>
  );
}

function GameScene({
  state,
  compact = false,
}: {
  state: State;
  compact?: boolean;
}) {
  const g = state.game;
  const y =
    g.x >= 751
      ? 169
      : g.x >= 618
        ? 196
        : g.x >= 488
          ? 224
          : g.x >= 376
            ? 253
            : g.x >= 210
              ? 283
              : 307;
  const profile = state.profiles.find(
    (p) => p.id === state.settings.profileId,
  )!;
  return (
    <div className={`game-scene ${compact ? "compact" : ""}`}>
      <svg
        viewBox="0 0 1000 430"
        role="img"
        aria-label={`Pixel Summit playground. Player position ${g.x}. Score ${g.score}.`}
      >
        <defs>
          <linearGradient id="sky" x2="0" y2="1">
            <stop stopColor="#172638" />
            <stop offset="1" stopColor="#354b55" />
          </linearGradient>
          <linearGradient id="ground" x2="0" y2="1">
            <stop stopColor="#586650" />
            <stop offset="1" stopColor="#283c38" />
          </linearGradient>
          <pattern
            id="stars"
            width="127"
            height="91"
            patternUnits="userSpaceOnUse"
          >
            <path d="M21 18h2v2h-2M93 61h2v2h-2" fill="#b0c9c4" opacity=".4" />
          </pattern>
        </defs>
        <rect width="1000" height="430" fill="url(#sky)" />
        <rect width="1000" height="240" fill="url(#stars)" />
        <circle cx="778" cy="89" r="30" fill="#d1dfbd" />
        <circle cx="767" cy="81" r="30" fill="#213141" />
        <path
          d="M0 267 119 149 178 207 282 91 446 270 553 156 706 283 839 133 1000 264V430H0"
          fill="#34464c"
        />
        <path
          d="m233 148 49-57 58 64-40-15-19 14-18-21zM91 178l28-29 29 29-20-7-9 9-10-7zM802 173l37-40 43 44-26-9-19 9-12-13z"
          fill="#6a7e7b"
        />
        <path
          d="M0 312 159 235 302 309 456 215 617 319 769 239 1000 301V430H0"
          fill="#293e40"
        />
        {[25, 107, 174, 684, 727, 870, 921, 964].map((x, i) => (
          <g
            key={x}
            transform={`translate(${x} ${252 + (i % 3) * 19})`}
            fill="#203936"
          >
            <path d="M0 0-19 39h12l-19 24h21v22H5V63h21L7 39h12z" />
          </g>
        ))}
        <path
          d="M0 339h210v-24h166v-30h112v-29h130v-28h133v-27h249v229H0z"
          fill="url(#ground)"
        />
        <path
          d="M0 339h210v-24h166v-30h112v-29h130v-28h133v-27h249"
          fill="none"
          stroke="#a0ba79"
          strokeWidth="7"
        />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
          <g key={i} opacity=".2">
            <rect
              x={i * 71 + 12}
              y={365 + (i % 3) * 16}
              width="25"
              height="4"
              fill="#acc28e"
            />
            <rect
              x={i * 71 + 42}
              y={405 - (i % 3) * 14}
              width="12"
              height="4"
              fill="#acc28e"
            />
          </g>
        ))}
        {[280, 432, 554, 694, 814].map((x, i) => (
          <g key={x} transform={`translate(${x} ${280 - i * 26})`}>
            <path
              d="m0-7 5 7-5 7-5-7z"
              fill={g.x > x ? "#626d57" : "#e7cf86"}
            />
            <path d="m0-3 2 3-2 3-2-3z" fill="#fff0b9" />
          </g>
        ))}
        <path d="M893 200v-70" stroke="#b1bda5" strokeWidth="3" />
        <path d="M895 130h33l-8 11 8 11h-33z" fill="#b9f779" />
        <g
          className="game-player"
          style={{ transform: `translate(${g.x}px,${y}px)` }}
        >
          <ellipse cx="0" cy="29" rx="14" ry="4" fill="#142b2b" opacity=".45" />
          <g key={g.jumps} className={g.jumps ? "jump-motion" : ""}>
            <g transform={`scale(${g.facing} 1)`}>
              <path d="M-8 4h16v18h-16z" fill="#e2c9a3" />
              <path d="M-10 10h20v12h-20z" fill="#e58d60" />
              <path d="M-8-4h15v12H-8z" fill="#eedac0" />
              <path d="M-11-7H7v5h5v4h-23z" fill="#bbf77e" />
              <path d="M3 1h3v3H3z" fill="#263932" />
              <path d="M-8 22h6v6h-8zM3 22h6v6H3z" fill="#202e34" />
              <path d="M-14 10h5v11h-5z" fill="#b69d79" />
            </g>
          </g>
          <path d="m-3-20 3 4 3-4z" fill="#c2fb8d" />
        </g>
        <path d="M0 419h1000v11H0" fill="#1b302e" />
      </svg>
      <div className="game-hud">
        <span>
          <Gamepad2 size={13} /> {profile.name.toUpperCase()}
        </span>
        <span className="score">◇ {g.score.toString().padStart(3, "0")}</span>
      </div>
      <div className="game-caption">
        <span className="pixel-dot" /> Built-in playground <span>·</span>{" "}
        {state.settings.input === "windows"
          ? "External game selected; playground is inactive"
          : "Chat controls this character"}
      </div>
      {!state.running && !compact && (
        <div className="game-paused">
          <Pause size={12} />
          {state.panic ? "EMERGENCY STOP" : "AWAITING COMMUNITY"}
        </div>
      )}
    </div>
  );
}

export function App() {
  const overlay = location.pathname === "/overlay";
  const [state, setState] = useState<State | null>(null);
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [fatal, setFatal] = useState("");
  const [view, setView] = useState<View>(() => {
    const selected = new URLSearchParams(location.search).get("view");
    return ["studio", "profiles", "overlay", "history", "settings"].includes(
      selected || "",
    )
      ? (selected as View)
      : "studio";
  });
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [demo, setDemo] = useState(false);
  const demoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (overlay) return;
    document.body.classList.add("studio-page");
    document.title = "ChatPlay Studio — Your chat. The controller.";
    return () => document.body.classList.remove("studio-page");
  }, [overlay]);
  const latest = useRef<State | null>(null);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  useEffect(() => {
    let alive = true;
    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let attempt = 0;
    const reconnect = () => {
      if (!alive) return;
      if (overlay) {
        connect();
        return;
      }
      bootstrap()
        .then((data) => {
          if (alive) {
            setFatal("");
            setState(data.state);
            setToken(data.overlayToken);
            connect();
          }
        })
        .catch((e) => {
          if (alive) {
            setFatal(e.message);
            timer = setTimeout(
              reconnect,
              Math.min(10000, 1000 * 2 ** attempt++),
            );
          }
        });
    };
    const connect = () => {
      if (!alive) return;
      const query = overlay
        ? `?role=overlay&token=${encodeURIComponent(new URLSearchParams(location.search).get("token") || "")}`
        : "";
      socket = new WebSocket(
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/events${query}`,
      );
      socket.onopen = () => {
        if (alive) {
          setConnected(true);
          attempt = 0;
        }
      };
      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "state" && alive) setState(data.state);
        } catch {}
      };
      socket.onclose = () => {
        if (alive) {
          setConnected(false);
          timer = setTimeout(reconnect, Math.min(10000, 1000 * 2 ** attempt++));
        }
      };
      socket.onerror = () => socket?.close();
    };
    reconnect();
    return () => {
      alive = false;
      clearTimeout(timer);
      socket?.close();
    };
  }, [overlay]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(id);
    }
  }, [toast]);
  const notify = (text: string, error = false) => setToast({ text, error });
  const act = async (work: () => Promise<unknown>, success?: string) => {
    if (busy) return false;
    setBusy(true);
    try {
      await work();
      if (success) notify(success);
      return true;
    } catch (e) {
      notify((e as Error).message, true);
      return false;
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const panic = (e: KeyboardEvent) => {
      if (e.code === "F8" && !overlay) {
        e.preventDefault();
        void api("/session/panic", {}).catch(() => {});
      }
    };
    window.addEventListener("keydown", panic);
    return () => window.removeEventListener("keydown", panic);
  }, [overlay]);
  useDialog(help, () => setHelp(false));
  const stopDemo = () => {
    if (demoTimer.current) clearInterval(demoTimer.current);
    demoTimer.current = null;
    setDemo(false);
  };
  useEffect(() => {
    if (!state?.running && demo) stopDemo();
  }, [state?.running, demo]);
  useEffect(
    () => () => {
      if (demoTimer.current) clearInterval(demoTimer.current);
    },
    [],
  );
  const runDemo = async () => {
    if (demo) {
      stopDemo();
      return;
    }
    if (
      state?.settings.input !== "playground" ||
      state.settings.parser !== "local"
    )
      throw Error(
        "Select Playground input and Local parser to run sample chat.",
      );
    if (!state.running) await api("/session/start", {});
    setDemo(true);
    let index = 0;
    const lines = [
      "go right",
      "jump",
      "hop",
      "move right",
      "go left",
      "jump twice",
      "right",
      "go right then jump",
    ];
    demoTimer.current = setInterval(() => {
      if (!latest.current?.running) {
        stopDemo();
        return;
      }
      void api("/messages", {
        user: `sample_${(index % 12) + 1}`,
        text: lines[index % lines.length],
      }).catch((e) => {
        notify(e.message, true);
        stopDemo();
      });
      if (++index >= 32) stopDemo();
    }, 650);
  };
  if (overlay) return <Overlay state={state} connected={connected} now={now} />;
  if (fatal)
    return (
      <div className="startup">
        <ShieldX size={40} />
        <h1>Studio is offline</h1>
        <p>{fatal}</p>
        <p>
          Start ChatPlay with <code>npm run dev</code> or <code>npm start</code>
          .
        </p>
        <button className="button primary" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );
  if (!state)
    return (
      <div className="startup">
        <LoaderCircle className="spin" size={32} />
        <h1>Opening your studio…</h1>
      </div>
    );
  const profile = state.profiles.find(
    (p) => p.id === state.settings.profileId,
  )!;
  const saveSettings = (settings: Settings) =>
    act(() => api("/settings", settings, "PUT"), "Settings saved");
  const pending = state.executions.filter((e) => e.status === "pending");
  const overlayUrl = `${location.origin}/overlay?token=${token}`;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="ChatPlay home">
          <span className="brand-icon">
            <MessageSquare size={23} />
            <Plus size={13} />
          </span>
          <span>
            chatplay<span className="brand-ai">AI</span>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">
            <Gamepad2 size={20} />
          </span>
          <div>
            <strong>Creator workspace</strong>
            <span>Local studio</span>
          </div>
          <span className="workspace-check">
            <Check size={13} />
          </span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {(
            [
              { id: "studio", label: "Live studio", icon: <Radio size={18} /> },
              {
                id: "profiles",
                label: "Game profiles",
                icon: <Gamepad2 size={18} />,
              },
              {
                id: "overlay",
                label: "Stream overlay",
                icon: <Layers3 size={18} />,
              },
              {
                id: "history",
                label: "Session history",
                icon: <History size={18} />,
              },
              {
                id: "settings",
                label: "Settings",
                icon: <Settings2 size={18} />,
              },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => setView(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === "studio" && state.running ? (
                <span className="live-dot" />
              ) : item.id === "profiles" ? (
                <span className="nav-count">{state.profiles.length}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="community-card">
            <div>
              <Sparkles size={18} />
              <span>Better, together.</span>
            </div>
            <p>Turn your viewers into your next player two.</p>
            <button onClick={() => setHelp(true)}>
              Your quick-start guide <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="nav-item" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            <span>Help & getting started</span>
          </button>
          <div className="sidebar-footer">
            <span className={`connection-dot ${connected ? "on" : ""}`} />
            {connected ? "Local server connected" : "Reconnecting to server…"}
            <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <ChevronRight size={13} />
            <strong>
              {
                {
                  studio: "Live studio",
                  profiles: "Game profiles",
                  overlay: "Stream overlay",
                  history: "Session history",
                  settings: "Settings",
                }[view]
              }
            </strong>
          </div>
          <div className="topbar-right">
            <span className="local-badge">
              <Monitor size={13} /> LOCAL STUDIO
            </span>
            <span className="divider" />
            <button
              className="avatar"
              onClick={() => setView("settings")}
              title="Workspace settings"
            >
              CP
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {view === "studio"
                  ? "LET THE COMMUNITY TAKE CONTROL"
                  : "YOUR STREAM, YOUR RULES"}
              </div>
              <h1>
                {
                  {
                    studio: "Your chat. The controller.",
                    profiles: "A profile for every adventure.",
                    overlay: "Made to be on stream.",
                    history: "Every session tells a story.",
                    settings: "Make yourself at home.",
                  }[view]
                }
              </h1>
              <p>
                {
                  {
                    studio:
                      "Bring your audience into the game. You set the rules.",
                    profiles: "Define what chat can do, one game at a time.",
                    overlay:
                      "Give your audience a front-row seat to every decision.",
                    history:
                      "Review the moves, the moments, and the people behind them.",
                    settings:
                      "Connect your accounts and fine-tune your studio.",
                  }[view]
                }
              </p>
            </div>
            <div className="heading-actions">
              {view === "studio" ? (
                <>
                  <button
                    className="button secondary"
                    onClick={() => setView("overlay")}
                  >
                    <Layers3 size={15} /> Set up overlay{" "}
                    <ArrowUpRight size={14} />
                  </button>
                  <Pill
                    tone={
                      state.panic ? "red" : state.running ? "green" : "muted"
                    }
                  >
                    {state.panic
                      ? "Emergency stop"
                      : state.running
                        ? "Session active"
                        : "Session paused"}
                  </Pill>
                </>
              ) : (
                <button
                  className="button secondary"
                  onClick={() => setView("studio")}
                >
                  <ArrowLeft size={15} /> Back to studio
                </button>
              )}
            </div>
          </div>
          {!connected && (
            <div className="notice error">
              <Activity size={16} /> Server connection lost. Displayed values
              may be stale. Inputs can still be stopped with the native F8
              hotkey.
            </div>
          )}
          {state.panic && (
            <div className="notice error">
              <ShieldX size={18} />
              <span>
                <strong>Emergency stop active.</strong> Pending moves were
                cancelled and held keys released. Start a new session when
                you’re ready.
              </span>
            </div>
          )}
          {view === "studio" && (
            <>
              <div className="stats-grid">
                {[
                  {
                    name: "Chat messages",
                    value: state.stats.messages,
                    icon: <MessageSquare size={17} />,
                    foot: "Received this session",
                    color: "lime",
                  },
                  {
                    name: "Accepted votes",
                    value: state.stats.accepted,
                    icon: <Users size={17} />,
                    foot: "From your community",
                    color: "purple",
                  },
                  {
                    name: "Actions played",
                    value: state.stats.executed,
                    icon: <Zap size={17} />,
                    foot: "Decided by chat",
                    color: "blue",
                  },
                  {
                    name: "Safety blocks",
                    value: state.stats.blocked,
                    icon: <ShieldCheck size={17} />,
                    foot: "Keeping you in control",
                    color: "orange",
                  },
                ].map((s) => (
                  <section className="stat-card" key={s.name}>
                    <div>
                      <span>{s.name}</span>
                      <span className={`stat-icon ${s.color}`}>{s.icon}</span>
                    </div>
                    <strong>{s.value.toLocaleString()}</strong>
                    <span className="stat-foot">{s.foot}</span>
                  </section>
                ))}
              </div>
              <div className="studio-grid">
                <div className="studio-left">
                  <section className="panel game-panel">
                    <div className="panel-header">
                      <h2>
                        <Gamepad2 size={17} /> Game room
                      </h2>
                      <div className="row">
                        <Pill
                          tone={
                            state.settings.input === "playground"
                              ? "purple"
                              : "green"
                          }
                        >
                          {state.settings.input === "playground"
                            ? "Playground"
                            : "Windows input"}
                        </Pill>
                        <IconButton
                          label="Reset playground"
                          onClick={() =>
                            void act(
                              () => api("/game/reset", {}),
                              "Playground reset",
                            )
                          }
                        >
                          <RotateCcw size={15} />
                        </IconButton>
                      </div>
                    </div>
                    {state.settings.input === "windows" ? (
                      <LiveGame state={state} />
                    ) : (
                      <GameScene state={state} />
                    )}
                    <div className="game-details">
                      <div className="game-thumb">
                        <Gamepad2 size={23} />
                      </div>
                      <div>
                        <strong>{profile.name}</strong>
                        <span>
                          {profile.genre} <span>·</span>{" "}
                          {state.settings.input === "playground"
                            ? "Built-in practice room"
                            : "Selected Windows game"}
                        </span>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setView("profiles")}
                      >
                        Change profile <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="control-bar">
                      <div className="row">
                        <span
                          className={`status-beacon ${state.running ? "on" : ""}`}
                        />
                        <span>
                          {state.running
                            ? "Community control is on"
                            : "Ready when you are"}
                        </span>
                        {state.running && (
                          <span className="mono subtle">
                            {duration(now - state.startedAt!)}
                          </span>
                        )}
                      </div>
                      <button
                        className={`button ${state.running ? "secondary" : "primary"}`}
                        disabled={busy || !connected}
                        onClick={() => {
                          stopDemo();
                          void act(() =>
                            api(
                              state.running
                                ? "/session/stop"
                                : "/session/start",
                              {},
                            ),
                          );
                        }}
                      >
                        {state.running ? (
                          <Pause size={15} />
                        ) : (
                          <Play size={15} fill="currentColor" />
                        )}
                        {state.running ? "Pause session" : "Start session"}
                      </button>
                    </div>
                  </section>
                  <section className="panel">
                    <div className="panel-header">
                      <h2>
                        <Activity size={17} /> Activity feed{" "}
                        <span className="subtle count">
                          {state.entries.length}
                        </span>
                      </h2>
                      <div className="row">
                        <span className="tiny subtle">LIVE UPDATES</span>
                        <span
                          className={`live-dot ${connected ? "" : "off"}`}
                        />
                      </div>
                    </div>
                    <div className="feed">
                      {state.entries.length ? (
                        state.entries
                          .slice(0, 15)
                          .map((e) => <FeedEntry key={e.id} entry={e} />)
                      ) : (
                        <Empty
                          icon={<MessageSquare size={23} />}
                          heading="The next move starts in chat."
                        >
                          Start a session, then send a test message below or
                          connect your Twitch channel.
                        </Empty>
                      )}
                    </div>
                    <ChatInput
                      busy={busy}
                      send={(user, text) =>
                        act(() => api("/messages", { user, text }))
                      }
                    />
                  </section>
                </div>
                <div className="studio-right">
                  <section className="panel vote-panel">
                    <div className="panel-header">
                      <h2>
                        <Vote size={17} /> Community vote
                      </h2>
                      <Pill tone={state.roundEndsAt ? "green" : "muted"}>
                        {state.roundEndsAt ? "Voting open" : "Standing by"}
                      </Pill>
                    </div>
                    <div className="vote-content">
                      <div className="vote-heading">
                        <div>
                          <span className="overline">NEXT MOVE IN</span>
                          <strong>
                            {state.roundEndsAt
                              ? Math.max(
                                  0,
                                  (state.roundEndsAt - now) / 1000,
                                ).toFixed(1)
                              : "—"}
                            <small>{state.roundEndsAt ? "s" : ""}</small>
                          </strong>
                        </div>
                        <div
                          className={`round-orbit ${state.roundEndsAt ? "active" : ""}`}
                          style={
                            {
                              "--progress": `${state.roundEndsAt ? Math.max(0, (state.roundEndsAt - now) / profile.voteWindowMs) * 100 : 0}%`,
                            } as React.CSSProperties
                          }
                        >
                          <Vote size={22} />
                        </div>
                      </div>
                      {state.candidates.length ? (
                        <VoteBars candidates={state.candidates} />
                      ) : (
                        <div className="vote-empty">
                          {state.settings.mode === "democracy"
                            ? "Accepted moves appear here. Chat votes together; the most popular move plays."
                            : modes[state.settings.mode].description}
                        </div>
                      )}
                      <div className="vote-footer">
                        <Users size={13} />
                        <span>
                          {state.candidates.reduce((n, c) => n + c.votes, 0)}{" "}
                          votes this round
                        </span>
                        <span>One vote per viewer</span>
                      </div>
                    </div>
                  </section>
                  <section className="panel settings-panel">
                    <div className="panel-header">
                      <h2>
                        <SlidersHorizontal size={17} /> Session controls
                      </h2>
                      <ShieldCheck size={15} className="subtle" />
                    </div>
                    <div className="panel-body">
                      <label className="field-label" htmlFor="control-mode">
                        Control mode <span>01</span>
                      </label>
                      <div className="select-wrap">
                        <Vote size={16} />
                        <select
                          id="control-mode"
                          value={state.settings.mode}
                          disabled={state.running || busy}
                          onChange={(e) =>
                            saveSettings({
                              ...state.settings,
                              mode: e.target.value as Settings["mode"],
                            })
                          }
                        >
                          {Object.entries(modes).map(([key, v]) => (
                            <option value={key} key={key}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} />
                      </div>
                      <p className="field-help">
                        {modes[state.settings.mode].description}
                      </p>
                      <label className="field-label" htmlFor="parser">
                        Intent parser <span>02</span>
                      </label>
                      <div className="select-wrap">
                        <Sparkles size={16} />
                        <select
                          id="parser"
                          value={state.settings.parser}
                          disabled={state.running || busy}
                          onChange={(e) =>
                            saveSettings({
                              ...state.settings,
                              parser: e.target.value as Settings["parser"],
                            })
                          }
                        >
                          <option value="local">Local · plain phrases</option>
                          <option value="openai">
                            OpenAI · natural language
                          </option>
                        </select>
                        <ChevronDown size={14} />
                      </div>
                      <div className="parser-note">
                        <span
                          className={`connection-dot ${state.settings.parser === "local" || state.credentials.openai ? "on" : ""}`}
                        />
                        {state.settings.parser === "local"
                          ? "No API key needed"
                          : state.credentials.openai
                            ? "API key configured"
                            : "Add your API key in Settings"}
                      </div>
                      <div className="mini-controls">
                        <div>
                          <Clock3 size={14} />
                          <span>Vote window</span>
                          <strong>{profile.voteWindowMs / 1000}s</strong>
                        </div>
                        <div>
                          <ShieldCheck size={14} />
                          <span>Viewer cooldown</span>
                          <strong>{profile.userCooldownMs / 1000}s</strong>
                        </div>
                      </div>
                      {state.running && (
                        <p className="field-help">
                          Pause your session to change controls.
                        </p>
                      )}
                    </div>
                    <button
                      className="panic-button"
                      onClick={() => {
                        stopDemo();
                        void act(() => api("/session/panic", {}));
                      }}
                    >
                      <Square size={14} fill="currentColor" />
                      <span>Emergency stop</span>
                      <kbd>F8</kbd>
                    </button>
                  </section>
                  <section className="connect-card">
                    <div className="row">
                      <span className="twitch-icon">
                        <Twitch size={21} />
                      </span>
                      <div>
                        <strong>
                          {state.twitch.status === "connected"
                            ? `@${state.twitch.channel}`
                            : "Bring your chat along"}
                        </strong>
                        <p>
                          {state.twitch.status === "connected"
                            ? "Twitch chat is connected."
                            : "Connect Twitch to play together."}
                        </p>
                      </div>
                    </div>
                    <button
                      className="button twitch-button"
                      onClick={() => setView("settings")}
                    >
                      {state.twitch.status === "connected"
                        ? "Manage connection"
                        : "Connect Twitch"}
                      <ArrowUpRight size={14} />
                    </button>
                  </section>
                </div>
              </div>
              {pending.length > 0 && (
                <section className="panel approvals">
                  <div className="panel-header">
                    <h2>
                      <ShieldCheck size={17} /> Waiting for your approval{" "}
                      <span className="count">{pending.length}</span>
                    </h2>
                  </div>
                  {pending.map((e) => (
                    <div className="approval-row" key={e.id}>
                      <strong>{e.label}</strong>
                      <span className="subtle">{time(e.at)}</span>
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() =>
                          void act(() =>
                            api("/approve", { id: e.id, allow: false }),
                          )
                        }
                      >
                        Reject
                      </button>
                      <button
                        className="button primary"
                        disabled={busy}
                        onClick={() =>
                          void act(() =>
                            api("/approve", { id: e.id, allow: true }),
                          )
                        }
                      >
                        Play move
                      </button>
                    </div>
                  ))}
                </section>
              )}
              <div className="studio-bottom">
                <div>
                  <span className="green-text">
                    <ShieldCheck size={14} /> Safety is always on
                  </span>
                  <span>Allowed keys only</span>
                  <i />
                  <span>Bounded inputs</span>
                  <i />
                  <span>Foreground checks</span>
                </div>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void act(runDemo)}
                >
                  {demo ? <Pause size={13} /> : <Play size={13} />}{" "}
                  {demo ? "Stop sample chat" : "Try sample chat"}
                  <span className="sample-label">SIMULATED</span>
                </button>
              </div>
            </>
          )}
          {view === "profiles" && (
            <Profiles
              state={state}
              busy={busy}
              save={(p) => act(() => api("/profiles", p), "Profile saved")}
              choose={(id) =>
                saveSettings({ ...state.settings, profileId: id })
              }
              remove={(id) =>
                act(
                  () => api("/profiles/" + id, undefined, "DELETE"),
                  "Profile deleted",
                )
              }
              notify={notify}
            />
          )}
          {view === "overlay" && (
            <OverlaySettings
              state={state}
              url={overlayUrl}
              save={saveSettings}
              notify={notify}
            />
          )}
          {view === "history" && <HistoryView state={state} />}
          {view === "settings" && (
            <SettingsView
              state={state}
              busy={busy}
              save={saveSettings}
              act={act}
              notify={notify}
            />
          )}
          <footer className="page-footer">
            <span>
              CHATPLAY AI <span> / </span> MADE FOR SHARED MOMENTS
            </span>
            <span>
              <span className="connection-dot on" /> Local-first.
              Community-powered.
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div role="status" className={`toast ${toast.error ? "error" : ""}`}>
          {toast.error ? <ShieldX size={17} /> : <Check size={17} />}
          <span>{toast.text}</span>
          <IconButton
            label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={15} />
          </IconButton>
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="modal guide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-header">
              <h2 id="guide-title">
                <Sparkles size={18} /> Your first shared adventure
              </h2>
              <IconButton label="Close guide" onClick={() => setHelp(false)}>
                <X size={18} />
              </IconButton>
            </div>
            <div className="panel-body">
              <p>
                Start small. Get the whole loop working in the playground, then
                invite your community.
              </p>
              {[
                [
                  "01",
                  "Meet your player two",
                  "In Live studio, click Start session, then send “go right” and “hop” from different test usernames. Or choose Try sample chat for clearly marked simulated viewers.",
                ],
                [
                  "02",
                  "Connect your community",
                  "Open Settings → Connections. Add your Twitch app client ID, a user token with user:read:chat, and your channel. Connect Twitch.",
                ],
                [
                  "03",
                  "Set the boundaries",
                  "Choose a game profile. In Settings, switch to Windows input and select the actual game window. Keep that window focused. F8 is your global emergency stop.",
                ],
                [
                  "04",
                  "Take it on stream",
                  "Copy your Stream overlay URL into an OBS Browser Source. Set its size to 1920 × 1080 and keep the background transparent.",
                ],
              ].map(([n, title, body]) => (
                <div className="guide-step" key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </div>
              ))}
              <div className="notice">
                <ShieldCheck size={16} /> OpenAI is optional. The local parser
                works offline with simple plain phrases. Your API key can be
                added later.
              </div>
              <button className="button primary" onClick={() => setHelp(false)}>
                Let’s play <ArrowRight size={15} />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function FeedEntry({ entry: e }: { entry: Entry }) {
  const color = ["#b5dd88", "#b7a3e9", "#e2a77f", "#8ebed9"][e.user.length % 4];
  return (
    <div className="feed-entry">
      <div className="feed-avatar" style={{ color, background: color + "12" }}>
        {e.user.slice(0, 2).toUpperCase()}
      </div>
      <div className="feed-main">
        <div>
          <strong style={{ color }}>{e.user}</strong>
          <span className="source-label">
            {e.source === "test" ? "TEST CHAT" : "TWITCH"}
          </span>
          <time>{time(e.at)}</time>
        </div>
        <p>{e.text}</p>
        <div className={`parse-result ${e.status}`}>
          <span>
            {e.status === "accepted" ? (
              <Sparkles size={12} />
            ) : e.status === "blocked" ? (
              <ShieldX size={12} />
            ) : (
              <CircleHelp size={12} />
            )}
          </span>
          {e.parsed && e.status === "accepted" ? (
            <>
              <span>{e.parsed.label}</span>
              <span className="parsed-provider">
                {e.parsed.provider === "local" ? "LOCAL" : "OPENAI"} ·{" "}
                {Math.round(e.parsed.confidence * 100)}%
              </span>
            </>
          ) : (
            <span>{e.reason}</span>
          )}
        </div>
      </div>
    </div>
  );
}
function ChatInput({
  send,
  busy,
}: {
  send: (user: string, text: string) => Promise<boolean>;
  busy: boolean;
}) {
  const [user, setUser] = useState("test_viewer");
  const [text, setText] = useState("");
  return (
    <form
      className="chat-composer"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim())
          void send(user, text).then((ok) => {
            if (ok) setText("");
          });
      }}
    >
      <div className="composer-label">
        <span>
          <Code2 size={12} /> TEST YOUR CHAT
        </span>
        <label>
          as{" "}
          <input
            aria-label="Test viewer username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            maxLength={25}
            pattern="[a-zA-Z0-9_]+"
            required
          />
        </label>
      </div>
      <div className="composer-input">
        <MessageSquare size={16} />
        <input
          aria-label="Chat message"
          placeholder="Try “go right and jump twice”…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          required
        />
        <button
          type="submit"
          aria-label="Send test message"
          disabled={busy || !text.trim()}
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}
function VoteBars({ candidates }: { candidates: Candidate[] }) {
  const sorted = [...candidates].sort((a, b) => b.votes - a.votes);
  const total = sorted.reduce((n, c) => n + c.votes, 0);
  return (
    <div className="vote-bars">
      {sorted.slice(0, 5).map((c, i) => (
        <div className={`vote-option ${i === 0 ? "leading" : ""}`} key={c.id}>
          <div className="vote-option-label">
            <span>
              <kbd>{keyName(c.actions[0].key)}</kbd>
              {c.label}
            </span>
            <strong>
              {Math.round((c.votes / total) * 100)}
              <small>%</small>
            </strong>
          </div>
          <div className="vote-track">
            <div style={{ width: `${(c.votes / total) * 100}%` }} />
          </div>
          <span className="vote-count">
            {c.votes} vote{c.votes === 1 ? "" : "s"}
          </span>
        </div>
      ))}
    </div>
  );
}

function Profiles({
  state,
  busy,
  save,
  choose,
  remove,
}: {
  state: State;
  busy: boolean;
  save: (p: Profile) => Promise<boolean>;
  choose: (id: string) => void;
  remove: (id: string) => Promise<boolean>;
  notify: (s: string, error?: boolean) => void;
}) {
  const [editing, setEditing] = useState<Profile | null>(null);
  return (
    <>
      <div className="section-toolbar">
        <span className="subtle">
          {state.profiles.length} game profiles{" "}
          <span className="toolbar-dot">·</span> Stored on this computer.
        </span>
        <button
          className="button primary"
          disabled={state.running}
          onClick={() =>
            setEditing({
              ...state.profiles[0],
              id: "custom-" + Date.now().toString(36),
              name: "My game",
              description: "A new adventure for your community.",
            })
          }
        >
          <Plus size={16} /> New profile
        </button>
      </div>
      {state.running && (
        <div className="notice">
          Pause your session before editing or switching profiles.
        </div>
      )}
      <div className="profile-grid">
        {state.profiles.map((p, i) => (
          <section
            className={
              "panel profile-card " +
              (state.settings.profileId === p.id ? "selected" : "")
            }
            key={p.id}
          >
            <div className={"profile-art art-" + (i % 3)}>
              <Gamepad2 size={64} strokeWidth={1} />
              <span>{p.genre.toUpperCase()}</span>
              {state.settings.profileId === p.id && (
                <Pill tone="green">Active profile</Pill>
              )}
            </div>
            <div className="panel-body">
              <h2>{p.name}</h2>
              <p className="profile-desc">{p.description}</p>
              <div className="key-list">
                {p.allowedKeys.map((k) => (
                  <kbd key={k}>{keyName(k)}</kbd>
                ))}
              </div>
              <div className="profile-meta">
                <span>
                  <Clock3 size={13} />
                  {p.voteWindowMs / 1000}s vote
                </span>
                <span>
                  <ShieldCheck size={13} />
                  {p.maxRepeat}× max repeat
                </span>
              </div>
              <div className="profile-actions">
                <button
                  className={
                    "button " +
                    (state.settings.profileId === p.id
                      ? "secondary"
                      : "primary")
                  }
                  disabled={
                    state.running || busy || state.settings.profileId === p.id
                  }
                  onClick={() => choose(p.id)}
                >
                  {state.settings.profileId === p.id ? (
                    <>
                      <Check size={14} /> Selected
                    </>
                  ) : (
                    "Use profile"
                  )}
                </button>
                <button
                  className="button secondary"
                  disabled={state.running}
                  onClick={() => setEditing(p)}
                >
                  Edit
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>
      <div className="notice">
        <CircleHelp size={17} />
        <span>
          Profiles describe controls; they don’t install or integrate games
          automatically. Test a supported, non-elevated game in Windows mode
          before streaming.
        </span>
      </div>
      {editing && (
        <ProfileEditor
          key={editing.id}
          profile={editing}
          busy={busy}
          active={editing.id === state.settings.profileId}
          save={save}
          remove={() => remove(editing.id)}
          close={() => setEditing(null)}
        />
      )}
    </>
  );
}

function Overlay({
  state,
  connected,
  now,
}: {
  state: State | null;
  connected: boolean;
  now: number;
}) {
  useEffect(() => {
    document.body.classList.add("overlay-body");
    document.documentElement.classList.add("overlay-html");
    return () => {
      document.body.classList.remove("overlay-body");
      document.documentElement.classList.remove("overlay-html");
    };
  }, []);
  if (!state)
    return (
      <div className="overlay-offline">
        ChatPlay overlay ·{" "}
        {connected
          ? "Waiting for state…"
          : "Connection unavailable. Check the browser source URL."}
      </div>
    );
  const winner = state.executions.find((e) => e.status === "executed");
  return (
    <div className={`obs-overlay theme-${state.settings.overlayTheme}`}>
      <div className="obs-brand">
        <Gamepad2 size={21} />
        <strong>
          chatplay<span>AI</span>
        </strong>
        <Pill tone={connected && state.running ? "green" : "muted"}>
          {!connected
            ? "Offline"
            : state.panic
              ? "Stopped"
              : state.running
                ? "Chat is playing"
                : "Paused"}
        </Pill>
      </div>
      <div className="obs-content">
        <div className="obs-last">
          <span className="overline">
            {state.roundEndsAt ? "CHAT IS DECIDING" : "LAST COMMUNITY MOVE"}
          </span>
          <h2>
            {state.roundEndsAt
              ? "What’s our next move?"
              : winner?.label || "Your chat. The controller."}
          </h2>
          {state.roundEndsAt ? (
            <strong className="obs-countdown">
              {Math.max(0, (state.roundEndsAt - now) / 1000).toFixed(1)}s
            </strong>
          ) : (
            <span className="subtle">
              {winner
                ? `${winner.votes} community vote${winner.votes === 1 ? "" : "s"}`
                : "Waiting for the next adventure"}
            </span>
          )}
        </div>
        {state.candidates.length > 0 && (
          <VoteBars candidates={state.candidates} />
        )}
        <div className="obs-footer">
          <Users size={14} />
          {state.stats.accepted} accepted votes <span>·</span>
          <Zap size={14} />
          {state.stats.executed} moves
          {state.settings.showUsernames &&
            state.candidates[0]?.users.length > 0 && (
              <span>With {state.candidates[0].users.join(", ")}</span>
            )}
        </div>
      </div>
    </div>
  );
}
function OverlaySettings({
  state,
  url,
  save,
  notify,
}: {
  state: State;
  url: string;
  save: (s: Settings) => void;
  notify: (s: string, error?: boolean) => void;
}) {
  return (
    <div className="settings-layout">
      <section className="panel">
        <div className="panel-header">
          <h2>
            <Layers3 size={17} /> Browser source
          </h2>
          <Pill tone="green">OBS ready</Pill>
        </div>
        <div className="panel-body">
          <p className="section-description">
            A transparent overlay that updates with your live studio. Only
            voting and game state are shared; this link cannot control inputs.
          </p>
          <label className="field-label" htmlFor="overlay-url">
            Your overlay URL
          </label>
          <div className="copy-field">
            <input id="overlay-url" readOnly value={url} />
            <button
              className="button secondary"
              onClick={() =>
                void navigator.clipboard
                  .writeText(url)
                  .then(() => notify("Overlay URL copied"))
                  .catch(() =>
                    notify("Select the URL and copy it manually.", true),
                  )
              }
            >
              <Copy size={14} /> Copy
            </button>
          </div>
          <p className="field-help">
            Keep this link private: it grants read access to the stream overlay.
          </p>
          <div className="setup-steps">
            <div>
              <span>1</span>
              <p>
                In OBS, add a <strong>Browser Source</strong> to your scene.
              </p>
            </div>
            <div>
              <span>2</span>
              <p>
                Paste your URL. Set width to <strong>1920</strong> and height to{" "}
                <strong>1080</strong>.
              </p>
            </div>
            <div>
              <span>3</span>
              <p>
                Enable{" "}
                <strong>Refresh browser when scene becomes active</strong>.
                Position the overlay where you like.
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Appearance
              <select
                disabled={state.running}
                value={state.settings.overlayTheme}
                onChange={(e) =>
                  save({
                    ...state.settings,
                    overlayTheme: e.target.value as Settings["overlayTheme"],
                  })
                }
              >
                <option value="dark">Dark studio</option>
                <option value="light">Light studio</option>
              </select>
            </label>
            <label>
              Viewer names
              <select
                disabled={state.running}
                value={String(state.settings.showUsernames)}
                onChange={(e) =>
                  save({
                    ...state.settings,
                    showUsernames: e.target.value === "true",
                  })
                }
              >
                <option value="true">Show usernames</option>
                <option value="false">Hide usernames</option>
              </select>
            </label>
          </div>
          <a
            className="button secondary"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            Open overlay <ExternalLink size={14} />
          </a>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Overlay preview</h2>
          <span className="tiny subtle">TRANSPARENT BACKGROUND</span>
        </div>
        <div className="overlay-preview">
          <iframe title="Live OBS overlay preview" src={url} />
        </div>
        <div className="panel-body field-help">
          Updates in real time. Keep ChatPlay running while streaming. The
          source is available on this computer only.
        </div>
      </section>
    </div>
  );
}

function HistoryView({ state }: { state: State }) {
  const [tab, setTab] = useState<"sessions" | "actions" | "safety">("sessions");
  return (
    <>
      <div className="section-toolbar">
        <div className="segmented">
          {(["sessions", "actions", "safety"] as const).map((t) => (
            <button
              className={tab === t ? "selected" : ""}
              onClick={() => setTab(t)}
              key={t}
            >
              {t === "sessions"
                ? "Sessions"
                : t === "actions"
                  ? "Action log"
                  : "Safety log"}
            </button>
          ))}
        </div>
        <a className="button secondary" href="/api/export" download>
          <ArrowDownToLine size={15} /> Export JSON
        </a>
      </div>
      <section className="panel">
        {tab === "sessions" ? (
          state.sessions.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Game profile</th>
                    <th>Duration</th>
                    <th>Messages</th>
                    <th>Moves</th>
                    <th>Blocked</th>
                  </tr>
                </thead>
                <tbody>
                  {state.sessions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>
                          {new Date(s.startedAt).toLocaleDateString()}
                        </strong>
                        <span>{time(s.startedAt)}</span>
                      </td>
                      <td>{s.profile}</td>
                      <td className="mono">
                        {duration(s.endedAt - s.startedAt)}
                      </td>
                      <td>{s.messages}</td>
                      <td className="green-text">{s.executed}</td>
                      <td>{s.blocked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon={<History size={26} />}
              heading="Your first session is still ahead."
            >
              Completed sessions appear here when you pause. Session summaries
              persist between restarts.
            </Empty>
          )
        ) : tab === "actions" ? (
          state.executions.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Community move</th>
                    <th>Votes</th>
                    <th>Destination</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {state.executions.map((e) => (
                    <tr key={e.id}>
                      <td className="mono">{time(e.at)}</td>
                      <td>
                        <strong>{e.label}</strong>
                        {e.reason && <span>{e.reason}</span>}
                      </td>
                      <td>{e.votes}</td>
                      <td>{e.input}</td>
                      <td>
                        <span className={`result-label ${e.status}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty icon={<Zap size={26} />} heading="No moves played yet.">
              Start a session and give chat a turn.
            </Empty>
          )
        ) : (
          <div className="audit-list">
            {state.audit.length ? (
              state.audit
                .filter((a) => a.kind !== "action")
                .map((a) => (
                  <div className="audit-row" key={a.id}>
                    <ShieldCheck size={16} />
                    <div>
                      <strong>{a.kind}</strong>
                      <p>{a.message}</p>
                    </div>
                    <time>{time(a.at)}</time>
                  </div>
                ))
            ) : (
              <Empty icon={<ShieldCheck size={26} />} heading="All quiet here.">
                Safety and session events appear as they happen.
              </Empty>
            )}
          </div>
        )}
      </section>
      <p className="field-help">
        The studio shows recent activity. A rotating, credential-free event log
        is also stored in data/audit.jsonl. Exports include the current
        in-memory message and action history.
      </p>
      {state.leaderboard.length > 0 && (
        <section className="panel leaderboard">
          <div className="panel-header">
            <h2>
              <Users size={17} /> This session’s player twos
            </h2>
          </div>
          {state.leaderboard.map((p, i) => (
            <div className="leader-row" key={p.user}>
              <span className="mono subtle">
                {String(i + 1).padStart(2, "0")}
              </span>
              <strong>{p.user}</strong>
              <span>{p.votes} accepted votes</span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

function SettingsView({
  state,
  busy,
  save,
  act,
  notify,
}: {
  state: State;
  busy: boolean;
  save: (s: Settings) => void;
  act: (w: () => Promise<unknown>, s?: string) => Promise<boolean>;
  notify: (s: string, error?: boolean) => void;
}) {
  const [key, setKey] = useState("");
  const [model, setModel] = useState(state.credentials.model);
  const [client, setClient] = useState("");
  const [twitchToken, setTwitchToken] = useState("");
  const [channel, setChannel] = useState(state.twitch.channel);
  const [windows, setWindows] = useState<{ id: string; title: string }[]>([]);
  const [loadingWindows, setLoadingWindows] = useState(false);
  const [credentialWarning, setCredentialWarning] = useState("");
  const refresh = async () => {
    setLoadingWindows(true);
    try {
      setWindows(await api("/windows"));
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setLoadingWindows(false);
    }
  };
  return (
    <div className="settings-layout">
      <div className="settings-stack">
        <section className="panel">
          <div className="panel-header">
            <h2>
              <Link2 size={17} /> Connections
            </h2>
            <ShieldCheck size={16} className="subtle" />
          </div>
          <div className="panel-body">
            <div className="integration-heading">
              <span className="integration-logo">
                <Sparkles size={22} />
              </span>
              <div>
                <h3>OpenAI</h3>
                <p>Broader natural-language understanding.</p>
              </div>
              <Pill tone={state.credentials.openai ? "green" : "muted"}>
                {state.credentials.openai ? "Key configured" : "Optional"}
              </Pill>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act(async () => {
                  const result = await api<{ warning?: string }>(
                    "/credentials",
                    {
                      ...(key ? { openaiKey: key } : {}),
                      model,
                    },
                  );
                  setCredentialWarning(result.warning || "");
                  setKey("");
                }, "OpenAI configuration saved for this run");
              }}
            >
              <label className="input-label">
                API key
                <input
                  type="password"
                  autoComplete="off"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={
                    state.credentials.openai
                      ? "Key configured · enter a new key to replace"
                      : "sk-… · add it whenever you’re ready"
                  }
                  maxLength={300}
                />
              </label>
              <label className="input-label">
                Model
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  pattern="[a-zA-Z0-9._-]+"
                  maxLength={100}
                />
              </label>
              <p className="field-help">
                Keys work for this session. Enable Remember credentials below to
                save them encrypted on Windows, or use .env.local. Keys are
                never sent back to the browser.
              </p>
              <button
                className="button secondary"
                disabled={busy || state.running}
              >
                Save OpenAI connection
              </button>
            </form>
            {credentialWarning && (
              <div className="notice" role="status">
                {credentialWarning}
              </div>
            )}
            <div className="section-rule" />
            <div className="integration-heading">
              <span className="integration-logo purple">
                <Twitch size={22} />
              </span>
              <div>
                <h3>Twitch</h3>
                <p>Live chat through EventSub WebSockets.</p>
              </div>
              <Pill
                tone={state.twitch.status === "connected" ? "green" : "muted"}
              >
                {state.twitch.status}
              </Pill>
            </div>
            {state.twitch.error && (
              <div className="notice error">{state.twitch.error}</div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act(async () => {
                  const result = await api<{ warning?: string }>(
                    "/credentials",
                    {
                      ...(client ? { twitchClient: client } : {}),
                      ...(twitchToken ? { twitchToken } : {}),
                      ...(channel ? { channel } : {}),
                    },
                  );
                  setCredentialWarning(result.warning || "");
                  setTwitchToken("");
                  await api("/twitch/connect", {});
                }, "Connecting to Twitch…");
              }}
            >
              <label className="input-label">
                App client ID
                <input
                  autoComplete="off"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Your registered Twitch app client ID"
                  maxLength={100}
                />
              </label>
              <label className="input-label">
                User access token
                <input
                  type="password"
                  autoComplete="off"
                  value={twitchToken}
                  onChange={(e) => setTwitchToken(e.target.value)}
                  placeholder={
                    state.credentials.twitch
                      ? "Token configured · leave blank to keep"
                      : "Token with user:read:chat scope"
                  }
                  maxLength={300}
                />
              </label>
              <label className="input-label">
                Channel username
                <input
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="your_channel"
                  pattern="[a-zA-Z0-9_]+"
                  maxLength={25}
                />
              </label>
              <p className="field-help">
                Use your own Twitch user token and a matching client ID. Expired
                tokens require reconnection.{" "}
                <a
                  href="https://dev.twitch.tv/docs/chat/authenticating/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Twitch setup guide <ArrowUpRight size={11} />
                </a>
              </p>
              <div className="row">
                <button
                  className="button twitch-button"
                  disabled={
                    busy ||
                    state.running ||
                    state.twitch.status === "connecting"
                  }
                >
                  <Twitch size={15} /> Connect Twitch
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => void act(() => api("/twitch/disconnect", {}))}
                >
                  Disconnect
                </button>
              </div>
            </form>
            <ConnectionTools
              client={client}
              channel={channel}
              disabled={busy || state.running}
              notify={notify}
            />
          </div>
        </section>
      </div>
      <div className="settings-stack">
        <UpdatePanel />
        <GameContextPanel disabled={busy || state.running} notify={notify} />
        <section className="panel">
          <div className="panel-header">
            <h2>
              <Target size={17} /> Input destination
            </h2>
            <Pill tone={state.native.ready ? "green" : "muted"}>
              {state.native.ready
                ? "Bridge ready"
                : state.native.available
                  ? "Bridge starting"
                  : "Windows required"}
            </Pill>
          </div>
          <div className="panel-body">
            <label className="input-label">
              Send accepted moves to
              <select
                disabled={state.running || busy}
                value={state.settings.input}
                onChange={(e) =>
                  save({
                    ...state.settings,
                    input: e.target.value as Settings["input"],
                  })
                }
              >
                <option value="playground">Built-in playground</option>
                <option value="windows" disabled={!state.native.ready}>
                  Windows game window
                </option>
              </select>
            </label>
            {state.settings.input === "windows" ? (
              <>
                <div className="row between">
                  <label className="field-label" htmlFor="game-window">
                    Game window
                  </label>
                  <button
                    className="text-button"
                    disabled={loadingWindows || state.running}
                    onClick={() => void refresh()}
                  >
                    <RotateCcw size={13} />
                    {loadingWindows ? "Refreshing…" : "Refresh windows"}
                  </button>
                </div>
                <select
                  id="game-window"
                  disabled={state.running}
                  value={state.settings.targetWindow}
                  onChange={(e) =>
                    save({ ...state.settings, targetWindow: e.target.value })
                  }
                >
                  <option value="">Select a window…</option>
                  {state.settings.targetWindow &&
                    !windows.some(
                      (w) => w.id === state.settings.targetWindow,
                    ) && (
                      <option value={state.settings.targetWindow}>
                        Previously selected window · refresh to verify
                      </option>
                    )}
                  {windows.map((w) => (
                    <option value={w.id} key={w.id}>
                      {w.title}
                    </option>
                  ))}
                </select>
                <div className="notice">
                  <Monitor size={16} />
                  <span>
                    Keep the chosen game in the foreground. ChatPlay never
                    brings a window into focus. Inputs stop if focus changes.
                  </span>
                </div>
              </>
            ) : (
              <p className="field-help">
                A safe practice room: no real keyboard events leave ChatPlay.
                Try chat commands and voting before connecting a game.
              </p>
            )}
            {state.native.error && (
              <div className="notice error">{state.native.error}</div>
            )}
            <div className="section-rule" />
            <label className="input-label">
              Minimum parser confidence
              <select
                disabled={state.running}
                value={state.settings.minConfidence}
                onChange={(e) =>
                  save({
                    ...state.settings,
                    minConfidence: Number(e.target.value),
                  })
                }
              >
                <option value={0.75}>75% · balanced</option>
                <option value={0.9}>90% · conservative</option>
                <option value={1}>100% · strict</option>
              </select>
            </label>
            <p className="field-help">
              Model confidence is a routing hint. Profile validation and native
              key restrictions always apply.
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>
              <ShieldCheck size={17} /> Your safety net
            </h2>
          </div>
          <div className="panel-body safety-list">
            {[
              "Fixed system-key blocklist",
              "Per-game allowed keys",
              "Maximum three repeats",
              "Maximum three-second sequence",
              "Per-viewer and global cooldowns",
              "One vote per viewer per round",
              "Foreground-only Windows input",
              "Independent F8 emergency stop",
              "Bridge heartbeat watchdog",
            ].map((t) => (
              <div key={t}>
                <Check size={15} />
                {t}
              </div>
            ))}
            <div className="safety-hotkey">
              <div>
                <strong>Need to take back control?</strong>
                <span>Press F8, even while the game is focused.</span>
              </div>
              <kbd>F8</kbd>
            </div>
          </div>
        </section>
        <section className="local-note">
          <Monitor size={19} />
          <div>
            <strong>Your computer. Your controls.</strong>
            <p>
              ChatPlay binds to loopback only. Your configuration and session
              summaries live locally. OpenAI mode sends chat text and the active
              profile to OpenAI.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
