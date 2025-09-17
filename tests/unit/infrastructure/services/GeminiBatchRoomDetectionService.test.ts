import { GeminiBatchRoomDetectionService } from '@/infrastructure/services/GeminiBatchRoomDetectionService';
import { BatchRoomDetectionRequest } from '@/domain/services/IBatchRoomDetector';

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

describe('GeminiBatchRoomDetectionService', () => {
  let service: GeminiBatchRoomDetectionService;
  let mockGenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeminiBatchRoomDetectionService();
    
    // Get the mocked instance
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    mockGenAI = new GoogleGenerativeAI();
  });

  describe('analyzeImagesBatch', () => {
    it('should use individual processing for small batches', async () => {
      const requests: BatchRoomDetectionRequest[] = [
        {
          imageId: 'img1',
          imageBase64: 'base64data1'
        },
        {
          imageId: 'img2',
          imageBase64: 'base64data2'
        }
      ];

      // Mock individual processing
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: [] },
              composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: [] },
              technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
              clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
              color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
              enhancement_priority: ['lighting'],
              batch_consistency: { needs_consistency_filter: true, style_reference: 'first_image' }
            })
          }
        })
      };

      mockGenAI.getGenerativeModel = jest.fn().mockReturnValue(mockModel);

      const results = await service.analyzeImagesBatch(requests);

      expect(results).toHaveLength(2);
      expect(results[0].imageId).toBe('img1');
      expect(results[0].analysis).toBeDefined();
      expect(results[1].imageId).toBe('img2');
      expect(results[1].analysis).toBeDefined();
    });

    it('should use batch processing for large batches', async () => {
      // Create a large batch of requests
      const requests: BatchRoomDetectionRequest[] = Array.from({ length: 10 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      // Mock batch processing
      const mockBatchJob = {
        name: 'batch-job-123',
        state: { name: 'JOB_STATE_SUCCEEDED' },
        dest: {
          inlined_responses: requests.map((req, i) => ({
            response: {
              text: () => JSON.stringify({
                lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: [] },
                composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: [] },
                technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
                clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
                color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
                enhancement_priority: ['lighting'],
                batch_consistency: { needs_consistency_filter: true, style_reference: 'first_image' }
              })
            }
          }))
        }
      };

      mockGenAI.batches.create = jest.fn().mockResolvedValue(mockBatchJob);
      mockGenAI.batches.get = jest.fn().mockResolvedValue(mockBatchJob);

      const results = await service.analyzeImagesBatch(requests);

      expect(results).toHaveLength(10);
      expect(mockGenAI.batches.create).toHaveBeenCalled();
      expect(mockGenAI.batches.get).toHaveBeenCalled();
    });

    it('should handle batch processing errors gracefully', async () => {
      const requests: BatchRoomDetectionRequest[] = Array.from({ length: 10 }, (_, i) => ({
        imageId: `img${i}`,
        imageBase64: `base64data${i}`
      }));

      // Mock batch processing failure
      mockGenAI.batches.create = jest.fn().mockRejectedValue(new Error('Batch processing failed'));

      // Should fallback to individual processing
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              lighting: { quality: 'good', type: 'natural', brightness: 'good', issues: [], needs_enhancement: [] },
              composition: { framing: 'good', angle: 'optimal', symmetry: 'good', key_selling_points_visible: true, issues: [], needs_enhancement: [] },
              technical_quality: { sharpness: 'good', noise_level: 'low', exposure: 'perfect', color_balance: 'neutral', issues: [], needs_enhancement: [] },
              clutter_and_staging: { people_present: false, clutter_level: 'minimal', distracting_objects: [], styling_needs: [], needs_removal: [] },
              color_and_tone: { current_tone: 'neutral', saturation_level: 'good', white_balance: 'good', needs_enhancement: [] },
              enhancement_priority: ['lighting'],
              batch_consistency: { needs_consistency_filter: true, style_reference: 'first_image' }
            })
          }
        })
      };

      mockGenAI.getGenerativeModel = jest.fn().mockReturnValue(mockModel);

      const results = await service.analyzeImagesBatch(requests);

      expect(results).toHaveLength(10);
      expect(mockGenAI.batches.create).toHaveBeenCalled();
      // Should fallback to individual processing
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalled();
    });
  });
});
