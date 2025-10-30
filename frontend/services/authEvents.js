// Lightweight pub/sub for auth-related global events
// Usage:
//  - apiConfig: emitUnauthorized({ status, url }) when a 401 occurs
//  - AuthContext: subscribeUnauthorized(cb) to immediately react (logout)

const listeners = new Set();

export function subscribeUnauthorized(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function emitUnauthorized(payload = {}) {
  for (const cb of Array.from(listeners)) {
    try { cb(payload); } catch (_) {}
  }
}

export default { subscribeUnauthorized, emitUnauthorized };
