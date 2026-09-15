/** @type {import('jest').Config} */
const config = {
  preset: 'react-native',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '\\.harness\\.(ts|tsx)$'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-nitro-modules|react-native-nitro-speech)/)',
  ],
  setupFilesAfterEnv: [],
  testTimeout: 30000,
  verbose: true,
}

export default config
