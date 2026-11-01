import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
export type PreviewFrame = {
  title?: string;
  width?: number;
  height?: number;
  image?: string;
  error?: string;
};
// Read-only live view of the selected game window. It never sends input.
export class GamePreview {
  child?: ChildProcessWithoutNullStreams;
  ready = false;
  waiting?: {
    resolve: (f: PreviewFrame) => void;
    timer: ReturnType<typeof setTimeout>;
  };
  available = process.platform === "win32";
  private start() {
    if (!this.available || this.child) return;
    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        path.resolve("native/preview.ps1"),
      ],
      { windowsHide: true, stdio: "pipe" },
    );
    this.child = child;
    const reset = () => {
      if (this.child !== child) return;
      this.child = undefined;
      this.ready = false;
      this.finish({ error: "Live view is restarting." });
    };
    child.on("error", reset);
    child.on("exit", reset);
    child.stderr.on("data", () => {});
    createInterface({ input: child.stdout }).on("line", (line) => {
      if (this.child !== child) return;
      try {
        const m = JSON.parse(line);
        if (m.type === "ready") this.ready = true;
        else this.finish(m);
      } catch {
        /* ignore non-protocol output */
      }
    });
  }
  private finish(frame: PreviewFrame) {
    if (!this.waiting) return;
    clearTimeout(this.waiting.timer);
    const { resolve } = this.waiting;
    this.waiting = undefined;
    resolve(frame);
  }
  frame(target: string): Promise<PreviewFrame> {
    if (!this.available)
      return Promise.resolve({
        error: "Live game view needs Windows.",
      });
    if (!/^\d{1,20}$/.test(target))
      return Promise.resolve({ error: "Select your game window in Settings." });
    this.start();
    if (!this.ready || !this.child)
      return Promise.resolve({ error: "Live view is starting." });
    if (this.waiting) return Promise.resolve({ error: "Live view is busy." });
    return new Promise((resolve) => {
      const timer = setTimeout(
        () => this.finish({ error: "Live view timed out." }),
        4000,
      );
      this.waiting = { resolve, timer };
      this.child!.stdin.write(target + "\n");
    });
  }
  close() {
    this.finish({ error: "Closed." });
    this.child?.stdin.end();
    this.child?.kill();
    this.child = undefined;
    this.ready = false;
  }
}
