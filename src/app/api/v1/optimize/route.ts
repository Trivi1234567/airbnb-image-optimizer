import { NextRequest, NextResponse } from 'next/server';
import { OptimizationRequestSchema } from '@/application/dto/OptimizationRequest.dto';
import { ProcessOptimizationJob } from '@/application/use-cases/ProcessOptimizationJob';
import { withRateLimit } from '@/infrastructure/middleware/rateLimiter';
import { withErrorHandling } from '@/infrastructure/middleware/errorHandler';
import { withRequestLogging } from '@/infrastructure/middleware/requestLogger';
import { withAuth } from '@/infrastructure/middleware/auth';
import { withRequestValidation } from '@/infrastructure/middleware/requestValidator';
import { withCompression } from '@/infrastructure/middleware/compression';
import { container } from '@/infrastructure/di/container';
import { HTTP_STATUS } from '@/infrastructure/config/constants';
// import { logger } from '@/infrastructure/config/logger';
import { ZodError } from 'zod';

async function handleOptimizeRequest(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method allowed' } },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Invalid JSON in request body' 
          },
          timestamp: new Date().toISOString()
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Validate request
    let validatedRequest;
    try {
      validatedRequest = OptimizationRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'VALIDATION_ERROR', 
              message: 'Validation failed',
              details: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
              }))
            },
            timestamp: new Date().toISOString()
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      throw error;
    }

    // Additional URL validation
    const urlObj = new URL(validatedRequest.airbnbUrl);
    const roomIdMatch = urlObj.pathname.match(/\/rooms\/(\d+)/);
    if (roomIdMatch && roomIdMatch[1] && roomIdMatch[1].length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_URL', 
            message: 'Please enter a valid Airbnb listing URL with a proper room ID (e.g., https://www.airbnb.com/rooms/1234567890123456)'
          },
          timestamp: new Date().toISOString()
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    console.log('Optimization request received', { 
      url: validatedRequest.airbnbUrl,
      maxImages: validatedRequest.maxImages 
    });

    // Get the optimization job service with error handling
    let processOptimizationJob;
    try {
      processOptimizationJob = container.get<ProcessOptimizationJob>('processOptimizationJob');
      console.log('Successfully retrieved processOptimizationJob from container');
    } catch (error) {
      console.error('Failed to get processOptimizationJob from container:', error);
      throw new Error(`Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const result = await processOptimizationJob.execute(validatedRequest);

    console.log('Optimization job started', { jobId: result.jobId });

    return NextResponse.json(result, { status: HTTP_STATUS.CREATED });

  } catch (error) {
    console.error('Optimization request failed', { error });
    throw error;
  }
}

export const POST = withCompression(
  withRequestValidation(
    withAuth(
      withRequestLogging(
        withRateLimit(
          withErrorHandling(handleOptimizeRequest)
        )
      )
    )
  )
);
