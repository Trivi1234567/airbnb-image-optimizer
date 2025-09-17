import { POST } from '@/app/api/v1/optimize/route';
import { NextRequest } from 'next/server';
import { container } from '@/infrastructure/di/container';
import { ProcessOptimizationJob } from '@/application/use-cases/ProcessOptimizationJob';
import { OptimizationRequest } from '@/application/dto/OptimizationRequest.dto';
import { JobStatus } from '@/domain/entities/OptimizationJob';

// Mock the container
jest.mock('@/infrastructure/di/container', () => ({
  container: {
    get: jest.fn()
  }
}));

const mockContainer = container as jest.Mocked<typeof container>;

describe('/api/v1/optimize POST', () => {
  let mockProcessOptimizationJob: jest.Mocked<ProcessOptimizationJob>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProcessOptimizationJob = {
      execute: jest.fn()
    } as any;

    mockContainer.get.mockReturnValue(mockProcessOptimizationJob);
  });

  describe('successful requests', () => {
    it('should process valid optimization request successfully', async () => {
      const mockResponse = {
        success: true,
        jobId: 'test-job-123',
        message: 'Optimization job started successfully',
        data: {
          job: {
            id: 'test-job-123',
            airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
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
        body: JSON.stringify({
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData).toEqual(mockResponse);
      expect(mockProcessOptimizationJob.execute).toHaveBeenCalledWith({
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 10
      });
    });

    it('should handle request with default maxImages', async () => {
      const mockResponse = {
        success: true,
        jobId: 'test-job-123',
        message: 'Optimization job started successfully',
        data: {
          job: {
            id: 'test-job-123',
            airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
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
        body: JSON.stringify({
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(mockProcessOptimizationJob.execute).toHaveBeenCalledWith({
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 10
      });
    });
  });

  describe('validation errors', () => {
    it('should reject invalid Airbnb URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          airbnbUrl: 'https://www.example.com/rooms/12345678',
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject malformed URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          airbnbUrl: 'not-a-url',
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing airbnbUrl', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid maxImages value', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
          maxImages: 15 // Exceeds maximum of 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject negative maxImages value', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
          maxImages: -1
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject non-integer maxImages value', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
          maxImages: 5.5
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('method validation', () => {
    it('should reject non-POST requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'GET'
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  describe('processing errors', () => {
    it('should handle use case execution failure', async () => {
      const useCaseError = {
        success: false,
        error: {
          code: 'JOB_START_FAILED',
          message: 'Failed to start optimization job',
          details: { jobId: 'test-job-123' }
        },
        timestamp: new Date().toISOString()
      };

      mockProcessOptimizationJob.execute.mockRejectedValue(useCaseError);

      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData).toEqual(useCaseError);
    });

    it('should handle unknown errors', async () => {
      mockProcessOptimizationJob.execute.mockRejectedValue(new Error('Unknown error'));

      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: '',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
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

      mockProcessOptimizationJob.execute.mockRejectedValue(rateLimitError);

      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData).toEqual(rateLimitError);
    });
  });

  describe('logging', () => {
    it('should log successful requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockResponse = {
        success: true,
        jobId: 'test-job-123',
        message: 'Optimization job started successfully',
        data: {
          job: {
            id: 'test-job-123',
            airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
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
        body: JSON.stringify({
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Optimization request received')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Optimization job started')
      );

      consoleSpy.mockRestore();
    });

    it('should log request failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockProcessOptimizationJob.execute.mockRejectedValue(new Error('Processing failed'));

      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Optimization request failed')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle very long Airbnb URLs', async () => {
      const longUrl = 'https://www.airbnb.com/rooms/' + 'a'.repeat(1000);
      
      const request = new NextRequest('http://localhost:3000/api/v1/optimize', {
        method: 'POST',
        body: JSON.stringify({
          airbnbUrl: longUrl,
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle special characters in URL', async () => {
      const specialUrl = 'https://www.airbnb.com/rooms/12345678?special=chars&test=value';
      
      const mockResponse = {
        success: true,
        jobId: 'test-job-123',
        message: 'Optimization job started successfully',
        data: {
          job: {
            id: 'test-job-123',
            airbnbUrl: specialUrl,
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
        body: JSON.stringify({
          airbnbUrl: specialUrl,
          maxImages: 10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should handle concurrent requests', async () => {
      const mockResponse = {
        success: true,
        jobId: 'test-job-123',
        message: 'Optimization job started successfully',
        data: {
          job: {
            id: 'test-job-123',
            airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
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

      const requests = Array.from({ length: 5 }, () => {
        return new NextRequest('http://localhost:3000/api/v1/optimize', {
          method: 'POST',
          body: JSON.stringify({
            airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
            maxImages: 10
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      });

      const responses = await Promise.all(requests.map(req => POST(req)));

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });
});
