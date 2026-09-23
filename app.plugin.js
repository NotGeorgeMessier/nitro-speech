// Expo auto-discovers this file as the config plugin entry for the package.
const plugin = require('./plugin/build')
module.exports = plugin.default || plugin
