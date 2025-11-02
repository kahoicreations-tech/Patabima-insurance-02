import AsyncStorage from '@react-native-async-storage/async-storage';

// Lightweight TTL cache with in-memory fast path and AsyncStorage persistence
// Keys should be short strings; values must be JSON-serializable
const MEMORY = new Map();
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PREFIX = 'PB_CACHE_v1:';

function now() {
  return Date.now();
}

export async function getCache(key) {
  const k = PREFIX + key;
  const mem = MEMORY.get(k);
  if (mem && mem.expiresAt > now()) {
    return mem.value;
  } else if (mem) {
    MEMORY.delete(k);
  }

  try {
    const raw = await AsyncStorage.getItem(k);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.expiresAt && parsed.expiresAt > now()) {
      MEMORY.set(k, { value: parsed.value, expiresAt: parsed.expiresAt });
      return parsed.value;
    }
    // expired
    await AsyncStorage.removeItem(k);
  } catch {}
  return null;
}

export async function setCache(key, value, ttlMs = DEFAULT_TTL_MS) {
  const k = PREFIX + key;
  const expiresAt = now() + Math.max(1, ttlMs | 0);
  const entry = { value, expiresAt };
  MEMORY.set(k, entry);
  try {
    await AsyncStorage.setItem(k, JSON.stringify(entry));
  } catch {}
}

export async function delCache(key) {
  const k = PREFIX + key;
  MEMORY.delete(k);
  try { await AsyncStorage.removeItem(k); } catch {}
}

export async function clearAllCache() {
  // Soft clear memory first
  MEMORY.clear();
  // Hard clear storage keys with prefix
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter(k => k.startsWith(PREFIX));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {}
}

// Helper to create stable keys from parts (ignores undefined/null and trims)
export function makeKey(parts) {
  const cleaned = parts
    .filter(p => p !== undefined && p !== null && p !== '')
    .map(p => (typeof p === 'string' ? p.trim() : String(p)));
  return cleaned.join('|');
}

export const SimpleCache = {
  get: getCache,
  set: setCache,
  del: delCache,
  clearAll: clearAllCache,
  makeKey,
  DEFAULT_TTL_MS,
};

export default SimpleCache;
