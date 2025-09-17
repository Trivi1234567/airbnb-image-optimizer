import { GeminiOptimizationService } from '@/infrastructure/services/GeminiOptimizationService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RoomType } from '@/domain/entities/RoomType';
import { ImageAnalysis } from '@/domain/entities/Image';

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai');

const MockedGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

describe('GeminiOptimizationService', () => {
  let service: GeminiOptimizationService;
  let mockGenAI: jest.Mocked<GoogleGenerativeAI>;
  let mockModel: any;

  const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  const mockAnalysis: ImageAnalysis = {
    roomType: RoomType.BEDROOM,
    lighting: {
      quality: 'good',
      type: 'natural',
      issues: []
    },
    composition: {
      issues: ['cluttered'],
      strengths: ['symmetrical']
    },
    enhancementPriority: ['clutter_removal', 'lighting']
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock model
    mockModel = {
      generateContent: jest.fn()
    };

    // Setup mock GenAI
    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    } as any;

    MockedGoogleGenerativeAI.mockImplementation(() => mockGenAI);
    
    service = new GeminiOptimizationService();
  });

  describe('optimizeImage', () => {
    it('should successfully optimize bedroom image', async () => {
      const mockOptimizedImage = 'optimized-bedroom-image-base64';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  data: mockOptimizedImage
                }
              }]
            }
          }]
        }
      });

      const result = await service.optimizeImage(mockImageBase64, RoomType.BEDROOM, mockAnalysis);

      expect(result).toBe(mockOptimizedImage);
      expect(mockModel.generateContent).toHaveBeenCalledWith([
        expect.stringContaining('Transform to luxury hotel bedroom'),
        {
          inlineData: {
            data: mockImageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);
    });

    it('should apply room-specific optimization prompts', async () => {
      const roomTypes = [
        RoomType.BEDROOM,
        RoomType.KITCHEN,
        RoomType.BATHROOM,
        RoomType.LIVING_ROOM,
        RoomType.EXTERIOR,
        RoomType.OTHER
      ];

      const expectedPrompts = [
        'Transform to luxury hotel bedroom',
        'Create premium real estate kitchen photo',
        'Spa-like atmosphere',
        'Warm inviting space',
        'Enhanced curb appeal',
        'Enhance this room professionally'
      ];

      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: { data: 'optimized-image' }
              }]
            }
          }]
        }
      });

      for (let i = 0; i < roomTypes.length; i++) {
        await service.optimizeImage(mockImageBase64, roomTypes[i], mockAnalysis);
        
        expect(mockModel.generateContent).toHaveBeenNthCalledWith(i + 1, [
          expect.stringContaining(expectedPrompts[i]),
          {
            inlineData: {
              data: mockImageBase64,
              mimeType: 'image/jpeg'
            }
          }
        ]);
      }
    });

    it('should enhance prompts based on analysis', async () => {
      const analysisWithIssues: ImageAnalysis = {
        ...mockAnalysis,
        lighting: { quality: 'poor', type: 'artificial', issues: ['dim'] },
        composition: { issues: ['cluttered', 'poor_angle'], strengths: [] },
        enhancementPriority: ['lighting', 'clutter_removal', 'color_correction']
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: { data: 'optimized-image' }
              }]
            }
          }]
        }
      });

      await service.optimizeImage(mockImageBase64, RoomType.BEDROOM, analysisWithIssues);

      const calledPrompt = mockModel.generateContent.mock.calls[0][0][0];
      expect(calledPrompt).toContain('Dramatically improve lighting quality and brightness');
      expect(calledPrompt).toContain('Remove all clutter and personal items');
      expect(calledPrompt).toContain('Adjust perspective to show the room\'s best features');
      expect(calledPrompt).toContain('Enhance color saturation and contrast naturally');
    });

    it('should handle API failures with retry', async () => {
      const apiError = new Error('Gemini API error');
      mockModel.generateContent
        .mockRejectedValueOnce(apiError)
        .mockRejectedValueOnce(apiError)
        .mockRejectedValueOnce(apiError)
        .mockResolvedValue({
          response: {
            candidates: [{
              content: {
                parts: [{
                  inlineData: { data: 'optimized-image' }
                }]
              }
            }]
          }
        });

      await expect(service.optimizeImage(mockImageBase64, RoomType.BEDROOM, mockAnalysis))
        .rejects
        .toThrow('Image optimization failed: Gemini API error');
    });

    it('should handle missing optimized image in response', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                text: 'No image generated'
              }]
            }
          }]
        }
      });

      await expect(service.optimizeImage(mockImageBase64, RoomType.BEDROOM, mockAnalysis))
        .rejects
        .toThrow('No optimized image found in response');
    });

    it('should handle empty candidates array', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: []
        }
      });

      await expect(service.optimizeImage(mockImageBase64, RoomType.BEDROOM, mockAnalysis))
        .rejects
        .toThrow('No optimized image found in response');
    });

    it('should handle malformed response structure', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: []
            }
          }]
        }
      });

      await expect(service.optimizeImage(mockImageBase64, RoomType.BEDROOM, mockAnalysis))
        .rejects
        .toThrow('No optimized image found in response');
    });

    it('should handle network timeout', async () => {
      jest.useFakeTimers();
      
      mockModel.generateContent.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 30000);
        })
      );

      const optimizePromise = service.optimizeImage(mockImageBase64, RoomType.BEDROOM, mockAnalysis);
      
      jest.advanceTimersByTime(30000);
      
      await expect(optimizePromise).rejects.toThrow('Image optimization failed: Timeout');
      
      jest.useRealTimers();
    });

    it('should maintain image dimensions in prompt', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: { data: 'optimized-image' }
              }]
            }
          }]
        }
      });

      await service.optimizeImage(mockImageBase64, RoomType.BEDROOM, mockAnalysis);

      const calledPrompt = mockModel.generateContent.mock.calls[0][0][0];
      expect(calledPrompt).toContain('maintain photorealistic quality');
      expect(calledPrompt).toContain('ensure all vertical lines are perfectly straight');
    });

    it('should handle base64 encoding/decoding correctly', async () => {
      const testImageBase64 = 'dGVzdC1pbWFnZS1kYXRh';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: { data: 'encoded-optimized-image' }
              }]
            }
          }]
        }
      });

      const result = await service.optimizeImage(testImageBase64, RoomType.BEDROOM, mockAnalysis);

      expect(result).toBe('encoded-optimized-image');
      expect(mockModel.generateContent).toHaveBeenCalledWith([
        expect.any(String),
        {
          inlineData: {
            data: testImageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);
    });

    it('should handle different room types with appropriate prompts', async () => {
      const roomTypeTests = [
        {
          roomType: RoomType.KITCHEN,
          expectedKeywords: ['kitchen', 'premium real estate', 'surfaces gleam', 'counters']
        },
        {
          roomType: RoomType.BATHROOM,
          expectedKeywords: ['spa', 'clinical lighting', 'sparkling fixtures', 'towels']
        },
        {
          roomType: RoomType.LIVING_ROOM,
          expectedKeywords: ['warm', 'inviting space', 'natural light']
        },
        {
          roomType: RoomType.EXTERIOR,
          expectedKeywords: ['golden hour', 'curb appeal', 'vibrant']
        }
      ];

      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: { data: 'optimized-image' }
              }]
            }
          }]
        }
      });

      for (const test of roomTypeTests) {
        await service.optimizeImage(mockImageBase64, test.roomType, mockAnalysis);
        
        const calledPrompt = mockModel.generateContent.mock.calls[mockModel.generateContent.mock.calls.length - 1][0][0];
        test.expectedKeywords.forEach(keyword => {
          expect(calledPrompt.toLowerCase()).toContain(keyword.toLowerCase());
        });
      }
    });

    it('should handle API rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      mockModel.generateContent.mockRejectedValue(rateLimitError);

      await expect(service.optimizeImage(mockImageBase64, RoomType.BEDROOM, mockAnalysis))
        .rejects
        .toThrow('Image optimization failed: Rate limit exceeded');
    });

    it('should handle invalid base64 input', async () => {
      const invalidBase64 = 'invalid-base64-string!@#';

      await expect(service.optimizeImage(invalidBase64, RoomType.BEDROOM, mockAnalysis))
        .rejects
        .toThrow();
    });

    it('should log optimization progress', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: { data: 'optimized-image' }
              }]
            }
          }]
        }
      });

      await service.optimizeImage(mockImageBase64, RoomType.BEDROOM, mockAnalysis);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Starting image optimization',
        { roomType: 'bedroom' }
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Image optimization completed',
        { roomType: 'bedroom' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('buildEnhancedPrompt', () => {
    it('should build enhanced prompt for poor lighting', async () => {
      const analysisWithPoorLighting: ImageAnalysis = {
        ...mockAnalysis,
        lighting: { quality: 'poor', type: 'artificial', issues: ['dim', 'harsh'] }
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: { data: 'optimized-image' }
              }]
            }
          }]
        }
      });

      await service.optimizeImage(mockImageBase64, RoomType.BEDROOM, analysisWithPoorLighting);

      const calledPrompt = mockModel.generateContent.mock.calls[0][0][0];
      expect(calledPrompt).toContain('Dramatically improve lighting quality and brightness');
    });

    it('should build enhanced prompt for cluttered composition', async () => {
      const analysisWithClutter: ImageAnalysis = {
        ...mockAnalysis,
        composition: { issues: ['cluttered'], strengths: [] }
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: { data: 'optimized-image' }
              }]
            }
          }]
        }
      });

      await service.optimizeImage(mockImageBase64, RoomType.KITCHEN, analysisWithClutter);

      const calledPrompt = mockModel.generateContent.mock.calls[0][0][0];
      expect(calledPrompt).toContain('remove all clutter from counters');
    });

    it('should build enhanced prompt for poor angle', async () => {
      const analysisWithPoorAngle: ImageAnalysis = {
        ...mockAnalysis,
        composition: { issues: ['poor_angle'], strengths: [] }
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: { data: 'optimized-image' }
              }]
            }
          }]
        }
      });

      await service.optimizeImage(mockImageBase64, RoomType.BEDROOM, analysisWithPoorAngle);

      const calledPrompt = mockModel.generateContent.mock.calls[0][0][0];
      expect(calledPrompt).toContain('Adjust perspective to show the room\'s best features');
    });
  });
});
