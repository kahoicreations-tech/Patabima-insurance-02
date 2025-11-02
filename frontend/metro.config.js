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

// Helper to escape paths for safe usage in RegExp
function escapeForRegExp(p) {
  return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Exclude heavy, non-frontend folders using ABSOLUTE paths only
// This avoids accidental matches like "axios" (contains "ios") or any "dist" inside node_modules
const repoRoot = path.resolve(__dirname, '..');
const absoluteExcludes = [
  path.resolve(repoRoot, '_archive'),
  path.resolve(repoRoot, 'docs'),
  path.resolve(repoRoot, 'documentss'),
  path.resolve(repoRoot, 'insurance-app'),
  path.resolve(repoRoot, 'backend'),
  path.resolve(repoRoot, 'amplify'),
];
const patterns = absoluteExcludes.map((absPath) => new RegExp(`${escapeForRegExp(absPath)}[\\/].*`));
const blockListRE = makeBlockList(patterns);

// Ensure resolver exists and assign the proper field used by current Metro
config.resolver = config.resolver || {};
config.resolver.blockList = blockListRE;

// Performance optimizations for faster startup
config.maxWorkers = 2; // Limit CPU usage for faster startup

// Optimize resolver performance (keep defaults reasonable)
config.resolver.platforms = ['ios', 'android', 'web'];
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];

// Enable package exports to support modern libraries like axios
config.resolver.unstable_enablePackageExports = true;

// Keep defaults for main fields to let Expo choose the right entry points

module.exports = config;
