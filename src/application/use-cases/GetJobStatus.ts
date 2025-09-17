import { IJobRepository } from '@/domain/repositories/IJobRepository';
import { JobStatusRequest } from '../dto/OptimizationRequest.dto';
import { JobProgress, ApiError } from '../dto/OptimizationResponse.dto';
import { logger } from '@/infrastructure/config/logger';
import { OptimizationJob, JobStatus } from '@/domain/entities/OptimizationJob';

// Simple in-memory cache for completed jobs
class JobCache {
  private static instance: JobCache;
  private cache: Map<string, { job: OptimizationJob; cachedAt: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): JobCache {
    if (!JobCache.instance) {
      JobCache.instance = new JobCache();
    }
    return JobCache.instance;
  }

  set(jobId: string, job: OptimizationJob): void {
    this.cache.set(jobId, { job, cachedAt: Date.now() });
    logger.debug('Job cached', { jobId, status: job.status });
  }

  get(jobId: string): OptimizationJob | null {
    const cached = this.cache.get(jobId);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.cachedAt > this.CACHE_TTL) {
      this.cache.delete(jobId);
      logger.debug('Job cache expired', { jobId });
      return null;
    }

    logger.debug('Job retrieved from cache', { jobId, status: cached.job.status });
    return cached.job;
  }

  invalidate(jobId: string): void {
    this.cache.delete(jobId);
    logger.debug('Job cache invalidated', { jobId });
  }

  clear(): void {
    this.cache.clear();
    logger.debug('Job cache cleared');
  }
}

export class GetJobStatus {
  private cache: JobCache;

  constructor(private jobRepository: IJobRepository) {
    this.cache = JobCache.getInstance();
  }

  async execute(request: JobStatusRequest): Promise<JobProgress> {
    const operationId = `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.debug('Getting job status', { jobId: request.jobId, operationId });

      // Try cache first for completed jobs
      let job = this.cache.get(request.jobId);
      
      if (!job) {
        // Fetch from repository
        job = await this.jobRepository.findById(request.jobId);
        
        if (!job) {
          const apiError: ApiError = {
            success: false,
            error: {
              code: 'JOB_NOT_FOUND',
              message: `Job with ID ${request.jobId} not found`,
              details: { jobId: request.jobId }
            },
            timestamp: new Date().toISOString()
          };
          throw apiError;
        }

        // Cache completed jobs
        if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
          this.cache.set(request.jobId, job);
        }
      }

      const progress: JobProgress = {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: this.getCurrentStep(job.status),
        error: job.error,
        // Add additional metadata for monitoring
        metadata: {
          createdAt: job.createdAt.toISOString(),
          updatedAt: job.updatedAt.toISOString(),
          completedAt: job.completedAt?.toISOString(),
          totalImages: job.images.length,
          completedImages: job.imagePairs.filter(p => p.optimized).length,
          failedImages: job.imagePairs.filter(p => !p.optimized).length
        },
        // Include full job data when completed
        ...(job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED ? {
          job: {
            id: job.id,
            airbnbUrl: job.airbnbUrl,
            status: job.status,
            progress: job.progress,
            createdAt: job.createdAt.toISOString(),
            updatedAt: job.updatedAt.toISOString()
          },
          images: job.images.map(img => ({
            id: img.id,
            originalUrl: img.originalUrl,
            originalBase64: img.originalBase64,
            optimizedBase64: img.optimizedBase64,
            fileName: img.fileName,
            roomType: job.roomType || 'other',
            processingStatus: img.processingStatus,
            error: img.error
          })),
          imagePairs: job.imagePairs.map(pair => ({
            original: {
              id: pair.original.id,
              originalUrl: pair.original.originalUrl,
              originalBase64: pair.original.originalBase64,
              optimizedBase64: pair.original.optimizedBase64,
              fileName: pair.original.fileName,
              roomType: job.roomType || 'other',
              processingStatus: pair.original.processingStatus,
              error: pair.original.error
            },
            optimized: pair.optimized ? {
              id: pair.optimized.id,
              originalUrl: pair.optimized.originalUrl,
              originalBase64: pair.optimized.originalBase64,
              optimizedBase64: pair.optimized.optimizedBase64,
              fileName: pair.optimized.fileName,
              roomType: job.roomType || 'other',
              processingStatus: pair.optimized.processingStatus,
              error: pair.optimized.error
            } : undefined,
            roomType: pair.roomType,
            fileName: pair.fileName,
            optimizationComment: (pair as any).optimizationComment
          }))
        } : {})
      };

      // Debug logging to help identify the issue (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('GetJobStatus Debug:', {
          jobId: job.id,
          status: job.status,
          imagePairsCount: job.imagePairs.length,
          firstImagePair: job.imagePairs[0] ? {
            hasOptimized: !!job.imagePairs[0].optimized,
            hasOptimizedBase64: !!(job.imagePairs[0].optimized?.optimizedBase64),
            optimizedBase64Length: job.imagePairs[0].optimized?.optimizedBase64?.length || 0,
            originalUrl: job.imagePairs[0].original?.originalUrl,
            optimizedUrl: job.imagePairs[0].optimized?.originalUrl,
            roomType: job.imagePairs[0].roomType,
            fileName: job.imagePairs[0].fileName,
            optimizationComment: job.imagePairs[0].optimizationComment
          } : null
        });
      }

      logger.debug('Job status retrieved', { 
        jobId: request.jobId, 
        status: job.status, 
        operationId,
        fromCache: job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED
      });
      
      return progress;

    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error; // Re-throw API errors
      }
      
      logger.error('Failed to get job status', { 
        jobId: request.jobId, 
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      const apiError: ApiError = {
        success: false,
        error: {
          code: 'JOB_STATUS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: { jobId: request.jobId, operationId }
        },
        timestamp: new Date().toISOString()
      };
      
      throw apiError;
    }
  }

  private getCurrentStep(status: string): string {
    switch (status) {
      case 'pending':
        return 'Job queued';
      case 'scraping':
        return 'Scraping Airbnb listing';
      case 'processing':
        return 'Processing images';
      case 'completed':
        return 'Job completed';
      case 'failed':
        return 'Job failed';
      case 'cancelled':
        return 'Job cancelled';
      default:
        return 'Unknown status';
    }
  }

  // Public methods for cache management
  invalidateCache(jobId: string): void {
    this.cache.invalidate(jobId);
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Method to get cache statistics for monitoring
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache['cache'].size,
      keys: Array.from(this.cache['cache'].keys())
    };
  }
}
