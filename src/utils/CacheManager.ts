import { logger } from './logger';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // seconds
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private namespace: string;

  constructor(namespace: string = 'default') {
    this.namespace = namespace;
    
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    logger.debug(`CacheManager initialized for namespace: ${namespace}`);
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) > (entry.ttl * 1000);
  }

  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      logger.debug(`Cache miss for key: ${fullKey}`);
      return null;
    }

    if (this.isExpired(entry)) {
      logger.debug(`Cache expired for key: ${fullKey}`);
      this.cache.delete(fullKey);
      return null;
    }

    logger.debug(`Cache hit for key: ${fullKey}`);
    return entry.data as T;
  }

  async set<T = any>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    const fullKey = this.getKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds
    };

    this.cache.set(fullKey, entry);
    logger.debug(`Cache set for key: ${fullKey}, TTL: ${ttlSeconds}s`);
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    const deleted = this.cache.delete(fullKey);
    
    if (deleted) {
      logger.debug(`Cache deleted for key: ${fullKey}`);
    }
    
    return deleted;
  }

  async clear(): Promise<void> {
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.startsWith(`${this.namespace}:`));
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    logger.debug(`Cache cleared for namespace: ${this.namespace}, deleted ${keysToDelete.length} entries`);
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(fullKey);
      return false;
    }

    return true;
  }

  async keys(): Promise<string[]> {
    const prefix = `${this.namespace}:`;
    return Array.from(this.cache.keys())
      .filter(key => key.startsWith(prefix))
      .map(key => key.substring(prefix.length));
  }

  async size(): Promise<number> {
    const prefix = `${this.namespace}:`;
    return Array.from(this.cache.keys())
      .filter(key => key.startsWith(prefix)).length;
  }

  // Get cache statistics
  async stats(): Promise<{
    namespace: string;
    totalEntries: number;
    hitRate?: number;
    memoryUsage: number;
  }> {
    const totalEntries = await this.size();
    
    // Calculate approximate memory usage
    let memoryUsage = 0;
    const prefix = `${this.namespace}:`;
    
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        // Rough estimation of memory usage
        memoryUsage += JSON.stringify(entry).length;
      }
    }

    return {
      namespace: this.namespace,
      totalEntries,
      memoryUsage
    };
  }

  // Advanced cache operations
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    logger.debug(`Cache miss for key: ${key}, fetching data...`);
    const data = await fetchFunction();
    await this.set(key, data, ttlSeconds);
    
    return data;
  }

  async mget<T = any>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    
    for (const key of keys) {
      result[key] = await this.get<T>(key);
    }

    return result;
  }

  async mset<T = any>(entries: Record<string, T>, ttlSeconds: number = 300): Promise<void> {
    const promises = Object.entries(entries).map(([key, value]) =>
      this.set(key, value, ttlSeconds)
    );

    await Promise.all(promises);
  }

  // Pattern matching for keys
  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];
    const prefix = `${this.namespace}:`;

    for (const fullKey of this.cache.keys()) {
      if (fullKey.startsWith(prefix)) {
        const key = fullKey.substring(prefix.length);
        if (regex.test(key)) {
          keysToDelete.push(fullKey);
        }
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    logger.debug(`Deleted ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
    return keysToDelete.length;
  }

  // Refresh TTL for existing entry
  async touch(key: string, ttlSeconds?: number): Promise<boolean> {
    const fullKey = this.getKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry || this.isExpired(entry)) {
      return false;
    }

    entry.timestamp = Date.now();
    if (ttlSeconds !== undefined) {
      entry.ttl = ttlSeconds;
    }

    logger.debug(`Cache entry touched for key: ${fullKey}`);
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    const prefix = `${this.namespace}:`;

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(prefix) && this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      logger.debug(`Cache cleanup: removed ${keysToDelete.length} expired entries from namespace ${this.namespace}`);
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Final cleanup
    this.cleanup();
    
    logger.debug(`CacheManager shut down for namespace: ${this.namespace}`);
  }
}