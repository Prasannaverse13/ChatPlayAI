import { useEffect, useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { api } from "./api";
export function UpdatePanel() {
  const [automatic, setAutomatic] = useState(
    () => localStorage.getItem("chatplay.updateChecks.v1") === "true",
  );
  const [result, setResult] = useState<{
    message: string;
    url?: string;
    available?: boolean;
    checksum?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const check = async () => {
    setBusy(true);
    try {
      setResult(await api("/updates"));
    } catch (e) {
      setResult({ message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    localStorage.setItem("chatplay.updateChecks.v1", String(automatic));
    if (!automatic) return;
    void check();
    const id = setInterval(() => void check(), 6 * 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [automatic]);
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Release updates</h2>
      </div>
      <div className="panel-body">
        <label className="option-row">
          <input
            type="checkbox"
            checked={automatic}
            onChange={(e) => setAutomatic(e.target.checked)}
          />{" "}
          Check GitHub for updates automatically while Settings is open
        </label>
        <p className="field-help">
          Update notifications are opt-in. Download the portable release, stop
          ChatPlay, then run its installer to update without replacing your
          data. Releases are not installed silently.
        </p>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => void check()}
        >
          <RotateCcw size={14} />
          {busy ? "Checking…" : "Check for updates"}
        </button>
        {result && (
          <div className="notice" style={{ marginTop: 16 }}>
            <div>
              <p>{result.message}</p>
              {result.available && result.url && (
                <a href={result.url} target="_blank" rel="noreferrer">
                  Download verified release <ArrowUpRight size={14} />
                </a>
              )}
              {result.checksum && (
                <p style={{ fontSize: 9, overflowWrap: "anywhere" }}>
                  GitHub digest: {result.checksum}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
