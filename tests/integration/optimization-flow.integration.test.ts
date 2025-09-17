import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { ProcessOptimizationJob } from '@/application/use-cases/ProcessOptimizationJob';
import { GetJobStatus } from '@/application/use-cases/GetJobStatus';
import { InMemoryJobRepository } from '@/infrastructure/repositories/InMemoryJobRepository';
import { ApifyScraperService } from '@/infrastructure/services/ApifyScraperService';
import { GeminiRoomDetectionService } from '@/infrastructure/services/GeminiRoomDetectionService';
import { GeminiOptimizationService } from '@/infrastructure/services/GeminiOptimizationService';
import { OptimizationJob, JobStatus } from '@/domain/entities/OptimizationJob';
import { RoomType } from '@/domain/entities/RoomType';
import { container } from '@/infrastructure/di/container';

// Mock external services
jest.mock('@/infrastructure/services/ApifyScraperService');
jest.mock('@/infrastructure/services/GeminiRoomDetectionService');
jest.mock('@/infrastructure/services/GeminiOptimizationService');

describe('Optimization Flow Integration Tests', () => {
  let processOptimizationJob: ProcessOptimizationJob;
  let getJobStatus: GetJobStatus;
  let jobRepository: InMemoryJobRepository;
  let mockScraperService: jest.Mocked<ApifyScraperService>;
  let mockRoomDetectorService: jest.Mocked<GeminiRoomDetectionService>;
  let mockOptimizerService: jest.Mocked<GeminiOptimizationService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh instances
    jobRepository = new InMemoryJobRepository();
    
    // Create mocked services
    mockScraperService = new ApifyScraperService() as jest.Mocked<ApifyScraperService>;
    mockRoomDetectorService = new GeminiRoomDetectionService() as jest.Mocked<GeminiRoomDetectionService>;
    mockOptimizerService = new GeminiOptimizationService() as jest.Mocked<GeminiOptimizationService>;

    // Create use cases
    processOptimizationJob = new ProcessOptimizationJob(
      jobRepository,
      mockScraperService,
      mockRoomDetectorService,
      mockOptimizerService
    );
    
    getJobStatus = new GetJobStatus(jobRepository);
  });

  afterEach(() => {
    // Clean up
    jobRepository.clear();
  });

  describe('Full Optimization Flow', () => {
    it('should complete full optimization flow successfully', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      const maxImages = 3;
      
      const mockListing = {
        title: 'Beautiful Apartment',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg'
        ]
      };

      const mockAnalysis = {
        roomType: RoomType.BEDROOM,
        confidence: 0.95,
        description: 'A well-lit bedroom with modern furniture'
      };

      const mockOptimizedImage = 'data:image/jpeg;base64,optimized_image_data';

      // Mock service responses
      mockScraperService.scrapeAirbnbListing.mockResolvedValue(mockListing);
      mockRoomDetectorService.analyzeImage.mockResolvedValue(mockAnalysis);
      mockOptimizerService.optimizeImage.mockResolvedValue(mockOptimizedImage);

      // Mock fetch for image download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });

      // Act
      const result = await processOptimizationJob.execute({
        airbnbUrl,
        maxImages
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.data.job.status).toBe(JobStatus.PENDING);

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check job status after processing
      const jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.COMPLETED);
      expect(jobStatus.imagePairs).toHaveLength(3);
      expect(jobStatus.imagePairs[0].optimized).toBeDefined();
      expect(jobStatus.imagePairs[0].roomType).toBe(RoomType.BEDROOM);
    });

    it('should handle scraping failures gracefully', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      
      mockScraperService.scrapeAirbnbListing.mockRejectedValue(
        new Error('Failed to scrape listing')
      );

      // Act
      const result = await processOptimizationJob.execute({
        airbnbUrl,
        maxImages: 5
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check job status after processing
      const jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.FAILED);
      expect(jobStatus.error).toContain('Failed to scrape listing');
    });

    it('should handle room detection failures for individual images', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      
      const mockListing = {
        title: 'Beautiful Apartment',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ]
      };

      mockScraperService.scrapeAirbnbListing.mockResolvedValue(mockListing);
      mockRoomDetectorService.analyzeImage
        .mockResolvedValueOnce({
          roomType: RoomType.BEDROOM,
          confidence: 0.95,
          description: 'A well-lit bedroom'
        })
        .mockRejectedValueOnce(new Error('Room detection failed'));

      mockOptimizerService.optimizeImage.mockResolvedValue('optimized_image_data');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });

      // Act
      const result = await processOptimizationJob.execute({
        airbnbUrl,
        maxImages: 2
      });

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      const jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.COMPLETED);
      expect(jobStatus.imagePairs).toHaveLength(2);
      expect(jobStatus.imagePairs[0].optimized).toBeDefined();
      expect(jobStatus.imagePairs[1].optimized).toBeUndefined();
      expect(jobStatus.imagePairs[1].original.error).toContain('Room detection failed');
    });

    it('should handle optimization failures for individual images', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      
      const mockListing = {
        title: 'Beautiful Apartment',
        images: ['https://example.com/image1.jpg']
      };

      const mockAnalysis = {
        roomType: RoomType.KITCHEN,
        confidence: 0.90,
        description: 'Modern kitchen'
      };

      mockScraperService.scrapeAirbnbListing.mockResolvedValue(mockListing);
      mockRoomDetectorService.analyzeImage.mockResolvedValue(mockAnalysis);
      mockOptimizerService.optimizeImage.mockRejectedValue(
        new Error('Optimization failed')
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

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      const jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.COMPLETED);
      expect(jobStatus.imagePairs).toHaveLength(1);
      expect(jobStatus.imagePairs[0].optimized).toBeUndefined();
      expect(jobStatus.imagePairs[0].original.error).toContain('Optimization failed');
    });

    it('should respect maxImages limit', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      const maxImages = 2;
      
      const mockListing = {
        title: 'Beautiful Apartment',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
          'https://example.com/image4.jpg',
          'https://example.com/image5.jpg'
        ]
      };

      const mockAnalysis = {
        roomType: RoomType.LIVING_ROOM,
        confidence: 0.88,
        description: 'Spacious living room'
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
        maxImages
      });

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      const jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.imagePairs).toHaveLength(maxImages);
      expect(mockScraperService.scrapeAirbnbListing).toHaveBeenCalledTimes(1);
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should open circuit breaker after repeated failures', async () => {
      // Arrange
      const airbnbUrl = 'https://www.airbnb.com/rooms/12345678';
      
      mockScraperService.scrapeAirbnbListing.mockRejectedValue(
        new Error('Service unavailable')
      );

      // Act & Assert
      // First few calls should fail but not open circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await processOptimizationJob.execute({
            airbnbUrl,
            maxImages: 1
          });
        } catch (error) {
          // Expected to fail
        }
      }

      // After 3 failures, circuit breaker should be open
      const result = await processOptimizationJob.execute({
        airbnbUrl,
        maxImages: 1
      });

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.FAILED);
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress correctly throughout the process', async () => {
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

      const mockAnalysis = {
        roomType: RoomType.BEDROOM,
        confidence: 0.95,
        description: 'A well-lit bedroom'
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
        maxImages
      });

      // Check initial progress
      let jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.progress.total).toBe(2);
      expect(jobStatus.progress.completed).toBe(0);
      expect(jobStatus.progress.failed).toBe(0);

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check final progress
      jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.progress.total).toBe(2);
      expect(jobStatus.progress.completed).toBe(2);
      expect(jobStatus.progress.failed).toBe(0);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary service failures', async () => {
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
      
      // First call fails, second succeeds
      mockRoomDetectorService.analyzeImage
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockAnalysis);
        
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

      // Assert
      const jobStatus = await getJobStatus.execute({ jobId: result.jobId });
      expect(jobStatus.status).toBe(JobStatus.COMPLETED);
      expect(jobStatus.imagePairs).toHaveLength(1);
      expect(jobStatus.imagePairs[0].optimized).toBeDefined();
    });
  });
});
