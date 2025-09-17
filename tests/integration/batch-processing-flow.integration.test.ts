import { ProcessOptimizationJob } from '@/application/use-cases/ProcessOptimizationJob';
import { RobustJobRepository } from '@/infrastructure/repositories/JobManager';
import { GeminiBatchRoomDetectionService } from '@/infrastructure/services/GeminiBatchRoomDetectionService';
import { GeminiBatchImageOptimizationService } from '@/infrastructure/services/GeminiBatchImageOptimizationService';
import { ApifyScraperService } from '@/infrastructure/services/ApifyScraperService';
import { RoomType } from '@/domain/entities/RoomType';

// Mock external dependencies
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    batches: {
      create: jest.fn(),
      get: jest.fn()
    }
  }))
}));

jest.mock('@/infrastructure/services/ApifyScraperService', () => ({
  ApifyScraperService: jest.fn().mockImplementation(() => ({
    scrapeAirbnbListing: jest.fn()
  }))
}));

jest.mock('@/infrastructure/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Batch Processing Integration Tests', () => {
  let processOptimizationJob: ProcessOptimizationJob;
  let jobRepository: RobustJobRepository;
  let mockImageScraper: jest.Mocked<ApifyScraperService>;
  let mockBatchRoomDetector: jest.Mocked<GeminiBatchRoomDetectionService>;
  let mockBatchImageOptimizer: jest.Mocked<GeminiBatchImageOptimizationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock services
    jobRepository = new RobustJobRepository();
    mockImageScraper = new ApifyScraperService() as jest.Mocked<ApifyScraperService>;
    mockBatchRoomDetector = new GeminiBatchRoomDetectionService() as jest.Mocked<GeminiBatchRoomDetectionService>;
    mockBatchImageOptimizer = new GeminiBatchImageOptimizationService() as jest.Mocked<GeminiBatchImageOptimizationService>;

    // Create the use case
    processOptimizationJob = new ProcessOptimizationJob(
      jobRepository,
      mockImageScraper,
      mockBatchRoomDetector,
      mockBatchImageOptimizer
    );
  });

  describe('Complete Batch Processing Flow', () => {
    it('should process multiple images using batch API successfully', async () => {
      // Mock image scraping
      const mockScrapedImages = {
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
          'https://example.com/image4.jpg',
          'https://example.com/image5.jpg'
        ],
        roomType: 'bedroom'
      };

      mockImageScraper.scrapeAirbnbListing.mockResolvedValue(mockScrapedImages);

      // Mock room detection batch response
      const mockRoomDetectionResponse = [
        {
          imageId: 'img1',
          analysis: {
            lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: ['brighten_rooms'] },
            composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: ['reframe_wide_angle'] },
            technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
            clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
            color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
            enhancement_priority: ['lighting'],
            batch_consistency: { needs_consistency_filter: true, style_reference: 'first_image' }
          }
        },
        {
          imageId: 'img2',
          analysis: {
            lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: ['brighten_rooms'] },
            composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: ['reframe_wide_angle'] },
            technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
            clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
            color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
            enhancement_priority: ['lighting'],
            batch_consistency: { needs_consistency_filter: true, style_reference: 'none' }
          }
        },
        {
          imageId: 'img3',
          analysis: {
            lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: ['brighten_rooms'] },
            composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: ['reframe_wide_angle'] },
            technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
            clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
            color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
            enhancement_priority: ['lighting'],
            batch_consistency: { needs_consistency_filter: true, style_reference: 'none' }
          }
        },
        {
          imageId: 'img4',
          analysis: {
            lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: ['brighten_rooms'] },
            composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: ['reframe_wide_angle'] },
            technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
            clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
            color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
            enhancement_priority: ['lighting'],
            batch_consistency: { needs_consistency_filter: true, style_reference: 'none' }
          }
        },
        {
          imageId: 'img5',
          analysis: {
            lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: ['brighten_rooms'] },
            composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: ['reframe_wide_angle'] },
            technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
            clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
            color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
            enhancement_priority: ['lighting'],
            batch_consistency: { needs_consistency_filter: true, style_reference: 'none' }
          }
        }
      ];

      mockBatchRoomDetector.analyzeImagesBatch.mockResolvedValue(mockRoomDetectionResponse);

      // Mock image optimization batch response
      const mockImageOptimizationResponse = [
        {
          imageId: 'img1',
          optimizedImageBase64: 'optimized_image_base64_1'
        },
        {
          imageId: 'img2',
          optimizedImageBase64: 'optimized_image_base64_2'
        },
        {
          imageId: 'img3',
          optimizedImageBase64: 'optimized_image_base64_3'
        },
        {
          imageId: 'img4',
          optimizedImageBase64: 'optimized_image_base64_4'
        },
        {
          imageId: 'img5',
          optimizedImageBase64: 'optimized_image_base64_5'
        }
      ];

      mockBatchImageOptimizer.optimizeImagesBatch.mockResolvedValue(mockImageOptimizationResponse);

      // Execute the optimization job
      const result = await processOptimizationJob.execute({
        airbnbUrl: 'https://airbnb.com/rooms/123',
        maxImages: 5
      });

      // Verify the response
      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.message).toContain('batch processing');

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify that batch services were called
      expect(mockImageScraper.scrapeAirbnbListing).toHaveBeenCalledWith('https://airbnb.com/rooms/123');
      expect(mockBatchRoomDetector.analyzeImagesBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ imageId: expect.any(String), imageBase64: expect.any(String) })
        ])
      );
      expect(mockBatchImageOptimizer.optimizeImagesBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            imageId: expect.any(String),
            imageBase64: expect.any(String),
            roomType: RoomType.BEDROOM,
            analysis: expect.any(Object)
          })
        ])
      );

      // Verify job was created and updated
      const job = await jobRepository.getById(result.jobId);
      expect(job).toBeDefined();
      expect(job?.images).toHaveLength(5);
    });

    it('should handle batch processing errors gracefully', async () => {
      // Mock image scraping
      const mockScrapedImages = {
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ],
        roomType: 'bedroom'
      };

      mockImageScraper.scrapeAirbnbListing.mockResolvedValue(mockScrapedImages);

      // Mock room detection failure
      mockBatchRoomDetector.analyzeImagesBatch.mockRejectedValue(new Error('Batch room detection failed'));

      // Execute the optimization job
      const result = await processOptimizationJob.execute({
        airbnbUrl: 'https://airbnb.com/rooms/123',
        maxImages: 2
      });

      // Verify the response
      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify job failed
      const job = await jobRepository.getById(result.jobId);
      expect(job?.status).toBe('FAILED');
    });

    it('should handle partial batch failures', async () => {
      // Mock image scraping
      const mockScrapedImages = {
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg'
        ],
        roomType: 'bedroom'
      };

      mockImageScraper.scrapeAirbnbListing.mockResolvedValue(mockScrapedImages);

      // Mock room detection with partial success
      const mockRoomDetectionResponse = [
        {
          imageId: 'img1',
          analysis: {
            lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: [] },
            composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: [] },
            technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
            clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
            color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
            enhancement_priority: ['lighting'],
            batch_consistency: { needs_consistency_filter: true, style_reference: 'first_image' }
          }
        },
        {
          imageId: 'img2',
          error: 'Room detection failed for img2'
        },
        {
          imageId: 'img3',
          analysis: {
            lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: [] },
            composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: [] },
            technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
            clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
            color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
            enhancement_priority: ['lighting'],
            batch_consistency: { needs_consistency_filter: true, style_reference: 'none' }
          }
        }
      ];

      mockBatchRoomDetector.analyzeImagesBatch.mockResolvedValue(mockRoomDetectionResponse);

      // Mock image optimization with partial success
      const mockImageOptimizationResponse = [
        {
          imageId: 'img1',
          optimizedImageBase64: 'optimized_image_base64_1'
        },
        {
          imageId: 'img3',
          optimizedImageBase64: 'optimized_image_base64_3'
        }
      ];

      mockBatchImageOptimizer.optimizeImagesBatch.mockResolvedValue(mockImageOptimizationResponse);

      // Execute the optimization job
      const result = await processOptimizationJob.execute({
        airbnbUrl: 'https://airbnb.com/rooms/123',
        maxImages: 3
      });

      // Verify the response
      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify job completed with some failures
      const job = await jobRepository.getById(result.jobId);
      expect(job?.status).toBe('COMPLETED');
      expect(job?.progress.failed).toBeGreaterThan(0);
    });
  });

  describe('Cost Savings Validation', () => {
    it('should use batch API for all image processing', async () => {
      // Mock image scraping
      const mockScrapedImages = {
        images: Array.from({ length: 10 }, (_, i) => `https://example.com/image${i + 1}.jpg`),
        roomType: 'bedroom'
      };

      mockImageScraper.scrapeAirbnbListing.mockResolvedValue(mockScrapedImages);

      // Mock batch responses
      const mockRoomDetectionResponse = Array.from({ length: 10 }, (_, i) => ({
        imageId: `img${i + 1}`,
        analysis: {
          lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: [] },
          composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: [] },
          technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
          clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
          color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
          enhancement_priority: ['lighting'],
          batch_consistency: { needs_consistency_filter: true, style_reference: i === 0 ? 'first_image' : 'none' }
        }
      }));

      const mockImageOptimizationResponse = Array.from({ length: 10 }, (_, i) => ({
        imageId: `img${i + 1}`,
        optimizedImageBase64: `optimized_image_base64_${i + 1}`
      }));

      mockBatchRoomDetector.analyzeImagesBatch.mockResolvedValue(mockRoomDetectionResponse);
      mockBatchImageOptimizer.optimizeImagesBatch.mockResolvedValue(mockImageOptimizationResponse);

      // Execute the optimization job
      const result = await processOptimizationJob.execute({
        airbnbUrl: 'https://airbnb.com/rooms/123',
        maxImages: 10
      });

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify that batch services were called only once each (not per image)
      expect(mockBatchRoomDetector.analyzeImagesBatch).toHaveBeenCalledTimes(1);
      expect(mockBatchImageOptimizer.optimizeImagesBatch).toHaveBeenCalledTimes(1);

      // Verify that all 10 images were processed in the single batch call
      expect(mockBatchRoomDetector.analyzeImagesBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ imageId: expect.any(String), imageBase64: expect.any(String) })
        ])
      );

      const roomDetectionCall = mockBatchRoomDetector.analyzeImagesBatch.mock.calls[0][0];
      expect(roomDetectionCall).toHaveLength(10);

      const imageOptimizationCall = mockBatchImageOptimizer.optimizeImagesBatch.mock.calls[0][0];
      expect(imageOptimizationCall).toHaveLength(10);
    });
  });
});
