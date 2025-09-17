import { NextRequest, NextResponse } from 'next/server';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { logger } from '../config/logger';

const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

export function withRequestValidation(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Check request size
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      logger.warn('Request too large', {
        contentLength: parseInt(contentLength),
        maxSize: MAX_REQUEST_SIZE,
        url: req.url,
        method: req.method
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Request too large',
            details: {
              maxSize: `${MAX_REQUEST_SIZE} bytes`,
              receivedSize: `${contentLength} bytes`
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check content type for POST requests
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        logger.warn('Invalid content type', {
          contentType,
          url: req.url,
          method: req.method
        });

        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Content-Type must be application/json'
            },
            timestamp: new Date().toISOString()
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // Validate URL length
    if (req.url.length > 2048) {
      logger.warn('URL too long', {
        urlLength: req.url.length,
        url: req.url,
        method: req.method
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'URL too long'
          },
          timestamp: new Date().toISOString()
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    return handler(req);
  };
}
