declare module 'expo/config-plugins' {
  // Minimal typing for the Expo APIs this library plugin uses.
  // The consuming Expo app provides `expo/config-plugins` at prebuild time.
  type ExpoConfig = Record<string, any>

  export type ConfigPlugin<Props = void> = (
    config: ExpoConfig,
    props?: Props
  ) => ExpoConfig

  export function withInfoPlist(
    config: ExpoConfig,
    action: (config: ExpoConfig) => ExpoConfig
  ): ExpoConfig

  export function createRunOncePlugin<Props>(
    plugin: ConfigPlugin<Props>,
    name: string,
    version?: string
  ): ConfigPlugin<Props>
}
