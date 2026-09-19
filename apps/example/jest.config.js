module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  modulePaths: ['<rootDir>/node_modules'],
  moduleNameMapper: {
    '^react-native-nitro-speech$': '<rootDir>/../../src/index.ts',
    '^react$': '<rootDir>/node_modules/react',
    '^react-native$': '<rootDir>/node_modules/react-native',
    '^react-native-nitro-modules$':
      '<rootDir>/node_modules/react-native-nitro-modules',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-nitro-modules|react-native-nitro-speech)/)',
  ],
};


