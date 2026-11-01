import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code2,
  Gamepad2,
  Globe2,
  Menu,
  Monitor,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Twitch,
  X,
} from "lucide-react";
import {
  ChatPlayMark,
  ChatScene,
  LittleBot,
  ProfilesScene,
  SafetyScene,
  Spark,
  StreamScene,
  VoteScene,
} from "./MarketingScenes";
import "./landing.css";

const faq = [
  {
    q: "Can I try it without an OpenAI API key?",
    a: "Absolutely. The built-in local parser understands explicit moves like “go right” and “jump twice.” Start in the playground with no API key. Add your own OpenAI key in Settings whenever you want broader natural-language parsing.",
  },
  {
    q: "How does my Twitch chat control the game?",
    a: "Connect a Twitch app client ID, a matching user access token with user:read:chat, and your channel in the studio. ChatPlay receives messages through EventSub, parses the move, checks your safety rules, then votes on or approves the action before sending it to your game.",
  },
  {
    q: "Does ChatPlay work with every game?",
    a: "ChatPlay supports sequential keyboard controls on compatible Windows games. Profiles define allowed keys and timing. Some games reject synthetic inputs or need controls that aren’t supported yet. Always test your actual game before streaming. Mouse, gamepad, simultaneous key combinations, and console input are not supported in this release.",
  },
  {
    q: "What do I need to run it?",
    a: "Windows 10 or 11 and Node.js 22.12 or newer for native game control. Download the project, extract the ZIP, and run Start ChatPlay.cmd. Your first dependency installation needs an internet connection. The local playground and studio also work on other operating systems.",
  },
  {
    q: "Am I always in control?",
    a: "Yes. Choose democracy, anarchy within cooldowns, or approval for every move. Set allowed keys, maximum durations, and per-viewer limits. Windows inputs only execute while the chosen game is in the foreground. Press F8 to disarm the bridge and cancel pending moves; resuming needs an explicit new session.",
  },
];
const navigation = [
  { label: "Download", href: "#download" },
  {
    label: "Features",
    links: [
      {
        title: "Chat becomes gameplay",
        description: "Plain words. Shared intent.",
        href: "#features",
        icon: <Sparkles />,
      },
      {
        title: "Made for your stream",
        description: "Bring live decisions into OBS.",
        href: "#stream",
        icon: <Monitor />,
      },
      {
        title: "Choose your game",
        description: "Controls for your next adventure.",
        href: "#games",
        icon: <Gamepad2 />,
      },
    ],
  },
  { label: "How it works", href: "#how-it-works" },
  {
    label: "Safety",
    links: [
      {
        title: "Your rules, always",
        description: "Bounded moves and a big stop button.",
        href: "#safety",
        icon: <ShieldCheck />,
      },
      {
        title: "Open safety settings",
        description: "Set the boundaries in your studio.",
        href: "/studio?view=settings",
        icon: <Code2 />,
      },
    ],
  },
  {
    label: "Resources",
    links: [
      {
        title: "Getting started",
        description: "Everything you need for player two.",
        href: "#faq",
        icon: <Play />,
      },
      {
        title: "Game profiles",
        description: "Make a control scheme your own.",
        href: "/studio?view=profiles",
        icon: <Gamepad2 />,
      },
      {
        title: "Codex x TwitchCon",
        description: "Built for shared live experiences.",
        href: "https://twitchcon-codex.devpost.com/",
        icon: <Twitch />,
      },
    ],
  },
];

