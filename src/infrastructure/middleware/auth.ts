import { NextRequest, NextResponse } from 'next/server';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { logger } from '../config/logger';

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    
    // For now, this is a placeholder implementation
    // In production, you would verify JWT tokens here
    if (!authHeader) {
      logger.warn('Request without authorization header', {
        url: req.url,
        method: req.method,
        ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      });
      
      // For MVP, we'll allow requests without auth
      // In production, uncomment the following:
      /*
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Authorization header required'
          },
          timestamp: new Date().toISOString()
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
      */
    } else {
      // Validate JWT token (placeholder implementation)
      try {
        const token = authHeader.replace('Bearer ', '');
        
        // TODO: Implement actual JWT verification
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = decoded;
        
        logger.debug('Request authenticated', {
          url: req.url,
          method: req.method,
          hasToken: !!token
        });
      } catch (error) {
        logger.warn('Invalid authorization token', {
          url: req.url,
          method: req.method,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.UNAUTHORIZED,
              message: 'Invalid authorization token'
            },
            timestamp: new Date().toISOString()
          },
          { status: HTTP_STATUS.UNAUTHORIZED }
        );
      }
    }

    return handler(req);
  };
}
