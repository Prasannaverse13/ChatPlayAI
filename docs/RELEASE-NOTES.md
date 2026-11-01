# ChatPlay AI v1.1.1

ChatPlay now shows the selected Windows game in the studio, accepts more bounded casual chat phrasing, and keeps session credentials usable when optional encrypted storage fails.

- Add a read-only game preview with authenticated access, invalid-window handling, and clean helper shutdown.
- Accept phrases such as `jump bro`, `jummmp`, `go back`, and `go forward`, while preserving profile aliases, action limits, negation rejection, and unrelated-chat rejection.
- Use fixed Windows DPAPI commands for credential protection; show persistence warnings in Settings without blocking an in-memory connection.
- Package with process-scoped PowerShell execution settings, without changing machine policy. Remove successful packaging staging directories.

Validation: 110 Windows tests, TypeScript check, production build, native safety smoke test, browser checks, and archive checksum/credential checks. See [PENDING-WORK.md](PENDING-WORK.md) for live acceptance still required.

Windows acceptance also confirms startup using only bundled Node, fresh installation, and an update preserving settings and encrypted credentials. The restarted installed app restores credentials and remains paused.

The Windows ZIP includes Node and production dependencies. Extract and run `Start ChatPlay.cmd`; use `Install ChatPlay.cmd` for per-user installation. The source ZIP requires Node.js 22.12 or newer. SHA-256 files accompany both archives.

The installer is unsigned. Windows input is sequential keyboard input; mouse, gamepad, simultaneous controls, and universal game compatibility are not supported. Twitch device refresh and channel-point handling still need live-provider acceptance.
