import { createClient, RedisClientType } from 'redis';
import { env } from '../config/environment';
import { logger } from '../config/logger';

/**
 * Redis caching service
 * Provides high-performance caching for API responses and computed data
 */
export class RedisService {
  private static instance: RedisService;
  private client: RedisClientType | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (!env.REDIS_URL) {
      logger.warn('Redis URL not provided, caching disabled');
      return;
    }

    try {
      const clientOptions: any = {
        url: env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
        },
      };
      
      if (env.REDIS_PASSWORD) {
        clientOptions.password = env.REDIS_PASSWORD;
      }
      
      this.client = createClient(clientOptions);

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.client !== null && this.isConnected;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const value = await this.client!.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis get error:', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client!.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client!.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      logger.error('Redis set error:', { key, error });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client!.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis delete error:', { key, error });
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<number> {
    if (!this.isAvailable() || keys.length === 0) {
      return 0;
    }

    try {
      const result = await this.client!.del(keys);
      return result;
    } catch (error) {
      logger.error('Redis deleteMany error:', { keys, error });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', { key, error });
      return false;
    }
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client!.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error('Redis expire error:', { key, ttlSeconds, error });
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return -1;
    }

    try {
      return await this.client!.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error:', { key, error });
      return -1;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, value: number = 1): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      return await this.client!.incrBy(key, value);
    } catch (error) {
      logger.error('Redis increment error:', { key, value, error });
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key: string, value: number = 1): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      return await this.client!.decrBy(key, value);
    } catch (error) {
      logger.error('Redis decrement error:', { key, value, error });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    memory: any;
    keyspace: any;
    clients: any;
  }> {
    if (!this.isAvailable()) {
      return {
        connected: false,
        memory: null,
        keyspace: null,
        clients: null,
      };
    }

    try {
      const info = await this.client!.info();
      const lines = info.split('\r\n');
      
      const memory: any = {};
      const keyspace: any = {};
      const clients: any = {};

      lines.forEach(line => {
        if (line.startsWith('used_memory:')) {
          const value = line.split(':')[1];
          if (value) memory.used = parseInt(value);
        } else if (line.startsWith('used_memory_peak:')) {
          const value = line.split(':')[1];
          if (value) memory.peak = parseInt(value);
        } else if (line.startsWith('connected_clients:')) {
          const value = line.split(':')[1];
          if (value) clients.connected = parseInt(value);
        } else if (line.startsWith('db0:')) {
          const dbInfo = line.split(':')[1];
          if (dbInfo) {
            const parts = dbInfo.split(',');
            parts.forEach(part => {
              const [key, value] = part.split('=');
              if (key && value) {
                keyspace[key] = parseInt(value);
              }
            });
          }
        }
      });

      return {
        connected: true,
        memory,
        keyspace,
        clients,
      };
    } catch (error) {
      logger.error('Redis stats error:', error);
      return {
        connected: false,
        memory: null,
        keyspace: null,
        clients: null,
      };
    }
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.flushAll();
      return true;
    } catch (error) {
      logger.error('Redis clear error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const redisService = RedisService.getInstance();

// Convenience functions
export const getCache = <T>(key: string): Promise<T | null> => redisService.get<T>(key);
export const setCache = (key: string, value: any, ttlSeconds?: number): Promise<boolean> => 
  redisService.set(key, value, ttlSeconds);
export const deleteCache = (key: string): Promise<boolean> => redisService.delete(key);
export const existsCache = (key: string): Promise<boolean> => redisService.exists(key);
export const clearCache = (): Promise<boolean> => redisService.clear();
