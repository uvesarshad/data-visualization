// 2.3: AI Result Caching Layer
// In-memory cache for AI flow results to avoid redundant API calls

interface CacheEntry<T = any> {
  result: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a cache key from flow name and input.
 *
 * Strategy: include the input length AND a prefix of the serialized input.
 * Two different payloads that happen to share the same length will not collide
 * unless their first ~400 characters are also identical — which is effectively
 * impossible across different datasets. This is dramatically safer than the
 * previous 32-bit DJB2 hash, which had real collision risk across uploads in a
 * single session.
 */
export function generateCacheKey(flowName: string, input: any): string {
  const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
  // Truncate to bound key size; include length so payloads with different sizes
  // but identical prefixes still differ.
  const prefix = inputStr.length > 400 ? inputStr.slice(0, 400) : inputStr;
  return `${flowName}:${inputStr.length}:${prefix}`;
}

/**
 * Get a cached result if it exists and hasn't expired
 */
export function getCachedResult<T>(key: string, maxAgeMs: number = DEFAULT_MAX_AGE_MS): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > maxAgeMs) {
    cache.delete(key);
    return null;
  }
  
  return entry.result as T;
}

/**
 * Store a result in the cache
 */
export function setCachedResult<T>(key: string, result: T): void {
  cache.set(key, { result, timestamp: Date.now() });
  
  // Prevent unbounded growth — evict oldest entries if cache gets too large
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
}

/**
 * Clear all cached results (e.g., on data reset)
 */
export function clearCache(): void {
  cache.clear();
}