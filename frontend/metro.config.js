const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Create a robust blockList RegExp regardless of Metro version
function makeBlockList(patterns) {
  // Try to use Metro's helper if available
  try {
    const fn = require('metro-config').exclusionList;
    if (typeof fn === 'function') return fn(patterns);
  } catch {}
  try {
    const fn = require('metro-config/src/defaults/exclusionList');
    if (typeof fn === 'function') return fn(patterns);
  } catch {}
  try {
    const fn = require('metro-config/src/defaults/blacklist');
    if (typeof fn === 'function') return fn(patterns);
  } catch {}
  // Fallback: merge all sources into a single RegExp
  return new RegExp(patterns.map((p) => p.source).join('|'));
}

const config = getDefaultConfig(__dirname);

// Properly exclude large non-frontend folders to speed up bundling and file watching
const patterns = [
  /_archive\/.*/,
  /docs\/.*/,
  /documentss\/.*/,
  /scripts\/.*/,
  /insurance-app\/.*/,
  /backend\/.*/,
  /amplify\/.*/,
  // Large local environment folders inside the frontend project
  /venv\/.*/,
  /\.venv\/.*/,
  /dist\/.*/,
  /coverage\/.*/,
  /android\/.*/,
  /ios\/.*/,
  /\.expo\/.*/,
  // NOTE: Do NOT exclude generic /src/ — it would block node_modules/expo/src
];
const blockListRE = makeBlockList(patterns);

// Ensure resolver exists and assign the proper field used by current Metro
config.resolver = config.resolver || {};
config.resolver.blockList = blockListRE;

// Performance optimizations for faster startup
config.maxWorkers = 2; // Limit CPU usage for faster startup

// Optimize file watching performance - include node_modules for memoize-one fix
config.watchFolders = [
  __dirname,
  path.resolve(__dirname, 'node_modules')
];

// Optimize resolver performance
config.resolver.platforms = ['ios', 'android', 'web'];
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];

// Fix React Native 0.79.6 memoize-one resolution bug
// Explicitly map memoize-one to its installed location
config.resolver.extraNodeModules = {
  'memoize-one': path.resolve(__dirname, 'node_modules/memoize-one')
};

module.exports = config;
