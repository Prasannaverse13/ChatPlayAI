import { useEffect, useState } from "react";
import { ArrowUpRight, Check, ShieldCheck, Twitch } from "lucide-react";
import { api } from "./api";
export function ConnectionTools({
  client,
  channel,
  disabled,
  notify,
}: {
  client: string;
  channel: string;
  disabled: boolean;
  notify: (s: string, error?: boolean) => void;
}) {
  const [login, setLogin] = useState<{
    id: string;
    url: string;
    userCode: string;
    intervalMs: number;
    expiresAt: number;
  } | null>(null);
  const [remember, setRemember] = useState(false);
  const [rewards, setRewards] = useState(false);
  const [working, setWorking] = useState(false);
  const [rewardId, setRewardId] = useState("");
  useEffect(() => {
    void api("/credentials/storage")
      .then((s) => setRemember(s.remembered))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!login) return;
    let alive = true,
      busy = false;
    const id = setInterval(async () => {
      if (busy || !alive) return;
      if (Date.now() > login.expiresAt) {
        setLogin(null);
        notify("Twitch sign-in expired. Try again.", true);
        return;
      }
      busy = true;
      try {
        const result = await api("/twitch/login/poll", { id: login.id });
        if (alive && result.status === "complete") {
          setLogin(null);
          notify("Signed into Twitch. Chat is connecting.");
        }
      } catch (e) {
        if (alive) {
          setLogin(null);
          notify((e as Error).message, true);
        }
      } finally {
        busy = false;
      }
    }, login.intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [login]);
  return (
    <div className="connection-tools">
      <h3>
        <Twitch size={16} /> Sign in with Twitch
      </h3>
      <p className="field-help">
        Use a Twitch Public client ID and your channel above, then authorize in
        Twitch. Device sign-in includes refreshable credentials; manual tokens
        remain available.
      </p>
      <label className="option-row">
        <input
          type="checkbox"
          checked={remember}
          disabled={disabled || !!login}
          onChange={(e) => setRemember(e.target.checked)}
        />{" "}
        Remember credentials on this Windows account (encrypted)
      </label>
      <label className="option-row">
        <input
          type="checkbox"
          checked={rewards}
          disabled={disabled || !!login}
          onChange={(e) => setRewards(e.target.checked)}
        />{" "}
        Request channel-point reward permission
      </label>
      {login ? (
        <div className="notice">
          <div>
            <strong>Your Twitch code: {login.userCode}</strong>
            <p>
              Complete authorization, then return here. This page checks
              automatically.
            </p>
            <a href={login.url} target="_blank" rel="noreferrer">
              Authorize on Twitch <ArrowUpRight size={13} />
            </a>
            <button
              className="text-button"
              onClick={() => {
                setLogin(null);
                void api("/twitch/login/cancel", {});
              }}
            >
              Cancel sign-in
            </button>
          </div>
        </div>
      ) : (
        <button
          className="button twitch-button"
          disabled={disabled || working || !client.trim() || !channel.trim()}
          onClick={() => {
            setWorking(true);
            void api("/twitch/login/start", {
              client: client.trim(),
              channel: channel.trim(),
              remember,
              rewards,
            })
              .then(setLogin)
              .catch((e) => notify(e.message, true))
              .finally(() => setWorking(false));
          }}
        >
          <Twitch size={15} />
          {working ? "Starting sign-in…" : "Get Twitch sign-in code"}
        </button>
      )}
      <div className="row" style={{ marginTop: 14 }}>
        <button
          className="button secondary"
          disabled={disabled || working}
          onClick={() => {
            setWorking(true);
            void api("/credentials/remember", { remember })
              .then(() =>
                notify(
                  remember
                    ? "Credentials encrypted for this Windows user."
                    : "Saved credentials removed.",
                ),
              )
              .catch((e) => notify(e.message, true))
              .finally(() => setWorking(false));
          }}
        >
          <ShieldCheck size={14} />{" "}
          {remember
            ? "Remember current credentials"
            : "Forget saved credentials"}
        </button>
      </div>
      <div className="section-rule" />
      <h3>Channel-point priority moves</h3>
      <p className="field-help">
        Optional: create a Twitch custom reward requiring viewer input. Paste
        its reward ID, then reconnect Twitch. Redemptions skip voting but still
        respect cooldowns, profile checks, and approval mode. Requires an
        eligible channel and channel:read:redemptions.
      </p>
      <label className="input-label">
        Reward ID
        <input
          value={rewardId}
          onChange={(e) => setRewardId(e.target.value)}
          placeholder="Custom reward UUID · blank disables"
        />
      </label>
      <button
        className="button secondary"
        disabled={disabled || working}
        onClick={() => {
          setWorking(true);
          void api("/twitch/reward", { id: rewardId.trim() })
            .then(() =>
              notify(
                "Reward setting saved. Reconnect Twitch to update subscriptions.",
              ),
            )
            .catch((e) => notify(e.message, true))
            .finally(() => setWorking(false));
        }}
      >
        <Check size={14} /> Save reward
      </button>
    </div>
  );
}
