# Android native unit tests

Robolectric + JUnit for Nitro-free Kotlin (AutoStopper, filters, volume, permissions, on-device decisions). No SpeechRecognizer STT.

From the repo root:

```bash
npm run test:android:native
```

or:

```bash
./apps/example/android/gradlew -p tests/android testDebugUnitTest
```

Needs `ANDROID_HOME` or `sdk.dir` in `local.properties`.
