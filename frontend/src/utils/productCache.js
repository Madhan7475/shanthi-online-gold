/**
 * Simple in-memory cache for product detail payloads to reduce perceived load time
 * when navigating between listing pages and product detail pages.
 *
 * - Default TTL: 4 minutes
 * - Keyed by product id (string)
 * - No persistence across reloads (in-memory only)
 */
const DEFAULT_TTL_MS = 4 * 60 * 1000; // 4 minutes
const store = new Map();

export const productCache = {
    get(id) {
        if (!id) return null;
        const key = String(id);
        const entry = store.get(key);
        if (!entry) return null;

        const now = Date.now();
        const ttl = Number.isFinite(entry.ttl) ? entry.ttl : DEFAULT_TTL_MS;
        if (now - entry.t > ttl) {
            store.delete(key);
            return null;
        }
        return entry.data || null;
    },

    set(id, data, ttlMs = DEFAULT_TTL_MS) {
        if (!id || !data) return;
        const key = String(id);
        store.set(key, { data, t: Date.now(), ttl: Number(ttlMs) });
    },

    clear() {
        store.clear();
    },
};
