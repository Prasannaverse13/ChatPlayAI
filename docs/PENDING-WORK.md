# ChatPlay AI — pending work

Updated November 1, 2026 for v1.1.1. This replaces the October 30 snapshot. A mocked test is not live-provider acceptance.

## Verified for this release

- [x] 110 tests pass on Windows, including actual DPAPI encrypt/restore/forget and read-only native preview startup.
- [x] TypeScript check, production build, and source secret scan pass.
- [x] Native bridge smoke test enumerates windows and rejects an invalid target without sending input.
- [x] Browser checks: home, studio, and Settings render; no browser errors reported; session starts paused.
- [x] Source and portable Windows ZIPs built; SHA-256 checks pass; archive contents exclude local credentials, session data, and test tools.
- [x] Windows portable launcher works with global Node removed from PATH. Fresh installation and update preserve settings and encrypted dummy credentials; restarted app restores them and stays paused.
- [x] Existing demo MP4 passes full decode: 180 seconds, 1920×1080, 30 fps, H.264/AAC. Sampled chapter frames reviewed; audio peak -3.9 dBFS.

The demo file exists locally at `artifacts/demo/ChatPlayAI-demo-3min.mp4`. Technical validation and sampled-frame review do not prove the entire Twitch-to-game story is demonstrated. The retained recording report includes a genuine Twitch request whose execution was blocked by foreground protection. Do not present that request as a successful native move.

## Required before hackathon submission

- [ ] Rehearse with at least two actual Twitch viewers on v1.1.1: equivalent and competing commands, one viewer/one vote, real game movement, and visible overlay results. Owner deferred this rehearsal on November 1.
- [ ] Check reconnect behavior, foreground-loss protection, and native F8 with the final game session. Control must remain paused until explicitly restarted.
- [ ] Review the full demo with sound. Ensure real Twitch operation and Codex use are clearly shown, staged test chat is labeled, and no credentials or private overlay URL are visible. Replace any missing acceptance footage.
- [ ] Trim the reviewed video below 180 seconds, upload publicly to YouTube, and check the link while signed out. The overview permits at most three minutes, but the official rules request less than three minutes.
- [ ] Obtain the main Codex build session ID using `/status`; do not substitute an unrelated session ID.
- [ ] Fill the video URL and session ID in `docs/SUBMISSION.md`, review the description, and submit on Devpost.

Organizer requirements: https://twitchcon-codex.devpost.com/ and https://twitchcon-codex.devpost.com/rules . Checked November 1: deadline November 2, 2026 at 2:00 p.m. PST (November 3 at 3:30 a.m. IST); video must be public on YouTube. Use a final cut under three minutes to satisfy the stricter wording in the official rules.

## Additional product acceptance

- [ ] Actual Twitch device sign-in: success, denial, expiration, and cancellation.
- [ ] Real token refresh and saved refresh-token rotation.
- [ ] Actual channel-point redemption on an eligible channel, including cooldowns and approval handling.
- [ ] Broader Windows game compatibility and testing on another computer.

Manual Twitch token connection, prior real OpenAI parsing, SuperTux input, native F8, and OBS capture have historical live evidence under ignored `artifacts/verification/`. These do not replace the remaining final-build checks above.

## Distribution

- Source: https://github.com/Prasannaverse13/ChatPlayAI
- Current CI results: https://github.com/Prasannaverse13/ChatPlayAI/actions
- Downloads: https://github.com/Prasannaverse13/ChatPlayAI/releases

v1.1.1 is published from commit `1293586`, with Windows and Linux CI passing. Both ZIPs and checksum files were downloaded and verified against the local originals; anonymous download checks returned HTTP 200. Subsequent documentation sign-off does not change the published release bytes.

Before publishing any release, confirm CI for its exact commit, upload both clean ZIPs and their checksums, and verify the uploaded bytes. Local verification reports, credentials, OBS configuration, and demo source media remain out of Git.

## Optional future work

- Trusted installer signing with the owner's code-signing certificate.
- Mouse and virtual gamepad support, simultaneous key combinations, and the required supported drivers.
- Automatic update installation. The current release checks for updates and provides download links.
