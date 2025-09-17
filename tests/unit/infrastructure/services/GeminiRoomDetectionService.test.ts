import { GeminiRoomDetectionService } from '@/infrastructure/services/GeminiRoomDetectionService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RoomType } from '@/domain/entities/RoomType';

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai');

const MockedGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

describe('GeminiRoomDetectionService', () => {
  let service: GeminiRoomDetectionService;
  let mockGenAI: jest.Mocked<GoogleGenerativeAI>;
  let mockModel: any;

  const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

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
    
    service = new GeminiRoomDetectionService();
  });

  describe('analyzeImage', () => {
    it('should successfully detect bedroom room type', async () => {
      const mockResponse = {
        roomType: 'bedroom',
        lighting: {
          quality: 'excellent',
          type: 'natural',
          issues: []
        },
        composition: {
          issues: [],
          strengths: ['symmetrical', 'rule_of_thirds']
        },
        enhancementPriority: ['lighting', 'color_correction']
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: JSON.stringify(mockResponse)
        }
      });

      const result = await service.analyzeImage(mockImageBase64);

      expect(result.roomType).toBe(RoomType.BEDROOM);
      expect(result.lighting.quality).toBe('excellent');
      expect(result.composition.strengths).toContain('symmetrical');
      expect(result.enhancementPriority).toContain('lighting');
    });

    it('should detect all supported room types correctly', async () => {
      const roomTypes = [
        { input: 'bedroom', expected: RoomType.BEDROOM },
        { input: 'kitchen', expected: RoomType.KITCHEN },
        { input: 'bathroom', expected: RoomType.BATHROOM },
        { input: 'living_room', expected: RoomType.LIVING_ROOM },
        { input: 'exterior', expected: RoomType.EXTERIOR },
        { input: 'other', expected: RoomType.OTHER }
      ];

      for (const roomType of roomTypes) {
        const mockResponse = {
          roomType: roomType.input,
          lighting: { quality: 'good', type: 'natural', issues: [] },
          composition: { issues: [], strengths: [] },
          enhancementPriority: []
        };

        mockModel.generateContent.mockResolvedValue({
          response: {
            text: JSON.stringify(mockResponse)
          }
        });

        const result = await service.analyzeImage(mockImageBase64);

        expect(result.roomType).toBe(roomType.expected);
      }
    });

    it('should handle different lighting quality levels', async () => {
      const lightingQualities = ['excellent', 'good', 'poor'];

      for (const quality of lightingQualities) {
        const mockResponse = {
          roomType: 'bedroom',
          lighting: {
            quality,
            type: 'natural',
            issues: quality === 'poor' ? ['dim', 'harsh'] : []
          },
          composition: { issues: [], strengths: [] },
          enhancementPriority: []
        };

        mockModel.generateContent.mockResolvedValue({
          response: {
            text: JSON.stringify(mockResponse)
          }
        });

        const result = await service.analyzeImage(mockImageBase64);

        expect(result.lighting.quality).toBe(quality);
        if (quality === 'poor') {
          expect(result.lighting.issues).toContain('dim');
        }
      }
    });

    it('should handle different lighting types', async () => {
      const lightingTypes = ['natural', 'artificial', 'mixed'];

      for (const type of lightingTypes) {
        const mockResponse = {
          roomType: 'bedroom',
          lighting: {
            quality: 'good',
            type,
            issues: []
          },
          composition: { issues: [], strengths: [] },
          enhancementPriority: []
        };

        mockModel.generateContent.mockResolvedValue({
          response: {
            text: JSON.stringify(mockResponse)
          }
        });

        const result = await service.analyzeImage(mockImageBase64);

        expect(result.lighting.type).toBe(type);
      }
    });

    it('should identify composition issues correctly', async () => {
      const mockResponse = {
        roomType: 'bedroom',
        lighting: { quality: 'good', type: 'natural', issues: [] },
        composition: {
          issues: ['cluttered', 'poor_angle', 'objects_cut_off'],
          strengths: ['symmetrical']
        },
        enhancementPriority: ['clutter_removal']
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: JSON.stringify(mockResponse)
        }
      });

      const result = await service.analyzeImage(mockImageBase64);

      expect(result.composition.issues).toContain('cluttered');
      expect(result.composition.issues).toContain('poor_angle');
      expect(result.composition.issues).toContain('objects_cut_off');
      expect(result.composition.strengths).toContain('symmetrical');
    });

    it('should set enhancement priorities based on analysis', async () => {
      const mockResponse = {
        roomType: 'bedroom',
        lighting: { quality: 'poor', type: 'artificial', issues: ['dim'] },
        composition: {
          issues: ['cluttered'],
          strengths: []
        },
        enhancementPriority: ['lighting', 'clutter_removal', 'color_correction']
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: JSON.stringify(mockResponse)
        }
      });

      const result = await service.analyzeImage(mockImageBase64);

      expect(result.enhancementPriority).toContain('lighting');
      expect(result.enhancementPriority).toContain('clutter_removal');
      expect(result.enhancementPriority).toContain('color_correction');
    });

    it('should handle API failures with proper error messages', async () => {
      const apiError = new Error('Gemini API error');
      mockModel.generateContent.mockRejectedValue(apiError);

      await expect(service.analyzeImage(mockImageBase64))
        .rejects
        .toThrow('Room detection failed: Gemini API error');
    });

    it('should handle invalid JSON response', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: 'Invalid JSON response'
        }
      });

      await expect(service.analyzeImage(mockImageBase64))
        .rejects
        .toThrow('Room detection failed');
    });

    it('should handle malformed response structure', async () => {
      const malformedResponse = {
        roomType: 'bedroom'
        // Missing required fields
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: JSON.stringify(malformedResponse)
        }
      });

      await expect(service.analyzeImage(mockImageBase64))
        .rejects
        .toThrow('Invalid lighting analysis');
    });

    it('should handle invalid room type in response', async () => {
      const invalidResponse = {
        roomType: 'invalid_room_type',
        lighting: { quality: 'good', type: 'natural', issues: [] },
        composition: { issues: [], strengths: [] },
        enhancementPriority: []
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: JSON.stringify(invalidResponse)
        }
      });

      await expect(service.analyzeImage(mockImageBase64))
        .rejects
        .toThrow('Invalid room type: invalid_room_type');
    });

    it('should handle invalid lighting quality', async () => {
      const invalidResponse = {
        roomType: 'bedroom',
        lighting: { quality: 'invalid_quality', type: 'natural', issues: [] },
        composition: { issues: [], strengths: [] },
        enhancementPriority: []
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: JSON.stringify(invalidResponse)
        }
      });

      await expect(service.analyzeImage(mockImageBase64))
        .rejects
        .toThrow('Invalid lighting quality: invalid_quality');
    });

    it('should handle missing enhancement priority array', async () => {
      const invalidResponse = {
        roomType: 'bedroom',
        lighting: { quality: 'good', type: 'natural', issues: [] },
        composition: { issues: [], strengths: [] },
        enhancementPriority: 'not_an_array'
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: JSON.stringify(invalidResponse)
        }
      });

      await expect(service.analyzeImage(mockImageBase64))
        .rejects
        .toThrow('Invalid enhancement priority: must be an array');
    });

    it('should handle network timeout', async () => {
      jest.useFakeTimers();
      
      mockModel.generateContent.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 30000);
        })
      );

      const analyzePromise = service.analyzeImage(mockImageBase64);
      
      jest.advanceTimersByTime(30000);
      
      // Process any pending promises
      await Promise.resolve();
      
      await expect(analyzePromise).rejects.toThrow('Room detection failed: Timeout');
      
      jest.useRealTimers();
    }, 10000);

    it('should handle empty response text', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: ''
        }
      });

      await expect(service.analyzeImage(mockImageBase64))
        .rejects
        .toThrow('Room detection failed');
    });

    it('should handle null response', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: null
      });

      await expect(service.analyzeImage(mockImageBase64))
        .rejects
        .toThrow('Room detection failed');
    });

    it('should log successful analysis', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockResponse = {
        roomType: 'bedroom',
        lighting: { quality: 'excellent', type: 'natural', issues: [] },
        composition: { issues: [], strengths: [] },
        enhancementPriority: []
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: JSON.stringify(mockResponse)
        }
      });

      await service.analyzeImage(mockImageBase64);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting room detection analysis')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Room detection completed',
        { roomType: 'bedroom', lightingQuality: 'excellent' }
      );

      consoleSpy.mockRestore();
    });

    it('should log analysis errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const apiError = new Error('API Error');
      mockModel.generateContent.mockRejectedValue(apiError);

      try {
        await service.analyzeImage(mockImageBase64);
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Room detection failed',
        'API Error'
      );

      consoleSpy.mockRestore();
    }, 10000);

    it('should handle rate limiting errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      mockModel.generateContent.mockRejectedValue(rateLimitError);

      await expect(service.analyzeImage(mockImageBase64))
        .rejects
        .toThrow('Room detection failed: Rate limit exceeded');
    }, 10000);

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key');
      mockModel.generateContent.mockRejectedValue(authError);

      await expect(service.analyzeImage(mockImageBase64))
        .rejects
        .toThrow('Room detection failed: Invalid API key');
    }, 10000);
  });

  describe('validateAnalysis', () => {
    it('should validate correct analysis structure', () => {
      const validAnalysis = {
        roomType: 'bedroom',
        lighting: {
          quality: 'excellent',
          type: 'natural',
          issues: []
        },
        composition: {
          issues: [],
          strengths: []
        },
        enhancementPriority: []
      };

      expect(() => service['validateAnalysis'](validAnalysis)).not.toThrow();
    });

    it('should reject non-object input', () => {
      expect(() => service['validateAnalysis'](null)).toThrow('Invalid analysis response: not an object');
      expect(() => service['validateAnalysis'](undefined)).toThrow('Invalid analysis response: not an object');
      expect(() => service['validateAnalysis']('string')).toThrow('Invalid analysis response: not an object');
      expect(() => service['validateAnalysis'](123)).toThrow('Invalid analysis response: not an object');
    });

    it('should reject invalid room types', () => {
      const invalidAnalysis = {
        roomType: 'invalid_type',
        lighting: { quality: 'excellent', type: 'natural', issues: [] },
        composition: { issues: [], strengths: [] },
        enhancementPriority: []
      };

      expect(() => service['validateAnalysis'](invalidAnalysis))
        .toThrow('Invalid room type: invalid_type');
    });

    it('should reject invalid lighting structure', () => {
      const invalidAnalysis = {
        roomType: 'bedroom',
        lighting: 'not_an_object',
        composition: { issues: [], strengths: [] },
        enhancementPriority: []
      };

      expect(() => service['validateAnalysis'](invalidAnalysis))
        .toThrow('Invalid lighting analysis');
    });

    it('should reject invalid composition structure', () => {
      const invalidAnalysis = {
        roomType: 'bedroom',
        lighting: { quality: 'excellent', type: 'natural', issues: [] },
        composition: 'not_an_object',
        enhancementPriority: []
      };

      expect(() => service['validateAnalysis'](invalidAnalysis))
        .toThrow('Invalid composition analysis');
    });
  });
});
