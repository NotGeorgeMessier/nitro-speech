/** @type {import('jest').Config} */
const config = {
  preset: 'react-native-harness',
  testMatch: ['**/__tests__/**/*.harness.ts', '**/__tests__/**/*.harness.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
};

export default config;
