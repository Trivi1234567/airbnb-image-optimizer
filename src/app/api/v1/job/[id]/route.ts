import { NextRequest, NextResponse } from 'next/server';
import { JobStatusRequestSchema } from '@/application/dto/OptimizationRequest.dto';
import { GetJobStatus } from '@/application/use-cases/GetJobStatus';
import { withRateLimit } from '@/infrastructure/middleware/rateLimiter';
import { withErrorHandling } from '@/infrastructure/middleware/errorHandler';
import { withRequestLogging } from '@/infrastructure/middleware/requestLogger';
import { withAuth } from '@/infrastructure/middleware/auth';
import { withRequestValidation } from '@/infrastructure/middleware/requestValidator';
import { withCompression } from '@/infrastructure/middleware/compression';
import { container } from '@/infrastructure/di/container';
import { RobustJobRepository } from '@/infrastructure/repositories/JobManager';
import { HTTP_STATUS } from '@/infrastructure/config/constants';
// import { logger } from '@/infrastructure/config/logger';
import { ZodError } from 'zod';

// interface RouteParams {
//   params: {
//     id: string;
//   };
// }

async function handleJobStatusRequest(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'GET') {
    return NextResponse.json(
      { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET method allowed' } },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    // Extract job ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.length - 1];

    // Validate job ID
    let validatedRequest;
    try {
      validatedRequest = JobStatusRequestSchema.parse({ jobId });
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

    console.log('Job status request received', { jobId: validatedRequest.jobId });

    // Check job repository health first
    const jobRepository = container.get<RobustJobRepository>('jobRepository');
    const healthStatus = jobRepository.getHealthStatus();
    
    console.log('Job repository health check', { 
      jobId: validatedRequest.jobId, 
      totalJobs: healthStatus.totalJobs,
      availableJobs: healthStatus.availableJobs.slice(0, 5)
    });

    // Check if job exists in repository
    const jobExists = healthStatus.availableJobs.includes(validatedRequest.jobId);
    if (!jobExists) {
      console.warn('Job not found in repository', { 
        jobId: validatedRequest.jobId, 
        totalJobs: healthStatus.totalJobs,
        availableJobs: healthStatus.availableJobs.slice(0, 10)
      });
      
      return NextResponse.json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job with ID ${validatedRequest.jobId} not found`,
          details: { 
            jobId: validatedRequest.jobId, 
            totalJobs: healthStatus.totalJobs,
            availableJobs: healthStatus.availableJobs.slice(0, 10)
          }
        }
      }, { status: 404 });
    }

    const getJobStatus = container.get<GetJobStatus>('getJobStatus');
    const result = await getJobStatus.execute(validatedRequest);

    console.log('Job status retrieved', { 
      jobId: result.jobId, 
      status: result.status 
    });

    return NextResponse.json({
      success: true,
      data: result
    }, { 
      status: HTTP_STATUS.OK,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Job status request failed', { error });
    throw error;
  }
}

export const GET = withCompression(
  withRequestValidation(
    withAuth(
      withRequestLogging(
        withRateLimit(
          withErrorHandling(handleJobStatusRequest)
        )
      )
    )
  )
);
