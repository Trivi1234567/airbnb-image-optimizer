import { GET } from '@/app/api/v1/job/[id]/route';
import { NextRequest } from 'next/server';
import { container } from '@/infrastructure/di/container';
import { GetJobStatus } from '@/application/use-cases/GetJobStatus';
import { JobStatus } from '@/domain/entities/OptimizationJob';

// Mock the container
jest.mock('@/infrastructure/di/container', () => ({
  container: {
    get: jest.fn()
  }
}));

const mockContainer = container as jest.Mocked<typeof container>;

describe('/api/v1/job/[id] GET', () => {
  let mockGetJobStatus: jest.Mocked<GetJobStatus>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetJobStatus = {
      execute: jest.fn()
    } as any;

    mockContainer.get.mockReturnValue(mockGetJobStatus);
  });

  describe('successful requests', () => {
    it('should return job status for valid job ID', async () => {
      const mockJobProgress = {
        jobId: 'test-job-123',
        status: JobStatus.PROCESSING,
        progress: {
          total: 10,
          completed: 5,
          failed: 1
        },
        currentStep: 'Processing images',
        error: undefined
      };

      mockGetJobStatus.execute.mockResolvedValue(mockJobProgress);

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        data: mockJobProgress
      });
      expect(mockGetJobStatus.execute).toHaveBeenCalledWith({
        jobId: 'test-job-123'
      });
    });

    it('should return job status with error message', async () => {
      const mockJobProgress = {
        jobId: 'test-job-123',
        status: JobStatus.FAILED,
        progress: {
          total: 10,
          completed: 3,
          failed: 7
        },
        currentStep: 'Job failed',
        error: 'Processing failed due to API error'
      };

      mockGetJobStatus.execute.mockResolvedValue(mockJobProgress);

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.error).toBe('Processing failed due to API error');
    });

    it('should handle different job statuses', async () => {
      const statusTests = [
        { status: JobStatus.PENDING, expectedStep: 'Job queued' },
        { status: JobStatus.SCRAPING, expectedStep: 'Scraping Airbnb listing' },
        { status: JobStatus.PROCESSING, expectedStep: 'Processing images' },
        { status: JobStatus.COMPLETED, expectedStep: 'Job completed' },
        { status: JobStatus.FAILED, expectedStep: 'Job failed' },
        { status: JobStatus.CANCELLED, expectedStep: 'Job cancelled' }
      ];

      for (const test of statusTests) {
        const mockJobProgress = {
          jobId: 'test-job-123',
          status: test.status,
          progress: { total: 10, completed: 5, failed: 0 },
          currentStep: test.expectedStep,
          error: undefined
        };

        mockGetJobStatus.execute.mockResolvedValue(mockJobProgress);

        const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
        const params = { params: { id: 'test-job-123' } };

        const response = await GET(request, params);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.data.status).toBe(test.status);
        expect(responseData.data.currentStep).toBe(test.expectedStep);
      }
    });
  });

  describe('validation errors', () => {
    it('should reject invalid job ID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/job/invalid-id');
      const params = { params: { id: 'invalid-id' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty job ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/job/');
      const params = { params: { id: '' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject non-UUID job ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/job/123');
      const params = { params: { id: '123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('method validation', () => {
    it('should reject non-GET requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123', {
        method: 'POST'
      });
      const params = { params: { id: 'test-job-123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  describe('job not found', () => {
    it('should handle job not found error', async () => {
      const notFoundError = {
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job with ID test-job-123 not found',
          details: { jobId: 'test-job-123' }
        },
        timestamp: new Date().toISOString()
      };

      mockGetJobStatus.execute.mockRejectedValue(notFoundError);

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData).toEqual(notFoundError);
    });
  });

  describe('processing errors', () => {
    it('should handle use case execution failure', async () => {
      const useCaseError = {
        success: false,
        error: {
          code: 'JOB_STATUS_FAILED',
          message: 'Failed to get job status',
          details: { jobId: 'test-job-123' }
        },
        timestamp: new Date().toISOString()
      };

      mockGetJobStatus.execute.mockRejectedValue(useCaseError);

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData).toEqual(useCaseError);
    });

    it('should handle unknown errors', async () => {
      mockGetJobStatus.execute.mockRejectedValue(new Error('Unknown error'));

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('rate limiting', () => {
    it('should handle rate limit exceeded', async () => {
      const rateLimitError = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            limit: 10,
            windowMs: 60000
          }
        },
        timestamp: new Date().toISOString()
      };

      mockGetJobStatus.execute.mockRejectedValue(rateLimitError);

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData).toEqual(rateLimitError);
    });
  });

  describe('logging', () => {
    it('should log successful requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockJobProgress = {
        jobId: 'test-job-123',
        status: JobStatus.PROCESSING,
        progress: { total: 10, completed: 5, failed: 0 },
        currentStep: 'Processing images',
        error: undefined
      };

      mockGetJobStatus.execute.mockResolvedValue(mockJobProgress);

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      await GET(request, params);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job status request received')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job status retrieved')
      );

      consoleSpy.mockRestore();
    });

    it('should log request failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockGetJobStatus.execute.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      await GET(request, params);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job status request failed')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle very long job IDs', async () => {
      const longJobId = 'a'.repeat(1000);
      
      const request = new NextRequest(`http://localhost:3000/api/v1/job/${longJobId}`);
      const params = { params: { id: longJobId } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle special characters in job ID', async () => {
      const specialJobId = 'job-123!@#$%^&*()';
      
      const request = new NextRequest(`http://localhost:3000/api/v1/job/${specialJobId}`);
      const params = { params: { id: specialJobId } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle concurrent status requests', async () => {
      const mockJobProgress = {
        jobId: 'test-job-123',
        status: JobStatus.PROCESSING,
        progress: { total: 10, completed: 5, failed: 0 },
        currentStep: 'Processing images',
        error: undefined
      };

      mockGetJobStatus.execute.mockResolvedValue(mockJobProgress);

      const requests = Array.from({ length: 10 }, () => {
        const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
        const params = { params: { id: 'test-job-123' } };
        return GET(request, params);
      });

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle jobs with zero progress', async () => {
      const mockJobProgress = {
        jobId: 'test-job-123',
        status: JobStatus.PENDING,
        progress: { total: 0, completed: 0, failed: 0 },
        currentStep: 'Job queued',
        error: undefined
      };

      mockGetJobStatus.execute.mockResolvedValue(mockJobProgress);

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.progress).toEqual({ total: 0, completed: 0, failed: 0 });
    });

    it('should handle jobs with maximum progress', async () => {
      const mockJobProgress = {
        jobId: 'test-job-123',
        status: JobStatus.COMPLETED,
        progress: { total: 100, completed: 100, failed: 0 },
        currentStep: 'Job completed',
        error: undefined
      };

      mockGetJobStatus.execute.mockResolvedValue(mockJobProgress);

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.progress).toEqual({ total: 100, completed: 100, failed: 0 });
    });

    it('should handle jobs with all failed progress', async () => {
      const mockJobProgress = {
        jobId: 'test-job-123',
        status: JobStatus.FAILED,
        progress: { total: 10, completed: 0, failed: 10 },
        currentStep: 'Job failed',
        error: 'All images failed to process'
      };

      mockGetJobStatus.execute.mockResolvedValue(mockJobProgress);

      const request = new NextRequest('http://localhost:3000/api/v1/job/test-job-123');
      const params = { params: { id: 'test-job-123' } };

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.progress).toEqual({ total: 10, completed: 0, failed: 10 });
      expect(responseData.data.error).toBe('All images failed to process');
    });
  });
});