export default function Landing() {
  const [downloadReady, setDownloadReady] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const check = async () => {
      try {
        const response = await fetch("/download/availability", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw Error("Availability endpoint unavailable");
        const availability = await response.json();
        if (typeof availability.windows !== "boolean")
          throw Error("Older server");
        setDownloadReady(availability.windows);
      } catch {
        if (controller.signal.aborted) return;
        // Existing running releases predate the availability endpoint.
        try {
          const response = await fetch("/download/windows", {
            method: "HEAD",
            cache: "no-store",
            signal: controller.signal,
          });
          setDownloadReady(
            response.ok &&
              !!response.headers
                .get("content-type")
                ?.includes("application/zip"),
          );
        } catch {
          /* Keep download links hidden when the server is offline. */
        }
      }
    };
    void check();
    return () => controller.abort();
  }, []);
  const [menu, setMenu] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [paused, setPaused] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [how, setHow] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const oldFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const header = root.current?.querySelector(".lp-header");
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        header?.classList.toggle("scrolled", scrollY > 60);
        frame = 0;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    document.body.classList.add("marketing-page");
    document.title = "ChatPlay AI — Your chat. The controller.";
    return () => document.body.classList.remove("marketing-page");
  }, []);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    node
      .querySelectorAll("[data-reveal]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setPaused(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!how) return;
    oldFocus.current = document.activeElement as HTMLElement;
    const dialog =
      document.querySelector<HTMLDialogElement>(".lp-start-dialog");
    dialog?.showModal();
    return () => {
      dialog?.close();
      oldFocus.current?.focus();
    };
  }, [how]);
  useEffect(() => {
    const dismiss = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setMobile(false);
        setHow(false);
      }
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, []);
  const closeMenus = () => {
    setMenu(null);
    setMobile(false);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (paused || !art.current || e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    art.current.style.setProperty(
      "--pointer-x",
      `${(e.clientX - rect.left - rect.width / 2) / 55}px`,
    );
    art.current.style.setProperty(
      "--pointer-y",
      `${(e.clientY - rect.top - rect.height / 2) / 65}px`,
    );
  };
  return (
    <div
      className={`marketing ${paused ? "motion-paused" : ""}`}
      ref={root}
      onClick={() => {
        if (menu) setMenu(null);
      }}
    >
      <a className="lp-skip" href="#main-content">
        Skip to main content
      </a>
      <header className="lp-header">
        <a href="/" aria-label="ChatPlay home">
          <ChatPlayMark />
        </a>
        <nav
          className={mobile ? "mobile-open" : ""}
          aria-label="Website navigation"
          onClick={(e) => e.stopPropagation()}
        >
          {navigation.map((item) =>
            item.links ? (
              <div className="lp-nav-dropdown" key={item.label}>
                <button
                  aria-expanded={menu === item.label}
                  aria-controls={`menu-${item.label.toLowerCase()}`}
                  onClick={() =>
                    setMenu(menu === item.label ? null : item.label)
                  }
                >
                  {item.label}
                  <ChevronDown size={14} />
                </button>
                <div
                  id={`menu-${item.label.toLowerCase()}`}
                  className={`lp-dropdown ${menu === item.label ? "open" : ""}`}
                >
                  {item.links.map((link) => (
                    <a key={link.title} href={link.href} onClick={closeMenus}>
                      {link.icon}
                      <span>
                        <strong>{link.title}</strong>
                        <small>{link.description}</small>
                      </span>
                      <ArrowUpRight size={17} />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <a href={item.href} onClick={closeMenus} key={item.label}>
                {item.label}
              </a>
            ),
          )}
        </nav>
        <div className="lp-header-actions">
          <a className="lp-login" href="/studio">
            Open studio
          </a>
          <button
            className="lp-mobile-toggle"
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main-content" className="lp-main">
        <section
          className="lp-hero"
          aria-labelledby="hero-heading"
          onPointerMove={onPointerMove}
          onPointerLeave={() => {
            art.current?.style.setProperty("--pointer-x", "0px");
            art.current?.style.setProperty("--pointer-y", "0px");
          }}
        >
          <div className="lp-starfield" aria-hidden="true">
            {Array.from({ length: 47 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: `${(i * 37 + 7) % 100}%`,
                  top: `${(i * 23 + 11) % 100}%`,
                  width: i % 7 === 0 ? 6 : 3,
                  height: i % 7 === 0 ? 6 : 3,
                  animationDelay: `${i % 8}s`,
                  opacity: 0.15 + (i % 5) * 0.1,
                }}
              />
            ))}
            <Spark className="sky-spark one" />
            <Spark className="sky-spark two" />
            <Spark className="sky-spark three" />
          </div>
          <div className="lp-hero-inner">
            <div className="lp-hero-copy">
              <h1 id="hero-heading">
                <span>YOUR CHAT.</span>
                <span>YOUR GAME.</span>
                <span>TOTAL CHAOS.</span>
              </h1>
              <p>
                Turn your Twitch chat into your next player two. Let viewers
                call the moves, vote on what happens next, and make every stream
                a shared adventure.
              </p>
            </div>
            <div className="lp-hero-art" ref={art}>
              <img
                src="/images/chatplay-world.png"
                width="1536"
                height="1024"
                fetchPriority="high"
                alt="A colorful gaming monitor surrounded by friendly mint and lavender robots, a controller, and a handheld, all ready to play together."
              />
              <div className="lp-floating-chip">
                <span>
                  <Twitch size={16} />
                </span>
                <div>
                  <b>chat has entered the game</b>
                  <small>and brought a few ideas.</small>
                </div>
                <span className="lp-green-dot" />
              </div>
            </div>
          </div>
          <div className="lp-hero-ctas">
            {downloadReady && (
              <a className="lp-button white" href="/download/windows">
                <ArrowDownToLine size={23} /> Download for Windows
              </a>
            )}
            <a className="lp-button blurple" href="/studio">
              Open ChatPlay in your browser
              <ArrowUpRight size={19} />
            </a>
          </div>
          <p className="lp-requirements">
            Windows 10/11 · Node.js 22.12+ · No API key needed to get started
          </p>
          <a
            className="lp-scroll-hint"
            href="#features"
            aria-label="Explore ChatPlay features"
          >
            <ArrowDown size={19} />
          </a>
        </section>
        <div className="lp-features">
          <section
            id="features"
            className="lp-feature feature-chat"
            data-reveal
          >
            <LittleBot className="perched-bot" />
            <div className="lp-feature-scene chat-stage">
              <ChatScene paused={paused} />
            </div>
            <div className="lp-feature-copy">
              <h2>
                MAKE YOUR
                <br /> CHAT PART
                <br /> OF THE GAME
              </h2>
              <p>
                “Go left.” “Hop.” “Jump twice.” Your community already has
                plenty to say. ChatPlay turns their words into game moves, and
                groups the same ideas into one shared intent.
              </p>
              <a href="/studio">
                Give chat a turn <ArrowRight size={18} />
              </a>
            </div>
          </section>
          <section
            id="stream"
            className="lp-feature feature-stream reverse"
            data-reveal
          >
            <div className="lp-feature-scene stream-stage">
              <StreamScene />
            </div>
            <div className="lp-feature-copy">
              <h2>
                FEELS LIKE
                <br /> YOU’RE ALL IN
                <br /> THE SAME ROOM
              </h2>
              <p>
                Every vote. Every move. Every “we meant to do that.” Bring the
                decisions into your stream with a live OBS overlay that makes
                the whole adventure fun to watch.
              </p>
              <a href="/studio?view=overlay">
                Meet your stream overlay <ArrowRight size={18} />
              </a>
            </div>
            <Spark className="feature-edge-spark" />
          </section>
          <section
            id="how-it-works"
            className="lp-feature feature-vote"
            data-reveal
          >
            <div className="lp-feature-scene vote-stage">
              <VoteScene />
            </div>
            <div className="lp-feature-copy">
              <h2>
                A LITTLE
                <br /> DEMOCRACY.
                <br /> A LITTLE
                <br /> ANARCHY.
              </h2>
              <p>
                Let the most popular move win. Let chat loose within your
                limits. Or give every move your personal stamp of approval.
                Different vibes. Same player two.
              </p>
              <button className="lp-inline-link" onClick={() => setHow(true)}>
                Find your community’s mode <ArrowRight size={18} />
              </button>
            </div>
          </section>
        </div>
        <div className="lp-marquee" aria-label="Chat. Play. Vote. Repeat.">
          <div aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i}>
                CHAT
                <Spark />
                PLAY
                <Spark />
                VOTE
                <Spark />
                REPEAT
                <Spark />
              </span>
            ))}
          </div>
        </div>
        <div className="lp-features second-half">
          <section
            id="safety"
            className="lp-feature feature-safety reverse"
            data-reveal
          >
            <div className="lp-feature-scene safety-stage">
              <SafetyScene />
            </div>
            <div className="lp-feature-copy">
              <h2>
                BIG CHAT
                <br /> ENERGY.
                <br /> YOUR RULES.
                <br /> ALWAYS.
              </h2>
              <p>
                A little chaos is part of the fun. You choose the allowed keys,
                set the cooldowns, and keep the game in focus. Need the controls
                back? One press of F8 stops the show.
              </p>
              <a href="/studio?view=settings">
                Set your boundaries <ArrowRight size={18} />
              </a>
            </div>
          </section>
          <section id="games" className="lp-feature feature-games" data-reveal>
            <div className="lp-feature-scene games-stage">
              <ProfilesScene />
            </div>
            <div className="lp-feature-copy">
              <h2>
                NEW GAME.
                <br /> SAME
                <br /> PLAYER TWO.
              </h2>
              <p>
                A platforming adventure? A community grand prix? Make a profile
                for your compatible Windows game. Choose the keys, add your own
                aliases, and let your audience discover what’s next.
              </p>
              <a href="/studio?view=profiles">
                Find your next adventure <ArrowRight size={18} />
              </a>
              <small>
                Sequential keyboard controls. Test your game before streaming.
              </small>
            </div>
          </section>
        </div>
        <section className="lp-get-started" id="download" data-reveal>
          <Spark className="download-spark one" />
          <Spark className="download-spark two" />
          <h2>
            YOUR NEXT ADVENTURE
            <br /> HAS A WHOLE CHAT
            <br /> FULL OF PLAYER TWOS.
          </h2>
          <div className="lp-download-buttons">
            {downloadReady ? (
              <a className="lp-button blurple" href="/download/windows">
                <ArrowDownToLine size={22} /> Download for Windows
              </a>
            ) : (
              <a className="lp-button blurple" href="/studio">
                Open your studio <ArrowRight size={18} />
              </a>
            )}
            <button className="lp-button outline" onClick={() => setHow(true)}>
              How do I get started?
              <ArrowRight size={18} />
            </button>
          </div>
          <p>
            Start with the playground. Connect Twitch when you’re ready.
            <br /> Add OpenAI later, if you want. You’re already invited.
          </p>
          <div className="lp-download-art">
            <img
              src="/images/chatplay-world.png"
              width="1536"
              height="1024"
              loading="lazy"
              alt="The ChatPlay crew ready for another shared adventure."
            />
          </div>
        </section>
        <section id="faq" className="lp-faq" data-reveal>
          <div>
            <span className="lp-eyebrow">BEFORE YOU PRESS PLAY</span>
            <h2>
              A FEW GOOD
              <br /> QUESTIONS.
            </h2>
            <p>Less setup. More shared moments.</p>
          </div>
          <div className="lp-faq-list">
            {faq.map((item, index) => (
              <div
                className={`lp-faq-item ${openFaq === index ? "open" : ""}`}
                key={item.q}
              >
                <h3>
                  <button
                    aria-expanded={openFaq === index}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    {item.q}
                    <span>{openFaq === index ? "−" : "+"}</span>
                  </button>
                </h3>
                <div
                  id={`faq-answer-${index}`}
                  className="lp-faq-answer"
                  inert={openFaq !== index}
                >
                  <div>
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <ChatPlayMark />
            <p>
              A shared adventure starts
              <br /> with your next message.
            </p>
            <span className="lp-footer-language">
              <Globe2 size={16} /> English <ChevronDown size={13} />
            </span>
          </div>
          <div>
            <h3>Play together</h3>
            <a href="/studio">Open the studio</a>
            {downloadReady && (
              <a href="/download/windows">Download for Windows</a>
            )}
            <a href="/studio?view=profiles">Game profiles</a>
            <a href="/studio?view=overlay">Stream overlay</a>
          </div>
          <div>
            <h3>Get to know us</h3>
            <a href="#features">How ChatPlay works</a>
            <a href="#safety">Safety & control</a>
            <a href="#faq">Getting started</a>
            <a
              href="https://twitchcon-codex.devpost.com/"
              target="_blank"
              rel="noreferrer"
            >
              Codex x TwitchCon <ArrowUpRight size={12} />
            </a>
          </div>
          <div>
            <h3>Made for your stream</h3>
            <a href="/studio?view=settings">Connect Twitch</a>
            <a href="/studio?view=settings">Add OpenAI</a>
            <a href="/studio?view=history">Session history</a>
            <button onClick={() => setHow(true)}>Installation guide</button>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} ChatPlay AI</span>
          <span>
            <ShieldCheck size={14} /> Local-first. Community-powered.
          </span>
          <button onClick={() => setPaused(!paused)} aria-pressed={paused}>
            {paused ? <Play size={13} /> : <Pause size={13} />}{" "}
            {paused ? "Play animations" : "Pause animations"}
          </button>
        </div>
        <div className="lp-footer-giant" aria-hidden="true">
          CHATPLAY
        </div>
      </footer>
      <dialog
        className="lp-start-dialog"
        onCancel={() => setHow(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setHow(false);
        }}
        aria-labelledby="start-title"
      >
        <button
          className="lp-dialog-close"
          aria-label="Close getting started guide"
          onClick={() => setHow(false)}
        >
          <X />
        </button>
        <span className="lp-dialog-icon">
          <Gamepad2 size={30} />
        </span>
        <h2 id="start-title">HELLO, PLAYER TWO.</h2>
        <p>Your first shared adventure is just a few steps away.</p>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>Make yourself at home.</h3>
              <p>
                Open the browser studio or download the ZIP. For Windows,
                extract it and run <code>Start ChatPlay.cmd</code>. Install
                Node.js 22.12+ first.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Give the playground a go.</h3>
              <p>
                Start a session, then send “go right and jump twice” in test
                chat. Or try the clearly marked sample chat. No API key
                required.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Bring everyone along.</h3>
              <p>
                Add your Twitch credentials in Settings, set a game profile, and
                add the browser-source overlay in OBS. Keep F8 nearby.
              </p>
            </div>
          </li>
        </ol>
        <a className="lp-button blurple" href="/studio">
          Open your studio
          <ArrowRight size={18} />
        </a>
      </dialog>
    </div>
  );
}
