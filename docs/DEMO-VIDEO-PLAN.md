# ChatPlay AI — demo video expectations and recording plan

Prepared October 30, 2026.

November 1 clarification: the overview permits up to three minutes, but the [official rules](https://twitchcon-codex.devpost.com/rules) request less than three minutes. Treat the timeline below as a narrative outline; trim the final video below 180 seconds before uploading. The current exactly 180-second local edit still needs that trim and final acceptance review.

## Official submission requirements

The organizer requires a demo video of **at most three minutes**, showing the project working on **Twitch** and explaining **how Codex was used**. Upload it to **YouTube with public visibility**. The submission also needs the code repository, project description, and the main build thread's Codex session ID. These requirements were checked against the [official hackathon page](https://twitchcon-codex.devpost.com/).

The sequence below is our recommended presentation plan, not an additional organizer requirement.

## What the viewer should understand

By the end, a judge should have seen:

1. A real viewer sends a chat message on Twitch.
2. ChatPlay translates it into a bounded action and groups equivalent requests.
3. A community decision causes a visible move in a real game.
4. The OBS overlay makes that decision easy to follow.
5. The streamer can stop or approve inputs and control the limits.
6. Codex materially helped build and verify the application.

Show these outcomes rather than spending most of the video touring settings or the marketing homepage.

## Recommended timeline — target 2:50

| Time      | Show on screen                                                                                | Suggested narration                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:15 | Game, Twitch chat, and ChatPlay identity                                                      | “ChatPlay AI turns your Twitch chat into your next player two. Viewers describe moves, the community decides, and you stay in control.”                     |
| 0:15–0:45 | A real Twitch message arriving in the activity feed, then its parsed action                   | “ChatPlay reads live Twitch chat through EventSub. This sentence becomes a short, validated move.”                                                          |
| 0:45–1:10 | Two viewers using “jump” and “hop,” a competing move, the vote closing, and the game reacting | “Different words can share one intent. Each viewer gets one vote, and the winning move reaches the game.”                                                   |
| 1:10–1:35 | Blocked unsafe input, foreground protection, then native F8 emergency stop                    | “Only allowed keys can execute. Losing focus blocks input, and F8 cancels pending moves and disarms control.”                                               |
| 1:35–1:55 | Brief profile edit and one streamer-approved move                                             | “The streamer chooses the game controls, cooldowns, and whether chat votes, plays within limits, or asks for approval.”                                     |
| 1:55–2:20 | Actual Codex conversation/code changes and meaningful tests                                   | “Codex helped implement the Twitch connection, voting engine, native bridge, UI, and regression tests. We also checked real game input and OpenAI parsing.” |
| 2:20–2:45 | A final real community move with the OBS overlay visible                                      | “The result is a shared adventure that is fun to play and easy to watch.”                                                                                   |
| 2:45–2:50 | Project name and final repository/demo links                                                  | “Your chat. The controller.”                                                                                                                                |

## Prepare before recording

- [ ] Finish the blockers in [PENDING-WORK.md](PENDING-WORK.md).
- [ ] Use the latest build and verify the Windows download if showing it.
- [ ] Connect the real Twitch channel and arrange participating viewers.
- [ ] Use the acceptance-tested SuperTux profile, or another game you have actually tested.
- [ ] Keep the chosen game foreground during the action demonstration.
- [ ] Add the actual ChatPlay browser-source URL to OBS and refresh it.
- [ ] Verify transparency, placement, resolution, and readable vote labels.
- [ ] Choose the parser deliberately. Use OpenAI when demonstrating broader natural language; label local parsing accurately.
- [ ] Preflight the exact phrases and timings. Allow for real model and network latency.
- [ ] Keep your main Codex build conversation ready on a safe, relevant section.
- [ ] Prepare intentional narration audio. Mute unintended microphone/desktop sources.
- [ ] Close unrelated personal windows and hide credentials, environment files, private overlay URLs, and sensitive notifications.

## Suggested chat script

Use real Twitch participants for the recorded integration sequence. Send each message in the intended round, respecting cooldowns.

| Participant            | Message                                    | Expected result                                                               |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| Viewer A               | `jump`                                     | One jump candidate                                                            |
| Viewer B               | `hop`                                      | Same jump candidate receives another vote                                     |
| Viewer C, if available | `go right`                                 | Competing right-move candidate                                                |
| A later round          | `Please move the character right a little` | A bounded right move; use the OpenAI parser for the natural-language showcase |
| A later round          | `jump twice`                               | A two-jump sequence within the profile limit                                  |
| Safety check           | `alt f4`                                   | Rejected; no system action                                                    |
| Safety check           | `I cannot jump`                            | Rejected; no jump                                                             |

For the native stop demonstration, queue a bounded move, press F8 while the game is focused, and show the stopped state. Restart explicitly afterward.

## What to show about Codex

- An actual implementation or review exchange from this project.
- A concrete before/after change, such as rejecting unintended conversational commands or fixing double-counted aliases.
- The relevant test result and a brief explanation of the behavior it checks.
- A short view of the real architecture: Twitch → parser → validation/voting → native input → OBS overlay.

Avoid reading long prompts or scrolling through hundreds of lines of code. Codex's role should be understandable in roughly 25 seconds.

## Keep the demonstration accurate

- Do not present sample chat, mocked provider tests, or a local QA recording as a live Twitch session.
- Do not call local parsing an OpenAI request.
- Do not claim every game is supported. The current build uses sequential Windows keyboard controls.
- Do not present device sign-in, token refresh, or channel-point redemption as live-verified until their acceptance checks are complete.
- Do not claim the installer is signed or that updates install automatically.
- Do not remove failures through editing in a way that suggests an uninterrupted successful interaction. If speeding up latency, label the speed change.

## Final video checklist

- [ ] Total duration is three minutes or less, including intro/outro.
- [ ] Twitch message, ChatPlay decision, and game response are clearly connected.
- [ ] OBS overlay is readable and genuinely transparent outside its card.
- [ ] Streamer safety/control is demonstrated.
- [ ] Actual Codex use is visible and explained.
- [ ] Narration is clear; unrelated private content and credentials are absent.
- [ ] The project name and links are correct.
- [ ] YouTube visibility is Public and the video plays while signed out.
- [ ] The final YouTube URL is added to the Devpost submission.

The existing local recordings in `artifacts/verification/recordings/` are useful rehearsals. Record a fresh final video with real Twitch participation before submitting.
