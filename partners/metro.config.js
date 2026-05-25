const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
// const workspaceRoot = path.resolve(projectRoot, '../');

const config = getDefaultConfig(projectRoot);

// Ensure we only watch relevant folders if needed, but default is usually fine for standalone
// If we needed access to root node_modules or packages:
// config.watchFolders = [workspaceRoot];
// config.resolver.nodeModulesPaths = [
//   path.resolve(projectRoot, 'node_modules'),
//   path.resolve(workspaceRoot, 'node_modules'),
// ];

module.exports = config;
