jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: () => ({
      recognizer: {
        startListening: jest.fn(),
        stopListening: jest.fn(),
        getPermissions: jest.fn(() => 2),
        getIsActive: jest.fn(() => false),
        getVoiceInputVolume: jest.fn(() => ({
          smoothedVolume: 0,
          rawVolume: 0,
        })),
        onDeviceRecognitionAvailable: jest.fn(() => false),
        prewarm: jest.fn(() => Promise.resolve()),
        getSupportedLocales: jest.fn(() =>
          Promise.resolve({locales: [], installedLocales: []}),
        ),
        getSupportedLocalesIOS: jest.fn(() => []),
      },
    }),
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  return {
    SafeAreaProvider: ({children}) => children,
    useSafeAreaInsets: () => inset,
  };
});
