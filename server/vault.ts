import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
export const credentialFields = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "TWITCH_CLIENT_ID",
  "TWITCH_ACCESS_TOKEN",
  "TWITCH_REFRESH_TOKEN",
  "TWITCH_CLIENT_SECRET",
  "TWITCH_CHANNEL",
  "TWITCH_REWARD_ID",
] as const;
export class CredentialVault {
  file = path.resolve(
    process.env.CHATPLAY_DATA_DIR || "data",
    "credentials.dpapi",
  );
  remembered = fs.existsSync(this.file);
  transform(mode: "protect" | "unprotect", value: string): Promise<string> {
    if (process.platform !== "win32")
      return Promise.reject(
        Error(
          "Remembering credentials requires Windows. Use .env.local on this system.",
        ),
      );
    return new Promise((resolve, reject) => {
      // Invoke only fixed Windows crypto commands; do not load an unsigned
      // script or weaken the machine's script execution policy.
      const setup =
        "$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Security;$payload=[Console]::In.ReadToEnd();$entropy=[Text.Encoding]::UTF8.GetBytes('ChatPlayAI.credentials.v1');";
      const operation =
        mode === "protect"
          ? "$bytes=[Text.Encoding]::UTF8.GetBytes($payload);[Console]::Write([Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect($bytes,$entropy,[Security.Cryptography.DataProtectionScope]::CurrentUser)))"
          : "$bytes=[Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($payload),$entropy,[Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Write([Text.Encoding]::UTF8.GetString($bytes))";
      const child = spawn(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", setup + operation],
        { windowsHide: true, stdio: "pipe" },
      );
      let result = "";
      let failed = false;
      const timer = setTimeout(() => {
        child.kill();
        reject(Error("Credential protection timed out."));
      }, 10000);
      child.stdout.on("data", (b) => (result += b.toString()));
      child.stderr.on("data", () => {
        failed = true;
      });
      child.on("error", () => {
        clearTimeout(timer);
        reject(Error("Windows credential protection unavailable."));
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        code === 0 && !failed
          ? resolve(result)
          : reject(
              Error(
                "Could not protect or restore credentials for this Windows user.",
              ),
            );
      });
      child.stdin.end(value);
    });
  }
  async save() {
    const data = Object.fromEntries(
      credentialFields
        .filter((k) => process.env[k])
        .map((k) => [k, process.env[k]]),
    );
    const encrypted = await this.transform("protect", JSON.stringify(data));
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file + ".tmp", encrypted, { mode: 0o600 });
    fs.renameSync(this.file + ".tmp", this.file);
    this.remembered = true;
  }
  async restore() {
    if (!this.remembered) return;
    const data = JSON.parse(
      await this.transform("unprotect", fs.readFileSync(this.file, "utf8")),
    );
    for (const key of credentialFields)
      if (!process.env[key] && typeof data[key] === "string")
        process.env[key] = data[key];
  }
  forget() {
    if (fs.existsSync(this.file)) fs.unlinkSync(this.file);
    this.remembered = false;
  }
}
