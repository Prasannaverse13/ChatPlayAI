import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
// Deliberately uses HWND 0: this verifies native rejection without injecting a key.
if (process.platform !== "win32") {
  console.log("SKIP: Windows is required.");
  process.exit(0);
}
const child = spawn(
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
const heartbeat = setInterval(
  () => child.stdin.write('{"type":"heartbeat"}\n'),
  500,
);
const timeout = setTimeout(() => finish("Native bridge timed out."), 20000);
let success = false;
function finish(error) {
  clearTimeout(timeout);
  clearInterval(heartbeat);
  child.stdin.end();
  if (error) {
    console.error(error);
    process.exitCode = 1;
  } else {
    success = true;
    console.log(
      "PASS: Native bridge starts, enumerates windows, and rejects invalid targets without sending input.",
    );
  }
}
child.stderr.on("data", (b) => console.error(b.toString()));
child.on("error", (e) => finish(e.message));
createInterface({ input: child.stdout }).on("line", (line) => {
  try {
    const m = JSON.parse(line);
    if (m.type === "ready")
      child.stdin.write('{"type":"windows","id":"list"}\n');
    if (m.id === "list") {
      if (!Array.isArray(m.result)) return finish("Invalid window list.");
      console.log(`Windows enumerated: ${m.result.length}`);
      child.stdin.write('{"type":"arm"}\n');
      child.stdin.write(
        JSON.stringify({
          type: "execute",
          id: "reject",
          target: "0",
          actions: [{ key: "space", durationMs: 40, repeat: 1 }],
        }) + "\n",
      );
    }
    if (m.id === "reject") {
      if (!m.error?.includes("foreground window"))
        finish(`Unexpected native validation result: ${m.error}`);
      else finish();
    }
  } catch {
    console.log(line);
  }
});
child.on("exit", () => {
  if (!success && process.exitCode !== 1) finish("Bridge exited unexpectedly.");
});
