import { useState } from "react";
import { Gamepad2, Plus, Trash2, X } from "lucide-react";
import {
  SAFE_KEYS,
  profileSchema,
  type Profile,
  type Action,
} from "../shared/types";
import { useDialog } from "./useDialog";
export function ProfileEditor({
  profile,
  busy,
  active,
  save,
  remove,
  close,
}: {
  profile: Profile;
  busy: boolean;
  active: boolean;
  save: (p: Profile) => Promise<boolean>;
  remove: () => Promise<boolean>;
  close: () => void;
}) {
  const [draft, setDraft] = useState(structuredClone(profile));
  const [advanced, setAdvanced] = useState(false);
  const [raw, setRaw] = useState(JSON.stringify(profile, null, 2));
  const [error, setError] = useState("");
  const [alias, setAlias] = useState("");
  const [aliasKey, setAliasKey] = useState<Action["key"]>(
    profile.allowedKeys[0],
  );
  useDialog(true, close);
  const toggleKey = (key: Action["key"]) => {
    const allowed = draft.allowedKeys.includes(key)
      ? draft.allowedKeys.filter((k) => k !== key)
      : [...draft.allowedKeys, key];
    setDraft({
      ...draft,
      allowedKeys: allowed,
      aliases: Object.fromEntries(
        Object.entries(draft.aliases).filter(([, v]) => allowed.includes(v)),
      ),
    });
  };
  const submit = async () => {
    try {
      const p = advanced ? JSON.parse(raw) : draft;
      if (p.id !== profile.id) throw Error("Profile ID cannot be changed.");
      if (await save(p)) close();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <div className="modal-backdrop">
      <section
        className="modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-editor-title"
      >
        <div className="panel-header">
          <h2 id="profile-editor-title">
            <Gamepad2 size={17} /> Edit game profile
          </h2>
          <button
            className="icon-button"
            type="button"
            aria-label="Close profile editor"
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>
        <form
          className="panel-body"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="section-toolbar">
            <span className="subtle">
              Controls for your next shared adventure.
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                if (advanced) {
                  try {
                    setDraft(profileSchema.parse(JSON.parse(raw)));
                    setAdvanced(false);
                    setError("");
                  } catch {
                    setError(
                      "Fix invalid JSON before switching to the visual editor.",
                    );
                  }
                } else {
                  setRaw(JSON.stringify(draft, null, 2));
                  setAdvanced(true);
                }
              }}
            >
              {advanced ? "Visual editor" : "Advanced JSON"}
            </button>
          </div>
          {advanced ? (
            <textarea
              className="json-editor"
              aria-label="Profile JSON"
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setError("");
              }}
              spellCheck={false}
            />
          ) : (
            <>
              <div className="form-grid">
                <label>
                  Profile name
                  <input
                    aria-label="Profile name"
                    required
                    maxLength={60}
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Game genre
                  <input
                    aria-label="Game genre"
                    maxLength={40}
                    value={draft.genre}
                    onChange={(e) =>
                      setDraft({ ...draft, genre: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="input-label">
                Description
                <input
                  maxLength={240}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </label>
              <fieldset className="key-picker">
                <legend>Allowed keys</legend>
                {SAFE_KEYS.map((k) => (
                  <button
                    type="button"
                    key={k}
                    aria-pressed={draft.allowedKeys.includes(k)}
                    className={draft.allowedKeys.includes(k) ? "selected" : ""}
                    onClick={() => toggleKey(k)}
                  >
                    {k.toUpperCase()}
                  </button>
                ))}
              </fieldset>
              <p className="field-help">
                Only selected keys can reach the game. System keys cannot be
                added.
              </p>
              <div className="form-grid timing-grid">
                {(
                  [
                    {
                      key: "voteWindowMs",
                      name: "Vote window (ms)",
                      min: 1500,
                      max: 15000,
                    },
                    {
                      key: "userCooldownMs",
                      name: "Viewer cooldown (ms)",
                      min: 500,
                      max: 30000,
                    },
                    {
                      key: "globalCooldownMs",
                      name: "Global cooldown (ms)",
                      min: 100,
                      max: 5000,
                    },
                    {
                      key: "maxDurationMs",
                      name: "Maximum key hold (ms)",
                      min: 40,
                      max: 1000,
                    },
                    {
                      key: "maxRepeat",
                      name: "Maximum repeats",
                      min: 1,
                      max: 3,
                    },
                  ] as const
                ).map((f) => (
                  <label key={f.key}>
                    {f.name}
                    <input
                      type="number"
                      aria-label={f.name}
                      required
                      min={f.min}
                      max={f.max}
                      value={draft[f.key]}
                      onChange={(e) =>
                        setDraft({ ...draft, [f.key]: Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="alias-heading">
                <h3>Command aliases</h3>
                <span className="subtle">“hop” becomes Space</span>
              </div>
              <div className="alias-list">
                {Object.entries(draft.aliases).map(([name, key]) => (
                  <div key={name}>
                    <span>{name}</span>
                    <span>→</span>
                    <kbd>{key.toUpperCase()}</kbd>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove alias ${name}`}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          aliases: Object.fromEntries(
                            Object.entries(draft.aliases).filter(
                              ([n]) => n !== name,
                            ),
                          ),
                        })
                      }
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="alias-add">
                <input
                  aria-label="New command alias"
                  pattern="[a-zA-Z0-9]+"
                  value={alias}
                  maxLength={30}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. hop"
                />
                <select
                  aria-label="Alias target key"
                  value={aliasKey}
                  onChange={(e) => setAliasKey(e.target.value as Action["key"])}
                >
                  {draft.allowedKeys.map((k) => (
                    <option key={k} value={k}>
                      {k.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="button secondary"
                  disabled={
                    !/^[a-z0-9]+$/i.test(alias.trim()) ||
                    !draft.allowedKeys.length
                  }
                  onClick={() => {
                    const key = draft.allowedKeys.includes(aliasKey)
                      ? aliasKey
                      : draft.allowedKeys[0];
                    setDraft({
                      ...draft,
                      aliases: {
                        ...draft.aliases,
                        [alias.toLowerCase().trim()]: key,
                      },
                    });
                    setAlias("");
                  }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button
              type="button"
              className="button danger-ghost"
              disabled={busy || active}
              onClick={() =>
                void remove().then((ok) => {
                  if (ok) close();
                })
              }
            >
              <Trash2 size={14} /> Delete
            </button>
            <button type="button" className="button secondary" onClick={close}>
              Cancel
            </button>
            <button className="button primary" disabled={busy}>
              Save profile
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
