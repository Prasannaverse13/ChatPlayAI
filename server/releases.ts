import fs from "node:fs";
import path from "node:path";
export const version = JSON.parse(
  fs.readFileSync(path.resolve("package.json"), "utf8"),
).version as string;
export const releasePaths = [
  path.resolve(`artifacts/ChatPlayAI-${version}-Windows.zip`),
  path.resolve(`artifacts/ChatPlayAI-${version}.zip`),
];
export const currentArchive = () =>
  releasePaths.find((file) => fs.existsSync(file));
export async function checkUpdates() {
  const response = await fetch(
    "https://api.github.com/repos/Prasannaverse13/ChatPlayAI/releases/latest",
    {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (response.status === 404)
    return {
      current: version,
      available: false,
      message:
        "No accessible release found. Private repositories require GITHUB_TOKEN in .env.local.",
    };
  if (!response.ok)
    throw Error("Could not check GitHub releases. Try again later.");
  const release = await response.json();
  const latest = String(release.tag_name || "").replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+$/.test(latest))
    throw Error("Release version is invalid.");
  const newer =
    latest
      .split(".")
      .map(Number)
      .reduce(
        (result, n, i) =>
          result || Math.sign(n - Number(version.split(".")[i])),
        0,
      ) > 0;
  const asset = release.assets?.find(
    (a: any) => a.name === `ChatPlayAI-${latest}-Windows.zip`,
  );
  const url = new URL(release.html_url);
  if (
    url.hostname !== "github.com" ||
    !url.pathname.startsWith("/Prasannaverse13/ChatPlayAI/releases/")
  )
    throw Error("Release link is invalid.");
  return {
    current: version,
    latest,
    available: newer && !!asset,
    url: url.toString(),
    checksum: typeof asset?.digest === "string" ? asset.digest : undefined,
    message: newer
      ? "A newer portable release is available."
      : "You have the latest accessible release.",
  };
}
