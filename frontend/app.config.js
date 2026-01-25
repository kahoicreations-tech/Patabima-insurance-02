// Dynamic Expo config to keep dev startup fast.
// In dev (expo start / Expo Go), disable OTA update checks that can stall on "New update available, downloading...".

const staticConfig = require('./app.json');

module.exports = ({ config }) => {
  const base = staticConfig?.expo || config || {};
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    ...base,
    updates: {
      ...(base.updates || {}),
      enabled: !isDev,
      checkAutomatically: isDev ? 'NEVER' : (base.updates?.checkAutomatically || 'ON_LOAD'),
      fallbackToCacheTimeout: base.updates?.fallbackToCacheTimeout ?? 0,
      ...(isDev ? { url: undefined } : {}),
    },
  };
};
