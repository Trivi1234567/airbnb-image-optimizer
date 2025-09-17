import { ApiService } from './ApiService';
import { OptimizationRequest } from '@/application/dto/OptimizationRequest.dto';
import { OptimizationResponse, JobProgress } from '@/application/dto/OptimizationResponse.dto';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiService', () => {
  let apiService: ApiService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiService = new ApiService();
    jest.clearAllMocks();
  });

  describe('startOptimization', () => {
    const mockRequest: OptimizationRequest = {
      airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
      maxImages: 10,
    };

    it('returns success response when API call succeeds', async () => {
      const mockResponse = {
        success: true,
        data: {
          job: {
            id: 'job-123',
            airbnbUrl: mockRequest.airbnbUrl,
            status: 'processing',
            progress: { total: 10, completed: 0, failed: 0 },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          images: [],
          imagePairs: [],
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.startOptimization(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });
    });

    it('returns error response when API call fails', async () => {
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid URL format',
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await apiService.startOptimization(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toEqual(mockErrorResponse.error);
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiService.startOptimization(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Network error');
    });

    it('handles JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const result = await apiService.startOptimization(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('getJobStatus', () => {
    const jobId = 'job-123';

    it('returns success response when API call succeeds', async () => {
      const mockResponse = {
        success: true,
        data: {
          jobId,
          status: 'processing',
          progress: { total: 10, completed: 5, failed: 1 },
          currentStep: 'Processing image 6 of 10',
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.getJobStatus(jobId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledWith(`/api/v1/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });
    });

    it('returns error response when API call fails', async () => {
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found',
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await apiService.getJobStatus(jobId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual(mockErrorResponse.error);
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiService.getJobStatus(jobId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('downloadImage', () => {
    const jobId = 'job-123';
    const imageId = 'image-456';

    it('returns blob when download succeeds', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      } as Response);

      const result = await apiService.downloadImage(jobId, imageId);

      expect(result).toEqual(mockBlob);
      expect(mockFetch).toHaveBeenCalledWith(`/api/v1/download/${jobId}/${imageId}`, {
        method: 'GET',
      });
    });

    it('returns null when download fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      const result = await apiService.downloadImage(jobId, imageId);

      expect(result).toBeNull();
    });

    it('returns null when network error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiService.downloadImage(jobId, imageId);

      expect(result).toBeNull();
    });
  });

  describe('downloadAllImages', () => {
    const jobId = 'job-123';
    const imageIds = ['image-1', 'image-2', 'image-3'];

    it('returns all successful downloads', async () => {
      const mockBlob1 = new Blob(['image1'], { type: 'image/jpeg' });
      const mockBlob2 = new Blob(['image2'], { type: 'image/jpeg' });
      const mockBlob3 = new Blob(['image3'], { type: 'image/jpeg' });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob2,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob3,
        } as Response);

      const result = await apiService.downloadAllImages(jobId, imageIds);

      expect(result).toEqual([mockBlob1, mockBlob2, mockBlob3]);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('filters out failed downloads', async () => {
      const mockBlob1 = new Blob(['image1'], { type: 'image/jpeg' });
      const mockBlob3 = new Blob(['image3'], { type: 'image/jpeg' });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob1,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob3,
        } as Response);

      const result = await apiService.downloadAllImages(jobId, imageIds);

      expect(result).toEqual([mockBlob1, mockBlob3]);
    });

    it('returns empty array when all downloads fail', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response);

      const result = await apiService.downloadAllImages(jobId, imageIds);

      expect(result).toEqual([]);
    });

    it('handles mixed success and network errors', async () => {
      const mockBlob1 = new Blob(['image1'], { type: 'image/jpeg' });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob1,
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response);

      const result = await apiService.downloadAllImages(jobId, imageIds);

      expect(result).toEqual([mockBlob1]);
    });
  });

  describe('handleResponse', () => {
    it('handles successful response with data', async () => {
      const mockResponse = {
        success: true,
        data: { test: 'data' },
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.startOptimization({
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('handles successful response without data wrapper', async () => {
      const mockResponse = { test: 'data' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.startOptimization({
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('handles error response with error object', async () => {
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await apiService.startOptimization({
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toEqual(mockErrorResponse.error);
    });

    it('handles error response without error object', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Something went wrong',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await apiService.startOptimization({
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toBe('An unknown error occurred');
    });
  });

  describe('Custom Base URL', () => {
    it('uses custom base URL when provided', async () => {
      const customApiService = new ApiService('https://api.example.com');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      await customApiService.startOptimization({
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 10,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/optimize',
        expect.any(Object)
      );
    });

    it('uses empty base URL by default', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      await apiService.startOptimization({
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 10,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/optimize',
        expect.any(Object)
      );
    });
  });
});
