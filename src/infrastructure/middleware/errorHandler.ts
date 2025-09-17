import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { ApiError } from '@/application/dto/OptimizationResponse.dto';

export function createErrorResponse(error: unknown, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR): NextResponse {
  let apiError: ApiError;

  if (error instanceof ZodError) {
    apiError = {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      },
      timestamp: new Date().toISOString()
    };
  } else if (error && typeof error === 'object' && 'success' in error) {
    // Re-throw API errors as-is
    apiError = error as ApiError;
  } else {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    logger.error('Unhandled error', { error: message, stack: error instanceof Error ? error.stack : undefined });
    
    apiError = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'An internal server error occurred' 
          : message,
        details: process.env.NODE_ENV === 'production' ? undefined : { stack: error instanceof Error ? error.stack : undefined }
      },
      timestamp: new Date().toISOString()
    };
  }

  return NextResponse.json(apiError, { status: statusCode });
}

export function withErrorHandling(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}
