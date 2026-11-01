# ChatPlay AI — submission draft

## Pitch

Your chat. The controller. ChatPlay AI turns Twitch viewers' plain-language messages into bounded, community-selected game inputs, with a streamer studio and live OBS overlay.

## Inspiration

Twitch chat already reacts, argues, and suggests what the streamer should do next. ChatPlay makes those suggestions playable: equivalent requests share a vote, the community sees the winning move, and the streamer keeps control of the boundaries.

## What it does

The local Windows companion reads Twitch chat through EventSub. A deterministic local parser or optional OpenAI structured-output parser translates messages into sequential keyboard actions. A profile validates keys, repeats, durations, and cooldowns. Viewers can vote, play within anarchy limits, or request streamer approval. An independent native F8 hotkey disarms inputs, and focus checks prevent moves reaching another application.

The browser studio manages profiles, activity, sessions, exports, and connections. The OBS browser source displays votes and completed moves. Version 1.1 adds Twitch device sign-in and refresh handling, optional Windows DPAPI credential persistence, opt-in screenshot context, channel-point priority handling, and release notifications.

Version 1.1.1 adds a read-only view of the selected Windows game, broader bounded casual-chat phrasing, and clearer handling when optional encrypted credential storage is unavailable.

## How we built it

React and TypeScript power the studio and website. A loopback Express/WebSocket server coordinates the parser, voting engine, persistence, Twitch EventSub, and optional OpenAI Responses requests. A PowerShell/C# helper uses Windows SendInput, foreground checks, a registered F8 hotkey, and a heartbeat watchdog.

Codex helped implement the application, redesign the website, review parser regressions, create behavioral tests, connect real Twitch chat, and run acceptance checks against a real game. Record the main build session ID from this conversation's Codex status; do not substitute an unrelated session.

## Validation and limitations

Automated tests cover parsing, lifecycle cancellation, voting, authenticated local APIs, EventSub retries/deduplication, and device authorization. Live verification evidence is kept locally in `artifacts/verification` and is excluded from Git because screenshots, scene configuration, and recordings may contain private information.

Use `docs/RELEASE-CHECKLIST.md` for current acceptance status before copying this draft into Devpost. Do not describe mocked provider tests as live acceptance tests. Keyboard support is sequential; mouse, virtual gamepad, simultaneous chords, and universal game compatibility are not implemented. Installer signing requires the owner's code-signing certificate. Automatic update notifications do not silently install releases.

## Links to complete before submission

- Source: https://github.com/Prasannaverse13/ChatPlayAI (public repository).
- Downloads: https://github.com/Prasannaverse13/ChatPlayAI/releases
- Demo video: upload the final, genuine Twitch demonstration to YouTube and insert its public URL.
- Codex session ID: obtain from the main build conversation's status.
- Description: review this draft for accuracy against the final recording.

## Three-minute narrative

1. Explain the collective-control pitch and show the live studio.
2. Have real viewers send equivalent requests; show one shared vote and the winning move in the game.
3. Show the same decision in OBS.
4. Demonstrate a blocked command, focus loss, and native F8 stop.
5. Show profile editing and one approval-mode move.
6. Show Codex work, meaningful tests, and supported release boundaries.

Local QA recordings are rehearsal evidence, not a substitute for the final Twitch-and-Codex submission video.

Submission preparation status, November 1: a local 180-second MP4 exists and passes technical format/decode checks. The owner deferred the final multi-viewer rehearsal. Review the complete video and replace missing genuine Twitch acceptance footage before uploading publicly; the retained game report includes a foreground-blocked request, which is not proof of successful Twitch-controlled native movement.
