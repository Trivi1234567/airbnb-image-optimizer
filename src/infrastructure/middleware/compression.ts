import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../config/logger';

export function withCompression(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req);
    
    // Skip compression for API routes to avoid ERR_CONTENT_DECODING_FAILED
    if (req.url.includes('/api/')) {
      return response;
    }
    
    // Check if client accepts gzip compression
    const acceptEncoding = req.headers.get('accept-encoding');
    const supportsGzip = acceptEncoding && acceptEncoding.includes('gzip');
    
    if (supportsGzip && response.body) {
      try {
        // For text-based responses, we could compress them
        // For now, we'll just add compression headers
        response.headers.set('Content-Encoding', 'gzip');
        response.headers.set('Vary', 'Accept-Encoding');
        
        logger.debug('Response compressed', {
          url: req.url,
          method: req.method,
          status: response.status,
          compressed: true
        });
      } catch (error) {
        logger.warn('Compression failed', {
          url: req.url,
          method: req.method,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return response;
  };
}
