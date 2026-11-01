import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Action } from "../shared/types.js";
export class NativeBridge {
  child?: ChildProcessWithoutNullStreams;
  ready = false;
  error?: string;
  available = process.platform === "win32";
  pending = new Map<
    string,
    {
      resolve: (v: any) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  heartbeat?: ReturnType<typeof setInterval>;
  constructor(
    private onPanic: () => void,
    private onChange: () => void,
  ) {}
  start() {
    if (!this.available) return;
    this.child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        path.resolve("native/bridge.ps1"),
      ],
      { windowsHide: true, stdio: "pipe" },
    );
    const fail = () => {
      this.ready = false;
      this.error =
        "Windows input bridge unavailable. Restart ChatPlay to retry.";
      for (const p of this.pending.values()) {
        clearTimeout(p.timer);
        p.reject(Error(this.error));
      }
      this.pending.clear();
      this.onPanic();
      this.onChange();
    };
    this.child.on("error", fail);
    this.child.on("exit", fail);
    this.child.stderr.on("data", () => {
      this.error =
        "Windows bridge failed to initialize. Check PowerShell and .NET availability.";
      this.onChange();
    });
    createInterface({ input: this.child.stdout }).on("line", (line) => {
      try {
        const m = JSON.parse(line);
        if (m.type === "ready") {
          this.ready = true;
          this.error = undefined;
          this.onChange();
        } else if (m.type === "panic") this.onPanic();
        else if (m.id) {
          const p = this.pending.get(m.id);
          if (p) {
            clearTimeout(p.timer);
            this.pending.delete(m.id);
            m.error ? p.reject(Error(m.error)) : p.resolve(m.result);
          }
        }
      } catch {
        /* native diagnostics are not protocol messages */
      }
    });
    this.heartbeat = setInterval(
      () =>
        this.child?.stdin.writable &&
        this.child.stdin.write(JSON.stringify({ type: "heartbeat" }) + "\n"),
      500,
    );
  }
  request(type: string, data: object = {}): Promise<any> {
    if (!this.ready || !this.child)
      return Promise.reject(Error("Windows bridge is not ready."));
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(Error("Windows bridge timed out."));
      }, 6500);
      this.pending.set(id, { resolve, reject, timer });
      this.child!.stdin.write(JSON.stringify({ type, id, ...data }) + "\n");
    });
  }
  windows() {
    return this.request("windows");
  }
  execute(actions: Action[], target: string) {
    return this.request("execute", { actions, target });
  }
  arm() {
    if (this.child?.stdin.writable)
      this.child.stdin.write(JSON.stringify({ type: "arm" }) + "\n");
  }
  cancel() {
    if (this.child?.stdin.writable)
      this.child.stdin.write(JSON.stringify({ type: "cancel" }) + "\n");
  }
  close() {
    this.cancel();
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.child?.stdin.end();
  }
}
