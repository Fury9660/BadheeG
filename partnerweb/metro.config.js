const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Explicitly set the project root to this directory
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

module.exports = config;
