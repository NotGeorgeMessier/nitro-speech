/** @type {import('jest').Config} */
const config = {
  preset: 'react-native-harness',
  testMatch: ['**/__tests__/**/*.harness.ts', '**/__tests__/**/*.harness.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 120000,
  verbose: true,
  reporters: ['default', 'jest-junit'],
}

export default config
