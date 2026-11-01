import {
  ArrowUp,
  Check,
  ChevronDown,
  Gamepad2,
  Hash,
  Heart,
  MessageCircle,
  Mic,
  Monitor,
  MoreHorizontal,
  Send,
  ShieldCheck,
  Sparkles,
  Twitch,
  Users,
  Volume2,
  Vote,
} from "lucide-react";
import { useEffect, useState } from "react";

export function ChatPlayMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`lp-wordmark ${small ? "small" : ""}`}>
      <svg viewBox="0 0 42 34" aria-hidden="true">
        <path
          d="M9 2h24a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7H21l-9 4v-4H9a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7Z"
          fill="currentColor"
        />
        <path
          d="M13 11v10m-5-5h10m10-3v1m5 5v1"
          stroke="#1b1765"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      <span>
        ChatPlay<span className="lp-ai">AI</span>
      </span>
    </span>
  );
}

export function Spark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`lp-spark ${className}`}
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M32 0c4 22 10 28 32 32-22 4-28 10-32 32C28 42 22 36 0 32 22 28 28 22 32 0Z" />
    </svg>
  );
}

export function LittleBot({
  className = "",
  mint = false,
}: {
  className?: string;
  mint?: boolean;
}) {
  return (
    <div
      className={`lp-little-bot ${mint ? "mint" : ""} ${className}`}
      aria-hidden="true"
    >
      <div className="lp-bot-antenna" />
      <div className="lp-bot-ear left" />
      <div className="lp-bot-ear right" />
      <div className="lp-bot-face">
        <i />
        <i />
        <span />
      </div>
      <div className="lp-bot-body">
        <Heart size={14} fill="currentColor" />
      </div>
      <div className="lp-bot-foot left" />
      <div className="lp-bot-foot right" />
    </div>
  );
}

export function PixelWorld({ variant = "platformer" }: { variant?: string }) {
  const racing = variant === "racing";
  return (
    <div className={`lp-pixel-world ${racing ? "racing" : ""}`}>
      <svg viewBox="0 0 600 340" aria-hidden="true">
        <defs>
          <linearGradient id={`lp-sky-${variant}`} x2="0" y2="1">
            <stop stopColor={racing ? "#29155d" : "#609be7"} />
            <stop offset="1" stopColor={racing ? "#cf6198" : "#c6eff4"} />
          </linearGradient>
        </defs>
        <rect width="600" height="340" fill={`url(#lp-sky-${variant})`} />
        <circle cx="475" cy="69" r="31" fill={racing ? "#ffd684" : "#fff3bc"} />
        <g fill="#f1fcff">
          <path d="M45 61h24V49h33v9h20v15H45zM306 48h21V38h27v8h23v13h-71z" />
          <path d="M151 102h18V91h34v13h21v13h-73z" opacity=".7" />
        </g>
        <path
          d="m0 228 121-143 123 149L380 96l153 143 67-90v191H0z"
          fill={racing ? "#4d3479" : "#7aaed4"}
        />
        <path
          d="m80 132 41-47 48 59-30-13-18 14-19-21zM342 139l38-43 43 47-28-10-18 12-17-14z"
          fill="#e6f5f7"
        />
        <path
          d="m0 266 99-85 156 94 154-108 191 94v79H0"
          fill={racing ? "#382853" : "#5b9b9e"}
        />
        {racing ? (
          <>
            <path d="M257 206h86l160 134H97z" fill="#363250" />
            <path
              d="m299 216-4 20h10l-3-20zm-6 32-6 28h20l-5-28zm-8 42-10 41h34l-6-41z"
              fill="#fff4ce"
            />
          </>
        ) : (
          <>
            <path
              d="M0 276h158v-33h132v-34h110v-26h98v-30h102v187H0"
              fill="#947454"
            />
            <path
              d="M0 276h158v-33h132v-34h110v-26h98v-30h102"
              stroke="#c9f579"
              strokeWidth="12"
              fill="none"
            />
            {[65, 202, 335, 446, 550].map((x, i) => (
              <g key={x} transform={`translate(${x} ${238 - i * 28})`}>
                <path d="m0-9 6 9-6 9-6-9z" fill="#ffdc64" />
                <path d="m0-4 2 4-2 4-2-4z" fill="#fff5aa" />
              </g>
            ))}
            <path d="M547 150V92" stroke="#fff" strokeWidth="3" />
            <path d="M549 92h29l-9 10 9 10h-29z" fill="#fa7cb7" />
          </>
        )}
      </svg>
      <div className={`lp-preview-player ${racing ? "car" : ""}`}>
        {racing ? (
          <Gamepad2 size={30} />
        ) : (
          <>
            <i />
            <b />
            <span />
          </>
        )}
      </div>
      <div className="lp-game-hud">
        <span>PIXEL {racing ? "GRAND PRIX" : "SUMMIT"}</span>
        <span>◇ 030</span>
      </div>
      <div className="lp-game-live">
        <i /> COMMUNITY PLAYGROUND
      </div>
    </div>
  );
}

