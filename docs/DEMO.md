# ChatPlay AI demo

## Before recording

- Add real Twitch credentials; verify EventSub shows Connected.
- Connect the actual channel to OBS and add the read-only ChatPlay overlay source.
- Test the selected game's controls. Keep it foreground while community moves execute.
- Use real participating chat accounts for the Twitch demonstration.
- Hide tokens, .env files, and the full overlay URL.
- The local parser needs no key and handles short plain phrases such as “move the character to the right a little”, “go right, jump”, “jump jump” (two jumps), and “run far to the left”. It rejects negated, conditional, and unrelated chat. Do not describe local parsing as an OpenAI call.
- To show looser phrasing, add a real OpenAI key, select OpenAI while paused, and check the result and latency with the OpenAI diagnostic in Settings before recording.
- Run `npm run package` before recording a Windows download. Source checkouts without a packaged ZIP hide download links and offer the browser studio instead.

## Three-minute recording

The current, more detailed plan is [DEMO-VIDEO-PLAN.md](DEMO-VIDEO-PLAN.md). The table below is the short version.

| Time      | Show                                                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:15 | Pitch: “Your chat. The controller. Viewers describe moves, ChatPlay groups their intent, and the community plays together.”                              |
| 0:15–0:55 | Live Twitch messages arrive in the studio; “hop” and “jump” combine into one vote. Show the overlay vote filling and the winning move reaching the game. |
| 0:55–1:20 | A second round with competing moves. Explain one-viewer/one-vote and visible timing.                                                                     |
| 1:20–1:40 | Reject an unsupported/system command. Show a foreground-loss block without touching another app.                                                         |
| 1:40–1:55 | Native F8 stops inputs and cancels pending votes. Explicitly restart afterward.                                                                          |
| 1:55–2:15 | Show the visual game-profile editor and approval mode. If a second game is tested, show its real controls.                                               |
| 2:15–2:40 | Show Codex build work, meaningful tests, and architecture. Explain the parser/validation/native separation.                                              |
| 2:40–3:00 | End on a real community move, with the overlay visible. “You set the rules. Chat takes the next turn.”                                                   |

## Submission checklist

- Repository with source, assets, lockfile, README, and runnable setup instructions.
- Public YouTube video, at most three minutes, showing Twitch use and Codex use.
- Description of working features, supported input, and limitations.
- Main Codex build session ID.
- No API keys, user tokens, generated data, or private overlay token in the repository.

The organizer's current rules are authoritative: https://twitchcon-codex.devpost.com/
