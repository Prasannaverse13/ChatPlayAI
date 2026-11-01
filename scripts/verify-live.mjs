import fs from "node:fs";
const base = process.env.CHATPLAY_URL || "http://127.0.0.1:4310";
const report = { at: new Date().toISOString(), openai: [], status: "pending" };
try {
  const response = await fetch(base + "/api/bootstrap");
  const bootstrap = await response.json();
  if (!bootstrap.state.credentials.openai) {
    report.status = "blocked";
    report.reason =
      "OPENAI_API_KEY is not configured in the running server. Add .env.local and restart, or enter your key in Settings.";
    console.log(report.reason);
    process.exitCode = 2;
  } else {
    const headers = {
      "Content-Type": "application/json",
      Cookie: response.headers.get("set-cookie").split(";")[0],
      "X-ChatPlay-CSRF": bootstrap.csrf,
    };
    for (const text of [
      "Please move the character right a little",
      "hop twice",
      "I cannot jump",
    ]) {
      const r = await fetch(base + "/api/diagnostics/openai", {
        method: "POST",
        headers,
        body: JSON.stringify({ text }),
      });
      const data = await r.json();
      report.openai.push({ text, status: r.status, ...data });
    }
    report.status =
      report.openai[0]?.parsed?.actions?.[0]?.key === "right" &&
      report.openai[1]?.parsed?.actions?.[0]?.repeat === 2 &&
      !report.openai[2]?.parsed?.actions?.length
        ? "passed"
        : "failed";
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== "passed") process.exitCode = 1;
  }
} catch (e) {
  report.status = "blocked";
  report.reason = e.message;
  console.error(e.message);
  process.exitCode = 2;
} finally {
  fs.mkdirSync("artifacts/verification", { recursive: true });
  fs.writeFileSync(
    "artifacts/verification/openai-live.json",
    JSON.stringify(report, null, 2),
  );
}
