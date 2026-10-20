# Layer 5: agent-device Listen smoke

External CLI/MCP that drives the **already installed** example app on a simulator, emulator, or device. It is **not** an in-app library of the React Native runtime.

Pinned at the repo root: `agent-device@0.21.28` (lockfile). After `bun install` or `npm install`, use `node_modules/.bin/agent-device`. Do not run `npx -y agent-device@latest`. Nightly `0.21.29-*` builds are not the pin; `latest` on npm is `0.21.28`.

This is **UI smoke** (open → Listen start → short hold → stop → screenshot). It is not an STT accuracy suite and is **not a CI gate**. Cloud VMs without hardware cannot drive local simulators.

## App identifiers

| Platform | Open as | Package / bundle |
|----------|---------|------------------|
| iOS | `NitroSpeechExample` | `com.nitrospeechexample` |
| Android | `com.nitrospeechexample` | `com.nitrospeechexample` |

Example lives at repo-root `example/`.

## Durable selectors

The Listen screen already exposes testIDs (use these before refs):

| testID | Visible label / value |
|--------|------------------------|
| `toggle-listening-button` | `Start listening` / `Stop listening` |
| `listening-status` | `yes` / `no` |
| `permission-status` | permission enum name |
| `check-permissions-button` | `Check permissions` |
| `prewarm-button` | `Prewarm` |
| `toggle-on-device-button` | `On-device prefer: on/off` |

Agent-device selectors, for example:

```text
id="toggle-listening-button" || label="Start listening"
```

If a snapshot does not surface `id=`, click by label (`Start listening` / `Stop listening`) and keep using refs (`@eN`) for exploration.

## Playbook

Prerequisites: Node 22.12+, Xcode/`simctl` (iOS), Android SDK/`adb` (Android).

```bash
# from repo root
bun install   # or npm install — installs the pinned CLI
npm run test:agent-device:doctor
agent-device boot --platform ios          # or android
npm run example:ios                       # or example:android — build/install/run first
```

Then either let Cursor drive it (enable MCP from `.cursor/mcp.json`) or replay:

```bash
agent-device replay tests/agent-device/listen-smoke.ios.ad
# or
agent-device replay tests/agent-device/listen-smoke.android.ad
```

Batch equivalent: `listen-smoke.ios.json` / `listen-smoke.android.json`.

```bash
agent-device batch --platform ios --steps-file tests/agent-device/listen-smoke.ios.json
```

Intended flow:

1. `open` the example in the foreground (do not start with `--help`).
2. `snapshot -i`.
3. If a mic/speech permission sheet is up, `alert accept` (or press Allow).
4. Click **Start listening**.
5. Hold briefly. **Android: stop within 3s of start.** iOS lasting silence is OK; still stop to finish the smoke.
6. Click **Stop listening**.
7. Re-snapshot; confirm the button is `Start listening` again (or `listening-status` is `no`).
8. `screenshot` evidence under `tests/agent-device/artifacts/` (gitignored).
9. `close`.

`npm run test:agent-device:smoke:ios` / `test:agent-device:smoke:android` print these commands. They do not talk to a device unless `AGENT_DEVICE_SMOKE_RUN=1`.

## Silence contracts

- **iOS Simulator:** silence only. Lasting silence must not fail the smoke.
- **Android Emulator:** silence only; native timeout after ~4–5s. Start → hold **≤3s** → stop.

The replay files keep `HOLD_MS=1500`. That hold is the listening window. Do not add settle waits or extra pauses that push an Android emulator session toward the ~4–5s speech timeout.

## What 0.21.21–0.21.28 changes for these flows

The Listen scripts stay click → 1500 ms → click. These CLI changes apply without editing the steps:

- Taps consult a moving-target gate (#3538, #3548). A control that is still moving is refused with `target_still_moving` instead of a success reported on an empty point.
- iOS captures interpret React Native accessibility value strings (#3589). `listening-status` values (`yes` / `no`) can show up as value facts. The scripts still wait on the button id and `Start listening` / `Stop listening` labels.

Left out of the scripts on purpose:

- `scroll --until` (#3234) parses in `.ad` files. The Listen controls are on screen, so the smoke does not scroll.
- `replay --test-ime` (#3235) opts Android text entry into the headless test IME. Emulators already do that by default, and this smoke does not type.
- App-scoped `settings permission … --app` (#3205) can grant `microphone` (or `all`) without an open session. The iOS mapping has no speech-recognition service, so a microphone grant can still leave the speech sheet up. `settings permission grant all` is wider than this smoke. A bare `alert accept` in the replay fails with `alert-not-found` when the sheet is already gone. When a sheet is visible, accept it from the agent with `alert accept`, then continue.

`SnapshotNode.ref` is optional in the TypeScript API (#3547). iOS and Android Listen replay uses selectors, not refs.

## vs other layers

| Layer | What it is for |
|-------|----------------|
| Jest / Harness / XCTest / Robolectric | In-process or on-device **code** contracts. No STT goldens. |
| agent-device | **Installed app** UI on sim/emu/device. Exploratory Listen smoke for humans and Cursor agents. |
