import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../config/logger';

export function withRequestLogging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    // Add request ID to headers for tracing
    req.headers.set('x-request-id', requestId);

    logger.info('Request started', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    });

    try {
      const response = await handler(req);
      
      const duration = Date.now() - startTime;
      
      logger.info('Request completed', {
        requestId,
        method: req.method,
        url: req.url,
        status: response.status,
        duration: `${duration}ms`
      });

      // Add request ID to response headers
      response.headers.set('x-request-id', requestId);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Request failed', {
        requestId,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  };
}
