const path = require('node:path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
    extraNodeModules: {
      react: path.join(projectRoot, 'node_modules/react'),
      'react-native': path.join(projectRoot, 'node_modules/react-native'),
      'react-native-nitro-modules': path.join(
        projectRoot,
        'node_modules/react-native-nitro-modules',
      ),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