const messages = [
  {
    user: "pixel_pilot",
    color: "#f5b4fa",
    text: "go right and jump twice",
    move: "Right → Jump ×2",
    avatar: "P",
  },
  {
    user: "moonbean",
    color: "#a8e5c1",
    text: "hop!",
    move: "Jump",
    avatar: "M",
  },
  {
    user: "cozy_chaos",
    color: "#ffce8f",
    text: "jump and spin",
    move: "Spin isn’t in this game’s profile",
    avatar: "C",
  },
  {
    user: "lil_sidequest",
    color: "#acb9ff",
    text: "go right",
    move: "Right",
    avatar: "S",
  },
];

export function ChatScene({ paused }: { paused: boolean }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(
      () => setIndex((n) => (n + 1) % messages.length),
      2600,
    );
    return () => clearInterval(id);
  }, [paused]);
  return (
    <div className="lp-chat-scene">
      <div className="lp-phone">
        <div className="lp-phone-island" />
        <div className="lp-phone-top">
          <Hash size={21} />
          <div>
            <strong>the-next-move</strong>
            <span>
              <i /> Your community’s turn
            </span>
          </div>
          <MoreHorizontal size={20} />
        </div>
        <div className="lp-phone-chat">
          <div className="lp-chat-date">THE ADVENTURE STARTS HERE</div>
          <div className="lp-chat-intro">
            <span>
              <Gamepad2 size={30} />
            </span>
            <h3>Your new player two?</h3>
            <p>Everyone in chat.</p>
          </div>
          {messages.slice(0, 3).map((message, i) => (
            <div
              className={`lp-message ${index === i ? "highlight" : ""}`}
              key={message.user}
            >
              <span
                className="lp-message-avatar"
                style={{ background: message.color, color: "#282046" }}
              >
                {message.avatar}
              </span>
              <div>
                <strong style={{ color: message.color }}>
                  {message.user}
                  <small>today</small>
                </strong>
                <p>{message.text}</p>
                {index === i && (
                  <span className="lp-translation">
                    <Sparkles size={11} />
                    {message.move}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div className="lp-chat-accepted">
            <span className="lp-message-avatar bot">
              <Gamepad2 size={18} />
            </span>
            <div>
              <strong>
                ChatPlay <b>BOT</b>
              </strong>
              <p>{messages[index].move}</p>
              <span>
                <Check size={11} />{" "}
                {index === 2
                  ? "No game input sent"
                  : "Mapped to a safe game action"}
              </span>
            </div>
          </div>
        </div>
        <div className="lp-phone-composer">
          <PlusIcon />
          <span>Message #the-next-move</span>
          <Send size={17} />
        </div>
        <span className="lp-phone-bottom" />
      </div>
      <div className="lp-chat-pop">
        <Sparkles size={17} />
        <div>
          <strong>Every “hop” is a jump.</strong>
          <span>Different words. One shared intent.</span>
        </div>
      </div>
      <Spark className="chat-spark" />
    </div>
  );
}
function PlusIcon() {
  return <span className="lp-plus">+</span>;
}

export function StreamScene() {
  return (
    <div className="lp-stream-scene">
      <div className="lp-broadcast">
        <div className="lp-broadcast-top">
          <span>
            <Twitch size={17} /> cozy_chaos
          </span>
          <span className="lp-demo-tag">ILLUSTRATIVE PREVIEW</span>
        </div>
        <PixelWorld />
        <div className="lp-stream-overlay">
          <div>
            <span>
              <Vote size={15} /> CHAT IS DECIDING
            </span>
            <strong>What’s our next move?</strong>
          </div>
          <div className="lp-overlay-votes">
            <span>
              Jump <i style={{ width: "72%" }} />
            </span>
            <span>
              Go right <i style={{ width: "44%" }} />
            </span>
          </div>
          <span className="lp-overlay-timer">
            3.2<span>s</span>
          </span>
        </div>
      </div>
      <div className="lp-obs-chip">
        <span>
          <Monitor size={19} />
        </span>
        <div>
          <strong>Made for your OBS scene</strong>
          <small>Live votes. Real community energy.</small>
        </div>
        <Check size={17} />
      </div>
      <div className="lp-voice-chips">
        <span>
          <Mic size={16} /> streamer
        </span>
        <span>
          <Volume2 size={16} /> everyone in chat
        </span>
      </div>
    </div>
  );
}

const modeInfo = {
  democracy: {
    label: "Democracy",
    text: "One viewer, one vote. The winning move plays.",
    icon: <Vote size={18} />,
  },
  anarchy: {
    label: "Anarchy",
    text: "Accepted moves play within your cooldowns.",
    icon: <Sparkles size={18} />,
  },
  approval: {
    label: "Your approval",
    text: "You give each move the green light.",
    icon: <ShieldCheck size={18} />,
  },
};
export function VoteScene() {
  const [mode, setMode] = useState<keyof typeof modeInfo>("democracy");
  return (
    <div className="lp-vote-scene">
      <div className="lp-vote-console">
        <header>
          <span>
            <Users size={19} /> Community controls
          </span>
          <i />
        </header>
        <div
          className="lp-mode-tabs"
          role="group"
          aria-label="Preview control modes"
        >
          {Object.entries(modeInfo).map(([id, info]) => (
            <button
              aria-pressed={mode === id}
              key={id}
              className={mode === id ? "active" : ""}
              onClick={() => setMode(id as keyof typeof modeInfo)}
            >
              {info.icon}
              {info.label}
            </button>
          ))}
        </div>
        <div className="lp-preview-votes">
          <div>
            <span className="lp-arrow-key">↑</span>
            <strong>Jump</strong>
            <b>72%</b>
            <i style={{ width: "72%" }} />
          </div>
          <div>
            <span className="lp-arrow-key">→</span>
            <strong>Go right</strong>
            <b>28%</b>
            <i style={{ width: "28%" }} />
          </div>
        </div>
        <div className="lp-mode-explanation" key={mode}>
          {modeInfo[mode].icon}
          <p>{modeInfo[mode].text}</p>
        </div>
        <footer>
          <span>
            <ShieldCheck size={13} /> Your rules are always on
          </span>
          <span>PREVIEW</span>
        </footer>
      </div>
      <div className="lp-key-float up">↑</div>
      <div className="lp-key-float space">SPACE</div>
      <LittleBot className="vote-bot" mint />
    </div>
  );
}

export function SafetyScene() {
  const [stopped, setStopped] = useState(false);
  return (
    <div className={`lp-safety-scene ${stopped ? "stopped" : ""}`}>
      <div className="lp-safety-orbit orbit-one" />
      <div className="lp-safety-orbit orbit-two" />
      <button
        className="lp-f8-key"
        onClick={() => setStopped(!stopped)}
        aria-pressed={stopped}
        aria-label={
          stopped
            ? "Reset emergency stop illustration"
            : "Try emergency stop illustration"
        }
      >
        <span>F8</span>
      </button>
      <div className="lp-stop-status">
        <span className={stopped ? "stopped" : ""} />
        {stopped
          ? "Inputs stopped. You’re in control."
          : "Your big, friendly stop button."}
        <small>INTERACTIVE PREVIEW · NO REAL INPUTS</small>
      </div>
      <div className="lp-safety-toast">
        <ShieldCheck size={18} />
        <div>
          <strong>
            {stopped
              ? "Pending moves cancelled"
              : "A safety net for every move"}
          </strong>
          <span>
            {stopped
              ? "Resume only when you’re ready."
              : "Allowed keys. Bounded inputs. Your game."}
          </span>
        </div>
        <Check size={16} />
      </div>
    </div>
  );
}

export function ProfilesScene() {
  const [profile, setProfile] = useState("platformer");
  return (
    <div className="lp-profiles-scene">
      <div className="lp-profile-window">
        <header>
          <span>
            <Gamepad2 size={18} /> Choose your adventure
          </span>
          <MoreHorizontal size={20} />
        </header>
        <PixelWorld key={profile} variant={profile} />
        <div
          className="lp-profile-choices"
          role="group"
          aria-label="Preview game profiles"
        >
          {[
            { id: "platformer", name: "Pixel Summit", type: "Platformer" },
            { id: "racing", name: "Grand Prix", type: "Racing" },
            { id: "puzzle", name: "Puzzle Party", type: "Puzzle" },
          ].map((p) => (
            <button
              aria-pressed={profile === p.id}
              className={profile === p.id ? "active" : ""}
              key={p.id}
              onClick={() => setProfile(p.id)}
            >
              <span>
                <Gamepad2 size={20} />
              </span>
              <strong>
                {p.name}
                <small>{p.type}</small>
              </strong>
              {profile === p.id ? (
                <Check size={15} />
              ) : (
                <ChevronDown size={15} />
              )}
            </button>
          ))}
        </div>
        <p>PROFILE PREVIEW · TEST YOUR GAME’S COMPATIBILITY</p>
      </div>
    </div>
  );
}
