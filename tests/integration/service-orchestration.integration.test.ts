import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProcessOptimizationJob } from '@/application/use-cases/ProcessOptimizationJob';
import { GetJobStatus } from '@/application/use-cases/GetJobStatus';
import { InMemoryJobRepository } from '@/infrastructure/repositories/InMemoryJobRepository';
import { ApifyScraperService } from '@/infrastructure/services/ApifyScraperService';
import { GeminiRoomDetectionService } from '@/infrastructure/services/GeminiRoomDetectionService';
import { GeminiOptimizationService } from '@/infrastructure/services/GeminiOptimizationService';
import { OptimizationJob, JobStatus } from '@/domain/entities/OptimizationJob';
import { RoomType } from '@/domain/entities/RoomType';
import { Image } from '@/domain/entities/Image';

// Mock external services
jest.mock('@/infrastructure/services/ApifyScraperService');
jest.mock('@/infrastructure/services/GeminiRoomDetectionService');
jest.mock('@/infrastructure/services/GeminiOptimizationService');

describe('Service Orchestration Integration Tests', () => {
  let processOptimizationJob: ProcessOptimizationJob;
  let getJobStatus: GetJobStatus;
  let jobRepository: InMemoryJobRepository;
  let mockScraperService: jest.Mocked<ApifyScraperService>;
  let mockRoomDetectorService: jest.Mocked<GeminiRoomDetectionService>;
  let mockOptimizerService: jest.Mocked<GeminiOptimizationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    jobRepository = new InMemoryJobRepository();
    
    mockScraperService = new ApifyScraperService() as jest.Mocked<ApifyScraperService>;
    mockRoomDetectorService = new GeminiRoomDetectionService() as jest.Mocked<GeminiRoomDetectionService>;
    mockOptimizerService = new GeminiOptimizationService() as jest.Mocked<GeminiOptimizationService>;

    processOptimizationJob = new ProcessOptimizationJob(
      jobRepository,
      mockScraperService,
      mockRoomDetectorService,
      mockOptimizerService
    );
    
    getJobStatus = new GetJobStatus(jobRepository);
  });

  afterEach(() => {
    jobRepository.clear();
  });

  describe('Service Communication Flow', () => {
    it('should orchestrate services in correct order', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      const maxImages = 2;
      
      const mockListing = {
        title: 'Beautiful Apartment',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ]
      };

      const mockAnalysis1 = {
        roomType: RoomType.BEDROOM,
        confidence: 0.95,
        description: 'A well-lit bedroom with modern furniture'
      };

      const mockAnalysis2 = {
        roomType: RoomType.KITCHEN,
        confidence: 0.90,
        description: 'Modern kitchen with stainless steel appliances'
      };

      const mockOptimizedImage1 = 'data:image/jpeg;base64,optimized_bedroom_data';
      const mockOptimizedImage2 = 'data:image/jpeg;base64,optimized_kitchen_data';

      // Mock service responses
      mockScraperService.scrapeAirbnbListing.mockResolvedValue(mockListing);
      mockRoomDetectorService.analyzeImage
        .mockResolvedValueOnce(mockAnalysis1)
        .mockResolvedValueOnce(mockAnalysis2);
      mockOptimizerService.optimizeImage
        .mockResolvedValueOnce(mockOptimizedImage1)
        .mockResolvedValueOnce(mockOptimizedImage2);

      // Mock fetch for image downloads
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });

      // Act
      const result = await processOptimizationJob.execute({
        airbnbUrl,
        maxImages
      });

      // Assert service call order
      expect(mockScraperService.scrapeAirbnbListing).toHaveBeenCalledWith(airbnbUrl);
      expect(mockScraperService.scrapeAirbnbListing).toHaveBeenCalledTimes(1);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify room detection was called for each image
      expect(mockRoomDetectorService.analyzeImage).toHaveBeenCalledTimes(2);
      
      // Verify optimization was called for each image
      expect(mockOptimizerService.optimizeImage).toHaveBeenCalledTimes(2);
      
      // Verify optimization was called with correct parameters
      expect(mockOptimizerService.optimizeImage).toHaveBeenCalledWith(
        expect.any(String), // base64 image
        RoomType.BEDROOM,
        mockAnalysis1
      );
      expect(mockOptimizerService.optimizeImage).toHaveBeenCalledWith(
        expect.any(String), // base64 image
        RoomType.KITCHEN,
        mockAnalysis2
      );
    });

    it('should handle service timeouts gracefully', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      
      const mockListing = {
        title: 'Beautiful Apartment',
        images: ['https://example.com/image1.jpg']
      };

      mockScraperService.scrapeAirbnbListing.mockResolvedValue(mockListing);
      
      // Mock timeout for room detection
      mockRoomDetectorService.analyzeImage.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service timeout')), 100)
        )
      );

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });

      // Act
      const result = await processOptimizationJob.execute({
        airbnbUrl,
        maxImages: 1
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Assert
      const jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.COMPLETED);
      expect(jobStatus.imagePairs[0].optimized).toBeUndefined();
      expect(jobStatus.imagePairs[0].original.error).toContain('Service timeout');
    });

    it('should handle partial service failures', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      
      const mockListing = {
        title: 'Beautiful Apartment',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ]
      };

      const mockAnalysis1 = {
        roomType: RoomType.BEDROOM,
        confidence: 0.95,
        description: 'A well-lit bedroom'
      };

      mockScraperService.scrapeAirbnbListing.mockResolvedValue(mockListing);
      mockRoomDetectorService.analyzeImage
        .mockResolvedValueOnce(mockAnalysis1)
        .mockRejectedValueOnce(new Error('Room detection failed'));
      
      mockOptimizerService.optimizeImage
        .mockResolvedValueOnce('optimized_image_data')
        .mockRejectedValueOnce(new Error('Optimization failed'));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });

      // Act
      const result = await processOptimizationJob.execute({
        airbnbUrl,
        maxImages: 2
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      const jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.COMPLETED);
      expect(jobStatus.imagePairs).toHaveLength(2);
      
      // First image should be processed successfully
      expect(jobStatus.imagePairs[0].optimized).toBeDefined();
      expect(jobStatus.imagePairs[0].roomType).toBe(RoomType.BEDROOM);
      
      // Second image should have failed
      expect(jobStatus.imagePairs[1].optimized).toBeUndefined();
      expect(jobStatus.imagePairs[1].original.error).toContain('Room detection failed');
    });
  });

  describe('Data Flow Between Services', () => {
    it('should pass correct data between services', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      
      const mockListing = {
        title: 'Beautiful Apartment',
        images: ['https://example.com/image1.jpg']
      };

      const mockAnalysis = {
        roomType: RoomType.LIVING_ROOM,
        confidence: 0.88,
        description: 'Spacious living room with natural light'
      };

      mockScraperService.scrapeAirbnbListing.mockResolvedValue(mockListing);
      mockRoomDetectorService.analyzeImage.mockResolvedValue(mockAnalysis);
      mockOptimizerService.optimizeImage.mockResolvedValue('optimized_image_data');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });

      // Act
      const result = await processOptimizationJob.execute({
        airbnbUrl,
        maxImages: 1
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert data flow
      expect(mockScraperService.scrapeAirbnbListing).toHaveBeenCalledWith(airbnbUrl);
      
      // Verify room detector received base64 image
      expect(mockRoomDetectorService.analyzeImage).toHaveBeenCalledWith(
        expect.stringMatching(/^[A-Za-z0-9+/]+=*$/) // base64 pattern
      );
      
      // Verify optimizer received correct parameters
      expect(mockOptimizerService.optimizeImage).toHaveBeenCalledWith(
        expect.stringMatching(/^[A-Za-z0-9+/]+=*$/), // base64 image
        RoomType.LIVING_ROOM,
        mockAnalysis
      );
    });

    it('should handle image download failures', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      
      const mockListing = {
        title: 'Beautiful Apartment',
        images: ['https://example.com/image1.jpg']
      };

      mockScraperService.scrapeAirbnbListing.mockResolvedValue(mockListing);
      
      // Mock fetch failure
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      // Act
      const result = await processOptimizationJob.execute({
        airbnbUrl,
        maxImages: 1
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      const jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.COMPLETED);
      expect(jobStatus.imagePairs[0].optimized).toBeUndefined();
      expect(jobStatus.imagePairs[0].original.error).toContain('Failed to download image');
    });
  });

  describe('Concurrent Processing', () => {
    it('should handle multiple jobs concurrently', async () => {
      // Arrange
      const airbnbUrl1 = 'https://www.airbnb.com/rooms/11111111';
      const airbnbUrl2 = 'https://www.airbnb.com/rooms/22222222';
      
      const mockListing1 = {
        title: 'Apartment 1',
        images: ['https://example.com/img1.jpg']
      };
      
      const mockListing2 = {
        title: 'Apartment 2',
        images: ['https://example.com/img2.jpg']
      };

      const mockAnalysis = {
        roomType: RoomType.BEDROOM,
        confidence: 0.95,
        description: 'A well-lit bedroom'
      };

      mockScraperService.scrapeAirbnbListing
        .mockResolvedValueOnce(mockListing1)
        .mockResolvedValueOnce(mockListing2);
      
      mockRoomDetectorService.analyzeImage.mockResolvedValue(mockAnalysis);
      mockOptimizerService.optimizeImage.mockResolvedValue('optimized_image_data');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });

      // Act - Start both jobs concurrently
      const [result1, result2] = await Promise.all([
        processOptimizationJob.execute({ airbnbUrl: airbnbUrl1, maxImages: 1 }),
        processOptimizationJob.execute({ airbnbUrl: airbnbUrl2, maxImages: 1 })
      ]);

      // Wait for both to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      expect(result1.jobId).not.toBe(result2.jobId);
      
      const jobStatus1 = await getJobStatus.execute({ jobId: result1.jobId });
      const jobStatus2 = await getJobStatus.execute({ jobId: result2.jobId });
      
      expect(jobStatus1.status).toBe(JobStatus.COMPLETED);
      expect(jobStatus2.status).toBe(JobStatus.COMPLETED);
      expect(jobStatus1.imagePairs).toHaveLength(1);
      expect(jobStatus2.imagePairs).toHaveLength(1);
    });
  });

  describe('Service State Management', () => {
    it('should maintain job state throughout processing', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      
      const mockListing = {
        title: 'Beautiful Apartment',
        images: ['https://example.com/image1.jpg']
      };

      const mockAnalysis = {
        roomType: RoomType.BATHROOM,
        confidence: 0.92,
        description: 'Modern bathroom'
      };

      mockScraperService.scrapeAirbnbListing.mockResolvedValue(mockListing);
      mockRoomDetectorService.analyzeImage.mockResolvedValue(mockAnalysis);
      mockOptimizerService.optimizeImage.mockResolvedValue('optimized_image_data');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });

      // Act
      const result = await processOptimizationJob.execute({
        airbnbUrl,
        maxImages: 1
      });

      // Check initial state
      let jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.PENDING);

      // Wait for scraping to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.SCRAPING);

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.PROCESSING);

      // Wait for final completion
      await new Promise(resolve => setTimeout(resolve, 50));
      jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.COMPLETED);
    });
  });
});
