const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
    // Adds support for `.db` files for SQLite databases
    'db',
    // Adds support for AR models
    'glb', 'gltf', 'usdz', 'obj', 'mtl'
);

module.exports = config;
