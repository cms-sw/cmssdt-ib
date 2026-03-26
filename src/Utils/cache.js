const DEFAULT_PREFIX = "cmssdt-cache";

export function getCacheKey(key) {
  return `${DEFAULT_PREFIX}:${key}`;
}

export function setCacheItem(key, data, ttlMs) {
  try {
    const payload = {
      data,
      expiresAt: Date.now() + ttlMs
    };
    localStorage.setItem(getCacheKey(key), JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error("Failed to write cache:", error);
    return false;
  }
}

export function getCacheItem(key) {
  try {
    const raw = localStorage.getItem(getCacheKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(getCacheKey(key));
      return null;
    }

    return parsed.data ?? null;
  } catch (error) {
    console.error("Failed to read cache:", error);
    return null;
  }
}

export function removeCacheItem(key) {
  try {
    localStorage.removeItem(getCacheKey(key));
  } catch (error) {
    console.error("Failed to remove cache:", error);
  }
}

export function clearCacheByPrefix(prefix = DEFAULT_PREFIX) {
  try {
    const fullPrefix = `${prefix}:`;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(fullPrefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Failed to clear cache by prefix:", error);
  }
}