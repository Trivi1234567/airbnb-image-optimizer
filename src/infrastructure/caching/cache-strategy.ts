import { redisService } from './redis';
import { cache } from '../config/environment';
import { logger } from '../config/logger';

/**
 * Cache key generators
 */
export const CacheKeys = {
  // Job-related keys
  job: (jobId: string) => `job:${jobId}`,
  jobStatus: (jobId: string) => `job:status:${jobId}`,
  jobProgress: (jobId: string) => `job:progress:${jobId}`,
  
  // Image-related keys
  image: (imageId: string) => `image:${imageId}`,
  imageAnalysis: (imageId: string) => `image:analysis:${imageId}`,
  imageOptimized: (imageId: string) => `image:optimized:${imageId}`,
  
  // API response keys
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  
  // Rate limiting keys
  rateLimit: (identifier: string) => `rate:${identifier}`,
  
  // External service keys
  apifyResult: (url: string) => `apify:${Buffer.from(url).toString('base64')}`,
  geminiAnalysis: (imageHash: string) => `gemini:analysis:${imageHash}`,
  geminiOptimization: (imageHash: string, roomType: string) => `gemini:optimization:${imageHash}:${roomType}`,
} as const;

/**
 * Cache strategy interface
 */
export interface CacheStrategy {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
}

/**
 * Redis cache strategy implementation
 */
export class RedisCacheStrategy implements CacheStrategy {
  async get<T>(key: string): Promise<T | null> {
    return redisService.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    return redisService.set(key, value, ttl);
  }

  async delete(key: string): Promise<boolean> {
    return redisService.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return redisService.exists(key);
  }
}

/**
 * Memory cache strategy implementation (fallback)
 */
export class MemoryCacheStrategy implements CacheStrategy {
  private cache = new Map<string, { value: any; expires: number }>();
  private maxSize = 1000;

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      // Remove oldest items if cache is full
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      const expires = Date.now() + (ttl || cache.ttl.default) * 1000;
      this.cache.set(key, { value, expires });
      return true;
    } catch (error) {
      logger.error('Memory cache set error:', { key, error });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear expired items
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

/**
 * Cache manager with fallback strategy
 */
export class CacheManager {
  private static instance: CacheManager;
  private primaryStrategy: CacheStrategy;
  private fallbackStrategy: CacheStrategy;

  private constructor() {
    this.primaryStrategy = new RedisCacheStrategy();
    this.fallbackStrategy = new MemoryCacheStrategy();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get value from cache with fallback
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try primary strategy first
      if (redisService.isAvailable()) {
        return await this.primaryStrategy.get<T>(key);
      }
      
      // Fallback to memory cache
      return await this.fallbackStrategy.get<T>(key);
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache with fallback
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      // Try primary strategy first
      if (redisService.isAvailable()) {
        return await this.primaryStrategy.set(key, value, ttl);
      }
      
      // Fallback to memory cache
      return await this.fallbackStrategy.set(key, value, ttl);
    } catch (error) {
      logger.error('Cache set error:', { key, error });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const primaryResult = await this.primaryStrategy.delete(key);
      const fallbackResult = await this.fallbackStrategy.delete(key);
      return primaryResult || fallbackResult;
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (redisService.isAvailable()) {
        return await this.primaryStrategy.exists(key);
      }
      
      return await this.fallbackStrategy.exists(key);
    } catch (error) {
      logger.error('Cache exists error:', { key, error });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    primary: any;
    fallback: any;
  }> {
    try {
      const primary = redisService.isAvailable() 
        ? await redisService.getStats()
        : { connected: false };
      
      const fallback = (this.fallbackStrategy as MemoryCacheStrategy).getStats();
      
      return { primary, fallback };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return {
        primary: { connected: false },
        fallback: { size: 0, maxSize: 0 },
      };
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Convenience functions
export const getCached = <T>(key: string): Promise<T | null> => cacheManager.get<T>(key);
export const setCached = (key: string, value: any, ttl?: number): Promise<boolean> => 
  cacheManager.set(key, value, ttl);
export const deleteCached = (key: string): Promise<boolean> => cacheManager.delete(key);
export const existsCached = (key: string): Promise<boolean> => cacheManager.exists(key);
export const getCacheStats = () => cacheManager.getStats();
