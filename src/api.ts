import type { State } from "../shared/types";
let csrf = "";
export async function bootstrap(): Promise<{
  state: State;
  overlayToken: string;
}> {
  const r = await fetch("/api/bootstrap", { credentials: "same-origin" });
  if (!r.ok) throw Error("Could not reach the local ChatPlay server.");
  const data = await r.json();
  csrf = data.csrf;
  return data;
}
export async function api<T = any>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> {
  const r = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-ChatPlay-CSRF": csrf },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Request failed.");
  return data;
}
