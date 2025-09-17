import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/infrastructure/middleware/rateLimiter';
import { withErrorHandling } from '@/infrastructure/middleware/errorHandler';
import { withRequestLogging } from '@/infrastructure/middleware/requestLogger';
import { withAuth } from '@/infrastructure/middleware/auth';
import { withRequestValidation } from '@/infrastructure/middleware/requestValidator';
import { withCompression } from '@/infrastructure/middleware/compression';
import { container } from '@/infrastructure/di/container';
import { HTTP_STATUS } from '@/infrastructure/config/constants';
import { z } from 'zod';

const DownloadRequestSchema = z.object({
  jobId: z.string().uuid('Invalid job ID format'),
  imageId: z.string().min(1, 'Image ID is required')
});

// interface RouteParams {
//   params: {
//     jobId: string;
//     imageId: string;
//   };
// }

async function handleDownloadRequest(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'GET') {
    return NextResponse.json(
      { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET method allowed' } },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    // Extract parameters from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.length - 2];
    const imageId = pathParts[pathParts.length - 1];

    // Validate parameters
    let validatedRequest;
    try {
      validatedRequest = DownloadRequestSchema.parse({ 
        jobId, 
        imageId 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
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

    console.log('Image download request received', { 
      jobId: validatedRequest.jobId,
      imageId: validatedRequest.imageId 
    });

    // Get the job repository to retrieve the optimized image
    const jobRepository = container.get('jobRepository') as any;
    const job = await jobRepository.findById(validatedRequest.jobId);
    
    if (!job) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'JOB_NOT_FOUND', 
            message: 'Job not found' 
          },
          timestamp: new Date().toISOString()
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Find the optimized image in the job's image pairs
    const imagePair = job.imagePairs.find((pair: any) => 
      pair.optimized && pair.optimized.id === validatedRequest.imageId
    );


    if (!imagePair || !imagePair.optimized || !imagePair.optimized.optimizedBase64) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'IMAGE_NOT_FOUND', 
            message: 'Optimized image not found' 
          },
          timestamp: new Date().toISOString()
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imagePair.optimized.optimizedBase64, 'base64');
    
    return new NextResponse(imageBuffer, {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="optimized-${imagePair.fileName}"`,
        'Cache-Control': 'public, max-age=3600',
        'ETag': `"${validatedRequest.imageId}-${Date.now()}"`
      }
    });

  } catch (error) {
    console.error('Image download request failed', { 
      error 
    });
    throw error;
  }
}

export const GET = withCompression(
  withRequestValidation(
    withAuth(
      withRequestLogging(
        withRateLimit(
          withErrorHandling(handleDownloadRequest)
        )
      )
    )
  )
);
