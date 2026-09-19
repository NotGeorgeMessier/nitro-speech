import {
  androidEmulator,
  androidPlatform,
} from '@react-native-harness/platform-android';
import {
  applePlatform,
  appleSimulator,
} from '@react-native-harness/platform-apple';

const androidEmulatorName =
  process.env.HARNESS_ANDROID_EMULATOR ?? 'Pixel_API_35';
const androidBundleId =
  process.env.HARNESS_ANDROID_BUNDLE_ID ?? 'com.nitrospeechexample';
const iosBundleId = process.env.HARNESS_IOS_BUNDLE_ID ?? 'com.nitrospeechexample';
const iosSimulatorName = process.env.HARNESS_IOS_SIMULATOR ?? 'iPhone 16 Pro';
const iosSimulatorVersion = process.env.HARNESS_IOS_SIMULATOR_VERSION ?? '18.0';

/**
 * Harness runs on emulator/simulator only.
 *
 * Do not point iOS at a physical device (and never use a placeholder team id).
 *
 * Emulator speech contracts:
 * - iOS Simulator: silence only. Lasting silence must not fail tests.
 * - Android Emulator: silence only; ERROR_SPEECH_TIMEOUT after ~4–5s.
 *   Safe flow is start → hold ≤3s wall-clock from startListening → stop.
 */
const config = {
  entryPoint: './index.js',
  appRegistryComponentName: 'NitroSpeechExample',
  runners: [
    androidPlatform({
      name: 'android',
      device: androidEmulator(androidEmulatorName),
      bundleId: androidBundleId,
    }),
    applePlatform({
      name: 'ios',
      device: appleSimulator(iosSimulatorName, iosSimulatorVersion),
      bundleId: iosBundleId,
    }),
  ],
  defaultRunner: 'android',
  permissions: true,
  testTimeout: 60_000,
  bridgeTimeout: 120_000,
  bundleStartTimeout: 90_000,
  detectNativeCrashes: true,
  resetEnvironmentBetweenTestFiles: true,
  forwardClientLogs: true,
};

export default config;
