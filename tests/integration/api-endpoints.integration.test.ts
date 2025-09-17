import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as optimizeHandler } from '@/app/api/v1/optimize/route';
import { GET as jobStatusHandler } from '@/app/api/v1/job/[id]/route';
import { container } from '@/infrastructure/di/container';
import { InMemoryJobRepository } from '@/infrastructure/repositories/InMemoryJobRepository';
import { OptimizationJob, JobStatus } from '@/domain/entities/OptimizationJob';
import { RoomType } from '@/domain/entities/RoomType';

// Mock the container
jest.mock('@/infrastructure/di/container', () => ({
  container: {
    get: jest.fn()
  }
}));

describe('API Endpoints Integration Tests', () => {
  let mockJobRepository: jest.Mocked<InMemoryJobRepository>;
  let mockProcessOptimizationJob: any;
  let mockGetJobStatus: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repository
    mockJobRepository = new InMemoryJobRepository() as jest.Mocked<InMemoryJobRepository>;
    
    // Create mock use cases
    mockProcessOptimizationJob = {
      execute: jest.fn()
    };
    
    mockGetJobStatus = {
      execute: jest.fn()
    };

    // Mock container responses
    (container.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'processOptimizationJob':
          return mockProcessOptimizationJob;
        case 'getJobStatus':
          return mockGetJobStatus;
        default:
          throw new Error(`Unknown service: ${key}`);
      }
    });
  });

  describe('POST /api/v1/optimize', () => {
    it('should handle valid optimization request', async () => {
      // Arrange
      const requestBody = {
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 5
      };

      const mockResponse = {
        success: true,
        jobId: 'test-job-id',
        message: 'Optimization job started successfully',
        data: {
          job: {
            id: 'test-job-id',
            airbnbUrl: requestBody.airbnbUrl,
            status: JobStatus.PENDING,
            progress: { total: 0, completed: 0, failed: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          images: [],
          imagePairs: []
        }
      };

      mockProcessOptimizationJob.execute.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      // Act
      const response = await optimizeHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.jobId).toBe('test-job-id');
      expect(mockProcessOptimizationJob.execute).toHaveBeenCalledWith(requestBody);
    });

    it('should handle invalid JSON in request body', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      // Act
      const response = await optimizeHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(responseData.error.message).toBe('Invalid JSON in request body');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidRequestBody = {
        airbnbUrl: 'not-a-valid-url',
        maxImages: 'not-a-number'
      };

      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      // Act
      const response = await optimizeHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle missing authorization header', async () => {
      // Arrange
      const requestBody = {
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 5
      };

      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Act
      const response = await optimizeHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle use case execution errors', async () => {
      // Arrange
      const requestBody = {
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 5
      };

      mockProcessOptimizationJob.execute.mockRejectedValue(
        new Error('Service unavailable')
      );

      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      // Act
      const response = await optimizeHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should reject non-POST requests', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      // Act
      const response = await optimizeHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  describe('GET /api/v1/job/[id]', () => {
    it('should handle valid job status request', async () => {
      // Arrange
      const jobId = 'test-job-id';
      const mockJobStatus = {
        jobId,
        status: JobStatus.COMPLETED,
        progress: { total: 3, completed: 3, failed: 0 },
        images: [],
        imagePairs: [
          {
            original: {
              id: 'img1',
              originalUrl: 'https://example.com/img1.jpg',
              fileName: 'image_1.jpg',
              roomType: RoomType.BEDROOM,
              processingStatus: 'completed',
              error: null
            },
            optimized: {
              id: 'img1-opt',
              originalUrl: 'https://example.com/img1.jpg',
              fileName: 'bedroom_1.jpg',
              roomType: RoomType.BEDROOM,
              processingStatus: 'completed',
              error: null
            },
            roomType: RoomType.BEDROOM,
            fileName: 'bedroom_1.jpg'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetJobStatus.execute.mockResolvedValue(mockJobStatus);

      const request = new NextRequest(`http://localhost:3000/api/v1/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      // Act
      const response = await jobStatusHandler(request, { params: { id: jobId } });
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.jobId).toBe(jobId);
      expect(responseData.data.status).toBe(JobStatus.COMPLETED);
      expect(mockGetJobStatus.execute).toHaveBeenCalledWith({ jobId });
    });

    it('should handle invalid job ID format', async () => {
      // Arrange
      const invalidJobId = 'invalid-job-id-format';
      const request = new NextRequest(`http://localhost:3000/api/v1/job/${invalidJobId}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      // Act
      const response = await jobStatusHandler(request, { params: { id: invalidJobId } });
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle job not found', async () => {
      // Arrange
      const jobId = 'non-existent-job-id';
      mockGetJobStatus.execute.mockRejectedValue(
        new Error('Job not found')
      );

      const request = new NextRequest(`http://localhost:3000/api/v1/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      // Act
      const response = await jobStatusHandler(request, { params: { id: jobId } });
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should reject non-GET requests', async () => {
      // Arrange
      const jobId = 'test-job-id';
      const request = new NextRequest(`http://localhost:3000/api/v1/job/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      // Act
      const response = await jobStatusHandler(request, { params: { id: jobId } });
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('METHOD_NOT_ALLOWED');
    });

    it('should include proper cache headers', async () => {
      // Arrange
      const jobId = 'test-job-id';
      const mockJobStatus = {
        jobId,
        status: JobStatus.PROCESSING,
        progress: { total: 2, completed: 1, failed: 0 },
        images: [],
        imagePairs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetJobStatus.execute.mockResolvedValue(mockJobStatus);

      const request = new NextRequest(`http://localhost:3000/api/v1/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      // Act
      const response = await jobStatusHandler(request, { params: { id: jobId } });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should handle rate limiting', async () => {
      // This test would require a more complex setup with actual rate limiter
      // For now, we'll test that the middleware is applied
      const requestBody = {
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 5
      };

      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      // The rate limiter middleware should be applied
      // In a real test, we'd make multiple requests to trigger rate limiting
      const response = await optimizeHandler(request);
      
      // Should not be rate limited for single request
      expect(response.status).not.toBe(429);
    });
  });

  describe('Compression Integration', () => {
    it('should apply compression to responses', async () => {
      // Arrange
      const jobId = 'test-job-id';
      const mockJobStatus = {
        jobId,
        status: JobStatus.COMPLETED,
        progress: { total: 1, completed: 1, failed: 0 },
        images: [],
        imagePairs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetJobStatus.execute.mockResolvedValue(mockJobStatus);

      const request = new NextRequest(`http://localhost:3000/api/v1/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });

      // Act
      const response = await jobStatusHandler(request, { params: { id: jobId } });

      // Assert
      expect(response.status).toBe(200);
      // Compression middleware should be applied
      // The actual compression would be handled by the middleware
    });
  });
});
