import { GetJobStatus } from './GetJobStatus';
import { IJobRepository } from '@/domain/repositories/IJobRepository';
import { JobStatusRequest } from '../dto/OptimizationRequest.dto';
import { OptimizationJob, JobStatus } from '@/domain/entities/OptimizationJob';
import { RoomType } from '@/domain/entities/RoomType';

// Mock implementation
const mockJobRepository: jest.Mocked<IJobRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
  findByStatus: jest.fn(),
  findExpiredJobs: jest.fn()
};

describe('GetJobStatus', () => {
  let getJobStatus: GetJobStatus;

  beforeEach(() => {
    jest.clearAllMocks();
    getJobStatus = new GetJobStatus(mockJobRepository);
    // Clear cache before each test
    getJobStatus.clearCache();
  });

  describe('execute', () => {
    it('should return job status for existing job', async () => {
      const request: JobStatusRequest = {
        jobId: 'test-job-id'
      };

      const mockJob: OptimizationJob = {
        id: 'test-job-id',
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        status: JobStatus.PROCESSING,
        images: [
          {
            id: 'image-1',
            originalUrl: 'https://example.com/image1.jpg',
            fileName: 'image_1.jpg',
            processingStatus: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        imagePairs: [
          {
            original: {
              id: 'image-1',
              originalUrl: 'https://example.com/image1.jpg',
              fileName: 'image_1.jpg',
              processingStatus: 'completed',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            optimized: {
              id: 'image-1-opt',
              originalUrl: 'https://example.com/image1.jpg',
              fileName: 'bedroom_1.jpg',
              processingStatus: 'completed',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            roomType: RoomType.BEDROOM,
            fileName: 'bedroom_1.jpg'
          }
        ],
        progress: { total: 1, completed: 1, failed: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockJobRepository.findById.mockResolvedValue(mockJob);

      const result = await getJobStatus.execute(request);

      expect(result.jobId).toBe('test-job-id');
      expect(result.status).toBe(JobStatus.PROCESSING);
      expect(result.progress).toEqual({ total: 1, completed: 1, failed: 0 });
      expect(result.currentStep).toBe('Processing images');
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.totalImages).toBe(1);
      expect(result.metadata?.completedImages).toBe(1);
      expect(result.metadata?.failedImages).toBe(0);
    });

    it('should return job status from cache for completed job', async () => {
      const request: JobStatusRequest = {
        jobId: 'test-job-id'
      };

      const mockJob: OptimizationJob = {
        id: 'test-job-id',
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        status: JobStatus.COMPLETED,
        images: [],
        imagePairs: [],
        progress: { total: 0, completed: 0, failed: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      };

      // First call - should fetch from repository and cache
      mockJobRepository.findById.mockResolvedValue(mockJob);
      const result1 = await getJobStatus.execute(request);
      expect(result1.status).toBe(JobStatus.COMPLETED);

      // Clear the mock to test cache
      mockJobRepository.findById.mockClear();
      
      // Second call - should use cache (no repository call)
      const result2 = await getJobStatus.execute(request);
      expect(result2.status).toBe(JobStatus.COMPLETED);
      expect(mockJobRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent job', async () => {
      const request: JobStatusRequest = {
        jobId: 'non-existent-job-id'
      };

      mockJobRepository.findById.mockResolvedValue(null);

      await expect(getJobStatus.execute(request)).rejects.toMatchObject({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job with ID non-existent-job-id not found'
        }
      });
    });

    it('should handle repository errors', async () => {
      const request: JobStatusRequest = {
        jobId: 'test-job-id'
      };

      mockJobRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(getJobStatus.execute(request)).rejects.toMatchObject({
        success: false,
        error: {
          code: 'JOB_STATUS_FAILED',
          message: 'Database error'
        }
      });
    });

    it('should return correct current step for different statuses', async () => {
      const request: JobStatusRequest = {
        jobId: 'test-job-id'
      };

      const statuses = [
        { status: JobStatus.PENDING, expectedStep: 'Job queued' },
        { status: JobStatus.SCRAPING, expectedStep: 'Scraping Airbnb listing' },
        { status: JobStatus.PROCESSING, expectedStep: 'Processing images' },
        { status: JobStatus.COMPLETED, expectedStep: 'Job completed' },
        { status: JobStatus.FAILED, expectedStep: 'Job failed' },
        { status: JobStatus.CANCELLED, expectedStep: 'Job cancelled' }
      ];

      for (const { status, expectedStep } of statuses) {
        // Clear cache before each iteration
        getJobStatus.clearCache();
        
        const mockJob: OptimizationJob = {
          id: 'test-job-id',
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
          status,
          images: [],
          imagePairs: [],
          progress: { total: 0, completed: 0, failed: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockJobRepository.findById.mockResolvedValue(mockJob);
        const result = await getJobStatus.execute(request);
        expect(result.currentStep).toBe(expectedStep);
      }
    });
  });

  describe('cache management', () => {
    it('should invalidate cache for specific job', () => {
      expect(() => getJobStatus.invalidateCache('test-job-id')).not.toThrow();
    });

    it('should clear entire cache', () => {
      expect(() => getJobStatus.clearCache()).not.toThrow();
    });

    it('should return cache statistics', () => {
      const stats = getJobStatus.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });
});
