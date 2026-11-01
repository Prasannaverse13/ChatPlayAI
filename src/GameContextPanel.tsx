import { useState } from "react";
import { Camera, Eye, ShieldCheck } from "lucide-react";
import { api } from "./api";
export function GameContextPanel({
  disabled,
  notify,
}: {
  disabled: boolean;
  notify: (s: string, error?: boolean) => void;
}) {
  const [capture, setCapture] = useState<{
    image: string;
    expiresAt: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>
          <Camera size={17} /> Optional game context
        </h2>
      </div>
      <div className="panel-body">
        <p className="field-help">
          Pause and select Windows input first. After capture starts, switch to
          your chosen game within three seconds. Only that foreground window is
          captured. Nothing is sent to OpenAI until you enable it.
        </p>
        <button
          className="button secondary"
          disabled={disabled || busy}
          onClick={() => {
            setBusy(true);
            setEnabled(false);
            void api("/context/capture", {})
              .then(setCapture)
              .catch((e) => notify(e.message, true))
              .finally(() => setBusy(false));
          }}
        >
          <Camera size={14} />
          {busy ? "Switch to your game now…" : "Capture game in 3 seconds"}
        </button>
        {capture && (
          <>
            <img
              src={capture.image}
              alt="Your captured game context"
              style={{
                display: "block",
                width: "100%",
                borderRadius: 10,
                marginTop: 16,
              }}
            />
            <p className="field-help">
              Capture expires after 60 seconds. When enabled with OpenAI
              parsing, this image accompanies chat commands until it expires.
              Pausing clears it. Images are never saved to disk.
            </p>
            <button
              className="button secondary"
              disabled={disabled || busy}
              onClick={() => {
                setBusy(true);
                void api("/context/enable", { enabled: !enabled })
                  .then(() => {
                    setEnabled(!enabled);
                    notify(
                      enabled
                        ? "Screenshot context disabled."
                        : "Screenshot context enabled for 60 seconds.",
                    );
                  })
                  .catch((e) => notify(e.message, true))
                  .finally(() => setBusy(false));
              }}
            >
              {enabled ? <ShieldCheck size={14} /> : <Eye size={14} />}{" "}
              {enabled ? "Disable image sharing" : "Enable screenshot context"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
