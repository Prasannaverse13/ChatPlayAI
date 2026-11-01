// Fails when the distributable source looks like it contains live credentials.
// Values are never printed, only the file name and the kind of problem.
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const roots = [
  "server",
  "shared",
  "src",
  "tests",
  "docs",
  "scripts",
  "native",
  ".github",
];
const secretNames =
  "OPENAI_API_KEY|TWITCH_ACCESS_TOKEN|TWITCH_REFRESH_TOKEN|TWITCH_CLIENT_SECRET|GITHUB_TOKEN";

let files = [];
try {
  files = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    },
  )
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
} catch {}
if (!files.length) {
  files = [
    ".env.example",
    "README.md",
    "package.json",
    "Install ChatPlay.ps1",
    "Start ChatPlay.cmd",
  ];
  for (const root of roots)
    if (fs.existsSync(root))
      for (const entry of fs.readdirSync(root, {
        recursive: true,
        withFileTypes: true,
      }))
        if (entry.isFile()) files.push(entry.parentPath + "/" + entry.name);
}

// Token shapes. The lookbehind stops ordinary words such as "desk-..." or "task-..." from matching.
const tokenShapes = [
  /(?<![A-Za-z0-9])sk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{24,}/,
  /(?<![A-Za-z0-9])gh[pousr]_[A-Za-z0-9]{24,}/,
  /(?<![A-Za-z0-9])github_pat_[A-Za-z0-9_]{40,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
// NAME=value lines holding something that looks real (long, and not an obvious placeholder).
const assignment = new RegExp(
  `^[ \\t]*(?:export[ \\t]+|\\$env:)?(?:${secretNames})[ \\t]*=[ \\t]*["']?([^\\s"'#]+)`,
  "gm",
);
const placeholder =
  /^(?:your[-_a-z]*|<.*>|x+|\.\.\.|changeme|example|placeholder|test-key)$/i;
const localOnly =
  /(?:^|\/)(?:\.env(?:\..+)?|env\.local|credentials\.dpapi|overlay-token|audit\.jsonl(?:\.\d+)?|studio\.json)$/;

const problems = [];
for (const file of files) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
  if (localOnly.test(file) && !file.endsWith(".env.example")) {
    problems.push(
      `${file}: local credential or session file must not be tracked`,
    );
    continue;
  }
  if (
    !/\.(?:md|json|ts|tsx|js|mjs|cjs|ps1|cmd|bat|yml|yaml|example|pem|key|txt|html)$/.test(
      file,
    )
  )
    continue;
  const text = fs.readFileSync(file, "utf8");
  if (tokenShapes.some((re) => re.test(text)))
    problems.push(`${file}: possible live credential`);
  for (const match of text.matchAll(assignment)) {
    const value = match[1];
    if (file.endsWith(".env.example")) {
      problems.push(`${file}: secret template values must be empty`);
      break;
    }
    if (value.length >= 20 && !placeholder.test(value)) {
      problems.push(`${file}: possible credential assignment`);
      break;
    }
  }
}

if (problems.length) {
  console.error(
    "Secret check failed (values are not printed):\n" + problems.join("\n"),
  );
  process.exitCode = 1;
} else
  console.log(
    "Secret check passed: distributable source has no detected live credentials.",
  );
