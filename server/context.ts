import { spawn } from "node:child_process";
import path from "node:path";
export class GameContext {
  image?: string;
  expires = 0;
  enabled = false;
  clear() {
    this.image = undefined;
    this.expires = 0;
    this.enabled = false;
  }
  get current() {
    return this.enabled && Date.now() < this.expires ? this.image : undefined;
  }
  async capture(target: string) {
    if (process.platform !== "win32" || !/^\d{1,20}$/.test(target))
      throw Error("Select a Windows game window first.");
    this.clear();
    const image = await new Promise<string>((resolve, reject) => {
      const child = spawn(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-File",
          path.resolve("native/capture.ps1"),
          "-WindowId",
          target,
        ],
        { windowsHide: true, stdio: "pipe" },
      );
      let data = "";
      const timeout = setTimeout(() => {
        child.kill();
        reject(Error("Game capture timed out."));
      }, 10000);
      child.stdout.on("data", (chunk) => {
        data += chunk.toString();
        if (data.length > 4_000_000) {
          child.kill();
          reject(Error("Capture is too large."));
        }
      });
      child.stderr.on("data", () => {});
      child.on("error", () => {
        clearTimeout(timeout);
        reject(Error("Windows capture unavailable."));
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        code === 0 && data.startsWith("data:image/jpeg;base64,")
          ? resolve(data)
          : reject(Error("Focus the selected game and try capture again."));
      });
      child.stdin.end();
    });
    this.image = image;
    this.expires = Date.now() + 60000;
    return { image, expiresAt: this.expires };
  }
}
