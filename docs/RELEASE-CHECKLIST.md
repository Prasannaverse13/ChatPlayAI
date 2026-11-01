# Release acceptance checklist

Never mark a live check complete based only on a mock.

Updated November 1, 2026 for v1.1.1. See [PENDING-WORK.md](PENDING-WORK.md) for final submission tasks.

## Automated

- [x] Local parser accepts bounded plain phrases and repetition.
- [x] Negated, conditional, and unrelated chat is rejected.
- [x] Key/action explanations do not double-count repetitions.
- [x] Voting, approval, cooldowns, and session cancellation have regression tests.
- [x] Twitch EventSub lifecycle and device authorization have mocked tests.
- [x] API mutations require local authentication and CSRF protection.
- [x] Production build and portable packaging scripts are available.
- [x] 110 Windows tests pass, including actual DPAPI round-trip and read-only preview startup.
- [x] TypeScript, build, source secret scan, and native invalid-target smoke test pass.
- [x] Home, studio, and Settings pass browser rendering/error checks.

## Live acceptance

- [x] Real Twitch chat → playground delivery verified during this project.
- [x] Real OpenAI parsing checked with gpt-4.1-mini on October 30, 2026; see local openai-live.json.
- [x] Native Windows movement executed in SuperTux v0.7.0.
- [x] Foreground loss blocks game input.
- [x] Registered native F8 hotkey pauses/disarms the session.
- [x] Foreground-only game screenshot capture checked.
- [x] Actual OBS browser source and a local game-only recording verified with OBS 33.0.1; see local obs-live.json.
- [ ] Multi-person Twitch rehearsal with the final build.
- [ ] Real Twitch device authorization/refresh and eligible channel-point redemption.
- [ ] Installer signing with the owner's certificate.
- [ ] Mouse/gamepad driver integration and simultaneous controls.

## Distribution and submission

- [x] Clean v1.1.1 ZIPs and checksums; actual bundled-runtime launcher, fresh installation, and update preservation checked on Windows.
- [x] v1.1.1 source pushed; Windows and Linux CI passed for release commit `1293586` ([run](https://github.com/Prasannaverse13/ChatPlayAI/actions/runs/41276010440)).
- [x] [v1.1.1 release assets](https://github.com/Prasannaverse13/ChatPlayAI/releases/tag/v1.1.1) uploaded; downloaded ZIPs match checksums and local originals. Anonymous public download checks return HTTP 200.
- [ ] Public final YouTube video uploaded, under three minutes to satisfy the official rules' stricter wording.
- [ ] Main Codex session ID added to the submission.
- [ ] Devpost description and links reviewed by the project owner.

The local three-minute MP4 passes decode, format, audio peak, and sampled-frame checks. A full audiovisual review and clear proof of real Twitch-to-game operation remain submission gates; test chat and blocked native execution must not be presented as successful live gameplay.
