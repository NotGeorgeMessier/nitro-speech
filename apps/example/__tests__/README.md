# NitroSpeech tests

## Jest (`*.test.ts`)

Pure JS. No emulator.

```bash
cd apps/example && npm test
```

Covers `ErrorDictionary`, `SpeechRecognitionError`, `PermissionStatus`, and a render smoke test of the listen UI.

## Harness (`*.harness.ts`)

Runs inside the debug app on emulator/simulator.

```bash
cd apps/example
npm run test:harness:android   # default
npm run test:harness:ios       # simulator only
```

| File | Coverage |
|------|----------|
| `nitrospeech.permissions.harness.ts` | `getPermissions`, enum |
| `nitrospeech.lifecycle.harness.ts` | start/stop, `getIsActive`, volume, auto-finish progress |
| `nitrospeech.android-emulator.android.harness.ts` | Android ≤3s start→stop, no silence timeout |
| `nitrospeech.ios-simulator.ios.harness.ts` | iOS extended silence must not fail; locales; prewarm |
| `nitrospeech.errors.harness.ts` | error dictionary + unsupported locale |
| `nitrospeech.on-device.harness.ts` | service availability, locales, `onDevice: 'prefer'` |

iOS runner is an **iOS Simulator**. There is no physical-device / team-id path.
