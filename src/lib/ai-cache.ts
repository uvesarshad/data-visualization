// 2.3: AI Result Caching Layer
// In-memory cache for AI flow results to avoid redundant API calls

interface CacheEntry<T = any> {
  result: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Simple hash function for cache keys
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a cache key from flow name and input
 */
export function generateCacheKey(flowName: string, input: any): string {
  const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
  return `${flowName}:${simpleHash(inputStr)}`;
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