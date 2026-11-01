import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    // Release staging folders contain source copies, never run those as another suite.
    include: ["tests/**/*.test.ts"],
    testTimeout: 10000,
  },
});
