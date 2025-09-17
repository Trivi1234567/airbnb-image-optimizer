import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../config/logger';
import { env } from '../config/environment';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + env.RATE_LIMIT_WINDOW_MS
      });
      return true;
    }

    if (now > entry.resetTime) {
      // Reset the counter
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + env.RATE_LIMIT_WINDOW_MS
      });
      return true;
    }

    if (entry.count >= env.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }

    entry.count++;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

const rateLimiter = new RateLimiter();

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const identifier = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    
    // More lenient rate limiting for job status polling
    const isJobStatusRequest = req.url.includes('/api/v1/job/');
    const maxRequests = isJobStatusRequest ? 30 : env.RATE_LIMIT_MAX_REQUESTS; // 30 requests per minute for job status
    
    const now = Date.now();
    const entry = rateLimiter['requests'].get(identifier);

    if (!entry) {
      rateLimiter['requests'].set(identifier, {
        count: 1,
        resetTime: now + env.RATE_LIMIT_WINDOW_MS
      });
    } else if (now > entry.resetTime) {
      // Reset the counter
      rateLimiter['requests'].set(identifier, {
        count: 1,
        resetTime: now + env.RATE_LIMIT_WINDOW_MS
      });
    } else if (entry.count >= maxRequests) {
      logger.warn('Rate limit exceeded', { identifier, ip: req.ip, maxRequests });
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Too many requests. Please try again later.',
            details: {
              limit: maxRequests,
              windowMs: env.RATE_LIMIT_WINDOW_MS
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: HTTP_STATUS.TOO_MANY_REQUESTS }
      );
    } else {
      entry.count++;
    }

    return handler(req);
  };
}
