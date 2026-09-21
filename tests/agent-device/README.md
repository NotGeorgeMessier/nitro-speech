# Layer 5: agent-device Listen smoke

External CLI/MCP that drives the **already installed** example app on a simulator, emulator, or device. It is **not** an in-app library of the React Native runtime.

Pinned at the repo root: `agent-device@0.21.8` (lockfile). After `bun install` or `npm install`, use `node_modules/.bin/agent-device`. Do not run `npx -y agent-device@latest`.

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

## vs other layers

| Layer | What it is for |
|-------|----------------|
| Jest / Harness / XCTest / Robolectric | In-process or on-device **code** contracts. No STT goldens. |
| agent-device | **Installed app** UI on sim/emu/device. Exploratory Listen smoke for humans and Cursor agents. |
