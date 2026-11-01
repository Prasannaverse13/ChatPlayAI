import { describe, it, expect } from "vitest";
import { GamePreview } from "../server/preview";

describe.skipIf(process.platform !== "win32")("Windows game preview", () => {
  it("starts read-only capture, rejects an invalid window, and closes cleanly", async () => {
    const preview = new GamePreview();
    try {
      expect(await preview.frame("not-a-window")).toEqual({
        error: "Select your game window in Settings.",
      });
      expect(preview.child).toBeUndefined();
      await preview.frame("0");
      const deadline = Date.now() + 12000;
      while (!preview.ready && Date.now() < deadline)
        await new Promise((resolve) => setTimeout(resolve, 100));
      expect(preview.ready).toBe(true);
      const frame = await preview.frame("0");
      expect(frame.error).toBe("Select your game window in Settings.");
      expect(frame.image).toBeUndefined();
    } finally {
      preview.close();
    }
    expect(preview.ready).toBe(false);
    expect(preview.child).toBeUndefined();
  }, 20000);
});
