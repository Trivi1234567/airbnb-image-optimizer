import { ProcessOptimizationJob } from './ProcessOptimizationJob';
import { IJobRepository } from '@/domain/repositories/IJobRepository';
import { IImageScraper } from '@/domain/services/IImageScraper';
import { IRoomDetector } from '@/domain/services/IRoomDetector';
import { IImageOptimizer } from '@/domain/services/IImageOptimizer';
import { OptimizationRequest } from '../dto/OptimizationRequest.dto';
import { OptimizationJob, JobStatus } from '@/domain/entities/OptimizationJob';
import { RoomType } from '@/domain/entities/RoomType';
import { ImageAnalysis } from '@/domain/entities/Image';

// Mock implementations
const mockJobRepository: jest.Mocked<IJobRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
  findByStatus: jest.fn(),
  findExpiredJobs: jest.fn()
};

const mockImageScraper: jest.Mocked<IImageScraper> = {
  scrapeAirbnbListing: jest.fn(),
  validateAirbnbUrl: jest.fn()
};

const mockRoomDetector: jest.Mocked<IRoomDetector> = {
  analyzeImage: jest.fn()
};

const mockImageOptimizer: jest.Mocked<IImageOptimizer> = {
  optimizeImage: jest.fn()
};

describe('ProcessOptimizationJob', () => {
  let processOptimizationJob: ProcessOptimizationJob;

  beforeEach(() => {
    jest.clearAllMocks();
    processOptimizationJob = new ProcessOptimizationJob(
      mockJobRepository,
      mockImageScraper,
      mockRoomDetector,
      mockImageOptimizer
    );
  });

  describe('execute', () => {
    it('should successfully start an optimization job', async () => {
      const request: OptimizationRequest = {
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 5
      };

      const mockJob: OptimizationJob = {
        id: 'test-job-id',
        airbnbUrl: request.airbnbUrl,
        status: JobStatus.PENDING,
        images: [],
        imagePairs: [],
        progress: { total: 0, completed: 0, failed: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockJobRepository.create.mockResolvedValue(mockJob);

      const result = await processOptimizationJob.execute(request);

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(typeof result.jobId).toBe('string');
      expect(result.message).toBe('Optimization job started successfully');
      expect(mockJobRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        airbnbUrl: request.airbnbUrl,
        status: JobStatus.PENDING
      }));
    });

    it('should validate request input', async () => {
      const invalidRequest = {
        airbnbUrl: 'invalid-url',
        maxImages: 15
      } as OptimizationRequest;

      await expect(processOptimizationJob.execute(invalidRequest)).rejects.toMatchObject({
        success: false,
        error: {
          code: 'JOB_START_FAILED',
          message: 'Invalid Airbnb URL provided'
        }
      });
    });

    it('should handle job creation failure', async () => {
      const request: OptimizationRequest = {
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 5
      };

      mockJobRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(processOptimizationJob.execute(request)).rejects.toMatchObject({
        success: false,
        error: {
          code: 'JOB_START_FAILED',
          message: 'Database error'
        }
      });
    });
  });

  describe('processJobAsync', () => {
    it('should process images successfully', async () => {
      const mockJob: OptimizationJob = {
        id: 'test-job-id',
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        status: JobStatus.PENDING,
        images: [],
        imagePairs: [],
        progress: { total: 0, completed: 0, failed: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockListing = {
        id: 'listing-123',
        title: 'Test Listing',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        thumbnail: 'https://example.com/thumb.jpg',
        roomType: 'Entire home',
        host: { name: 'Test Host', isSuperHost: true }
      };

      const mockAnalysis: ImageAnalysis = {
        roomType: RoomType.BEDROOM,
        lighting: { quality: 'good', type: 'natural', issues: [] },
        composition: { issues: [], strengths: [] },
        enhancementPriority: []
      };

      mockImageScraper.scrapeAirbnbListing.mockResolvedValue(mockListing);
      mockRoomDetector.analyzeImage.mockResolvedValue(mockAnalysis);
      mockImageOptimizer.optimizeImage.mockResolvedValue('optimized-base64-data');

      // Mock fetch for image download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });

      // Start the async processing
      const processPromise = processOptimizationJob['processJobAsync'](mockJob, 2);

      // Wait a bit for processing to start
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockJobRepository.updateStatus).toHaveBeenCalledWith('test-job-id', JobStatus.SCRAPING);
      expect(mockImageScraper.scrapeAirbnbListing).toHaveBeenCalledWith(mockJob.airbnbUrl);
    });

    it('should handle scraping failure', async () => {
      const mockJob: OptimizationJob = {
        id: 'test-job-id',
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        status: JobStatus.PENDING,
        images: [],
        imagePairs: [],
        progress: { total: 0, completed: 0, failed: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockImageScraper.scrapeAirbnbListing.mockRejectedValue(new Error('Scraping failed'));

      await processOptimizationJob['processJobAsync'](mockJob, 2);

      expect(mockJobRepository.updateStatus).toHaveBeenCalledWith('test-job-id', JobStatus.SCRAPING);
      expect(mockJobRepository.updateStatus).toHaveBeenCalledWith('test-job-id', JobStatus.FAILED, 'Scraping failed');
    });
  });

  describe('processImagePair', () => {
    it('should process image pair successfully', async () => {
      const mockImage = {
        id: 'image-1',
        originalUrl: 'https://example.com/image1.jpg',
        fileName: 'image_1.jpg',
        processingStatus: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockAnalysis: ImageAnalysis = {
        roomType: RoomType.BEDROOM,
        lighting: { quality: 'good', type: 'natural', issues: [] },
        composition: { issues: [], strengths: [] },
        enhancementPriority: []
      };

      mockRoomDetector.analyzeImage.mockResolvedValue(mockAnalysis);
      mockImageOptimizer.optimizeImage.mockResolvedValue('optimized-base64-data');

      // Mock fetch for image download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });

      const result = await processOptimizationJob['processImagePair'](mockImage, 0, 'test-job-id');

      expect(result.original.analysis).toEqual(mockAnalysis);
      expect(result.optimized).toBeDefined();
      expect(result.roomType).toBe(RoomType.BEDROOM);
      expect(mockRoomDetector.analyzeImage).toHaveBeenCalled();
      expect(mockImageOptimizer.optimizeImage).toHaveBeenCalled();
    });

    it('should handle image processing failure', async () => {
      const mockImage = {
        id: 'image-1',
        originalUrl: 'https://example.com/image1.jpg',
        fileName: 'image_1.jpg',
        processingStatus: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRoomDetector.analyzeImage.mockRejectedValue(new Error('Analysis failed'));

      const result = await processOptimizationJob['processImagePair'](mockImage, 0, 'test-job-id');

      expect(result.original.processingStatus).toBe('failed');
      expect(result.original.error).toBe('Analysis failed');
      expect(result.optimized).toBeUndefined();
      expect(result.roomType).toBe(RoomType.OTHER);
    });
  });

  describe('validateRequest', () => {
    it('should validate valid request', () => {
      const validRequest: OptimizationRequest = {
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 5
      };

      const result = processOptimizationJob['validateRequest'](validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should reject invalid URL', () => {
      const invalidRequest = {
        airbnbUrl: 'invalid-url',
        maxImages: 5
      } as OptimizationRequest;

      expect(() => processOptimizationJob['validateRequest'](invalidRequest)).toThrow('Invalid Airbnb URL provided');
    });

    it('should reject invalid maxImages', () => {
      const invalidRequest = {
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 15
      } as OptimizationRequest;

      expect(() => processOptimizationJob['validateRequest'](invalidRequest)).toThrow('Max images must be between 1 and 10');
    });
  });

  describe('getTelemetryData', () => {
    it('should return telemetry data for a job', () => {
      const telemetryData = processOptimizationJob.getTelemetryData('test-job-id');
      expect(Array.isArray(telemetryData)).toBe(true);
    });
  });
});
