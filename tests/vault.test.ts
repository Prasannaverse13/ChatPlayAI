import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CredentialVault, credentialFields } from "../server/vault";

describe.skipIf(process.platform !== "win32")(
  "Windows credential storage",
  () => {
    it("encrypts, restores after restart, and forgets credentials for this user", async () => {
      const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "chatplay-vault-"),
      );
      try {
        vi.stubEnv("CHATPLAY_DATA_DIR", directory);
        for (const key of credentialFields) vi.stubEnv(key, "");
        vi.stubEnv("OPENAI_API_KEY", "dummy-vault-roundtrip");
        vi.stubEnv("TWITCH_CHANNEL", "test_channel");
        const vault = new CredentialVault();
        await vault.save();
        expect(fs.readFileSync(vault.file, "utf8")).not.toContain(
          "dummy-vault-roundtrip",
        );
        vi.stubEnv("OPENAI_API_KEY", "");
        vi.stubEnv("TWITCH_CHANNEL", "");
        const restarted = new CredentialVault();
        await restarted.restore();
        expect(process.env.OPENAI_API_KEY).toBe("dummy-vault-roundtrip");
        expect(process.env.TWITCH_CHANNEL).toBe("test_channel");
        restarted.forget();
        expect(fs.existsSync(restarted.file)).toBe(false);
        expect(restarted.remembered).toBe(false);
      } finally {
        vi.unstubAllEnvs();
        fs.rmSync(directory, { recursive: true, force: true });
      }
    }, 25000);
  },
);
