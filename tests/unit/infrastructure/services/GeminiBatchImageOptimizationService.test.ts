import { GeminiBatchImageOptimizationService } from '@/infrastructure/services/GeminiBatchImageOptimizationService';
import { BatchImageOptimizationRequest } from '@/domain/services/IBatchImageOptimizer';
import { RoomType } from '@/domain/entities/RoomType';

// Mock the GoogleGenerativeAI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    batches: {
      create: jest.fn(),
      get: jest.fn()
    }
  }))
}));

// Mock the logger
jest.mock('@/infrastructure/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('GeminiBatchImageOptimizationService', () => {
  let service: GeminiBatchImageOptimizationService;
  let mockGenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeminiBatchImageOptimizationService();
    
    // Get the mocked instance
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    mockGenAI = new GoogleGenerativeAI();
  });

  describe('optimizeImagesBatch', () => {
    it('should process batch optimization requests successfully', async () => {
      const requests: BatchImageOptimizationRequest[] = [
        {
          imageId: 'img1',
          imageBase64: 'base64data1',
          roomType: RoomType.BEDROOM,
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
          imageBase64: 'base64data2',
          roomType: RoomType.KITCHEN,
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

      // Mock batch processing
      const mockBatchJob = {
        name: 'batch-job-123',
        state: { name: 'JOB_STATE_SUCCEEDED' },
        dest: {
          inlined_responses: [
            {
              response: {
                candidates: [{
                  content: {
                    parts: [{
                      inlineData: {
                        data: 'optimized_image_base64_1',
                        mimeType: 'image/jpeg'
                      }
                    }]
                  }
                }]
              }
            },
            {
              response: {
                candidates: [{
                  content: {
                    parts: [{
                      inlineData: {
                        data: 'optimized_image_base64_2',
                        mimeType: 'image/jpeg'
                      }
                    }]
                  }
                }]
              }
            }
          ]
        }
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      mockGenAI.batches.get = jest.fn().mockResolvedValue(mockBatchJob);

      const results = await service.optimizeImagesBatch(requests);

      expect(results).toHaveLength(2);
      expect(results[0].imageId).toBe('img1');
      expect(results[0].optimizedImageBase64).toBe('optimized_image_base64_1');
      expect(results[1].imageId).toBe('img2');
      expect(results[1].optimizedImageBase64).toBe('optimized_image_base64_2');
      expect(mockGenAI.batches.create).toHaveBeenCalled();
      expect(mockGenAI.batches.get).toHaveBeenCalled();
    });

    it('should handle batch processing errors', async () => {
      const requests: BatchImageOptimizationRequest[] = [
        {
          imageId: 'img1',
          imageBase64: 'base64data1',
          roomType: RoomType.BEDROOM,
          analysis: {
            lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: [] },
            composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: [] },
            technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
            clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
            color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
            enhancement_priority: ['lighting'],
            batch_consistency: { needs_consistency_filter: true, style_reference: 'first_image' }
          }
        }
      ];

      // Mock batch processing failure
      mockGenAI.batches.create = jest.fn().mockRejectedValue(new Error('Batch processing failed'));

      await expect(service.optimizeImagesBatch(requests)).rejects.toThrow('Batch image optimization failed: Batch processing failed');
    });

    it('should handle partial batch failures', async () => {
      const requests: BatchImageOptimizationRequest[] = [
        {
          imageId: 'img1',
          imageBase64: 'base64data1',
          roomType: RoomType.BEDROOM,
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
          imageBase64: 'base64data2',
          roomType: RoomType.KITCHEN,
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

      // Mock batch processing with partial failure
      const mockBatchJob = {
        name: 'batch-job-123',
        state: { name: 'JOB_STATE_SUCCEEDED' },
        dest: {
          inlined_responses: [
            {
              response: {
                candidates: [{
                  content: {
                    parts: [{
                      inlineData: {
                        data: 'optimized_image_base64_1',
                        mimeType: 'image/jpeg'
                      }
                    }]
                  }
                }]
              }
            },
            {
              error: {
                message: 'Image optimization failed for img2'
              }
            }
          ]
        }
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      mockGenAI.batches.get = jest.fn().mockResolvedValue(mockBatchJob);

      const results = await service.optimizeImagesBatch(requests);

      expect(results).toHaveLength(2);
      expect(results[0].imageId).toBe('img1');
      expect(results[0].optimizedImageBase64).toBe('optimized_image_base64_1');
      expect(results[1].imageId).toBe('img2');
      expect(results[1].error).toBe('Image optimization failed for img2');
    });

    it('should handle batch job timeout', async () => {
      const requests: BatchImageOptimizationRequest[] = [
        {
          imageId: 'img1',
          imageBase64: 'base64data1',
          roomType: RoomType.BEDROOM,
          analysis: {
            lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: [] },
            composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: [] },
            technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
            clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
            color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
            enhancement_priority: ['lighting'],
            batch_consistency: { needs_consistency_filter: true, style_reference: 'first_image' }
          }
        }
      ];

      // Mock batch job that never completes
      const mockBatchJob = {
        name: 'batch-job-123',
        state: { name: 'JOB_STATE_RUNNING' }
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      mockGenAI.batches.get = jest.fn().mockResolvedValue(mockBatchJob);

      await expect(service.optimizeImagesBatch(requests)).rejects.toThrow('Batch job polling timeout');
    });

    it('should handle empty requests array', async () => {
      const requests: BatchImageOptimizationRequest[] = [];

      const results = await service.optimizeImagesBatch(requests);

      expect(results).toHaveLength(0);
      expect(mockGenAI.batches.create).not.toHaveBeenCalled();
    });

    it('should handle large batch requests', async () => {
      // Create a large batch of requests (50 images)
      const requests: BatchImageOptimizationRequest[] = Array.from({ length: 50 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`,
        roomType: RoomType.BEDROOM,
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

      // Mock successful batch processing
      const mockBatchJob = {
        name: 'batch-job-123',
        state: { name: 'JOB_STATE_SUCCEEDED' },
        dest: {
          inlined_responses: requests.map(() => ({
            response: {
              candidates: [{
                content: {
                  parts: [{
                    inlineData: {
                      data: 'optimized_image_base64',
                      mimeType: 'image/jpeg'
                    }
                  }]
                }
              }]
            }
          }))
        }
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      mockGenAI.batches.get = jest.fn().mockResolvedValue(mockBatchJob);

      const results = await service.optimizeImagesBatch(requests);

      expect(results).toHaveLength(50);
      expect(mockGenAI.batches.create).toHaveBeenCalled();
      expect(mockGenAI.batches.get).toHaveBeenCalled();
    });
  });
});
