import {
  androidEmulator,
  androidPlatform,
  physicalAndroidDevice,
} from '@react-native-harness/platform-android'
import {
  applePhysicalDevice,
  applePlatform,
  appleSimulator,
} from '@react-native-harness/platform-apple'

// Android configuration from environment or defaults
const androidEmulatorName =
  process.env.HARNESS_ANDROID_EMULATOR ?? 'Pixel_API_35'
const androidApiLevel = Number.parseInt(
  process.env.HARNESS_ANDROID_API_LEVEL ?? '35',
  10,
)
const androidDeviceProfile =
  process.env.HARNESS_ANDROID_DEVICE_PROFILE ?? 'pixel'
const androidDiskSize = process.env.HARNESS_ANDROID_DISK_SIZE ?? '2G'
const androidHeapSize = process.env.HARNESS_ANDROID_HEAP_SIZE ?? '1G'
const androidBundleId =
  process.env.HARNESS_ANDROID_BUNDLE_ID ?? 'com.nitrospeechexample'
const androidPhysicalManufacturer =
  process.env.HARNESS_ANDROID_DEVICE_MANUFACTURER ?? 'Google'
const androidPhysicalModel =
  process.env.HARNESS_ANDROID_DEVICE_MODEL ?? 'Pixel 7'
const androidDeviceMode =
  process.env.HARNESS_ANDROID_DEVICE_MODE?.trim().toLowerCase() ?? 'emulator'

// iOS configuration from environment or defaults
const iosBundleId =
  process.env.HARNESS_IOS_BUNDLE_ID ?? 'com.nitrospeechexample'
const iosSimulatorName = process.env.HARNESS_IOS_SIMULATOR ?? 'iPhone 16 Pro'
const iosSimulatorVersion = process.env.HARNESS_IOS_SIMULATOR_VERSION ?? '18.0'
const iosPhysicalDeviceIdentifier =
  process.env.HARNESS_IOS_DEVICE_ID?.trim() || 'iPhone'
const metroBindHost = process.env.HARNESS_METRO_BIND_HOST?.trim() ?? ''

const isCI = process.env.CI === 'true'
const bundleStartTimeout = isCI ? 90_000 : 15_000
const bridgeTimeout = isCI ? 120_000 : 45_000
const maxAppRestarts = isCI ? 4 : 2

const useEmulator = androidDeviceMode === 'emulator'

const androidDevice = useEmulator
  ? androidEmulator(androidEmulatorName, {
      apiLevel: androidApiLevel,
      profile: androidDeviceProfile,
      diskSize: androidDiskSize,
      heapSize: androidHeapSize,
    })
  : physicalAndroidDevice(androidPhysicalManufacturer, androidPhysicalModel)

const iosDevice = isCI
  ? applePhysicalDevice(iosPhysicalDeviceIdentifier, {
      codeSign: {
        teamId: 'PLACEHOLDER_TEAM_ID',
      },
    })
  : appleSimulator(iosSimulatorName, iosSimulatorVersion)

/**
 * React Native Harness configuration for NitroSpeech example app.
 *
 * IMPORTANT: Speech recognition on emulators/simulators has significant limitations:
 *
 * - iOS Simulator: Speech stack produces only silence. Tests must NOT fail due to silence.
 * - Android Emulator: After ~4-5 seconds of silence, ERROR_SPEECH_TIMEOUT fires.
 *   Tests must stop listening within ≤3 seconds to avoid this error.
 *
 * Tests should cover permissions, lifecycle, error handling shapes - NOT transcription accuracy.
 */
const config = {
  entryPoint: './index.js',
  appRegistryComponentName: 'NitroSpeechExample',
  host: metroBindHost === '' ? undefined : metroBindHost,
  runners: [
    androidPlatform({
      name: 'android',
      device: androidDevice,
      bundleId: androidBundleId,
    }),
    applePlatform({
      name: 'ios',
      device: iosDevice,
      bundleId: iosBundleId,
    }),
  ],
  defaultRunner: 'android',
  bridgeTimeout,
  bundleStartTimeout,
  maxAppRestarts,
  detectNativeCrashes: true,
  resetEnvironmentBetweenTestFiles: true,
  forwardClientLogs: true,
  permissions: true,
}

export default config
