import { GoogleGenerativeAI } from '@google/generative-ai';
import { IBatchRoomDetector, BatchRoomDetectionRequest, BatchRoomDetectionResponse } from '@/domain/services/IBatchRoomDetector';
import { ImageAnalysis } from '@/domain/entities/Image';
import { env } from '../config/environment';
import { GEMINI_BATCH_MODELS } from '../config/constants';
import { logger } from '../config/logger';

export class GeminiBatchRoomDetectionService implements IBatchRoomDetector {
  private genAI: GoogleGenerativeAI;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please check your environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  async analyzeImagesBatch(requests: BatchRoomDetectionRequest[]): Promise<BatchRoomDetectionResponse[]> {
    try {
      logger.info('Starting batch room detection', { requestCount: requests.length });

      // Always use batch API - no individual processing fallback
      return this.processBatchRequest(requests);

    } catch (error) {
      logger.error('Batch room detection failed', { 
        requestCount: requests.length,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error(`Batch room detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  private async processBatchRequest(requests: BatchRoomDetectionRequest[]): Promise<BatchRoomDetectionResponse[]> {
    try {
      // Process all requests in parallel for true batch processing
      logger.info('Processing batch requests in parallel', { requestCount: requests.length });
      
      const responses = await Promise.allSettled(
        requests.map(request => this.processIndividualRequest(request))
      );
      
      return responses.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const request = requests[index];
          if (!request) {
            logger.error('Request not found for index', { index });
            return {
              imageId: 'unknown',
              error: 'Request not found'
            };
          }
          
          logger.error('Individual request failed', { 
            imageId: request.imageId, 
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error' 
          });
          return {
            imageId: request.imageId,
            error: result.reason instanceof Error ? result.reason.message : 'Processing failed'
          };
        }
      });

    } catch (error) {
      logger.error('Batch request failed', { error });
      throw error;
    }
  }

  private async processIndividualRequest(request: BatchRoomDetectionRequest): Promise<BatchRoomDetectionResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: GEMINI_BATCH_MODELS.IMAGE_ANALYSIS 
      });

      const prompt = this.getRoomDetectionPrompt();
      
      const result = await model.generateContent([
        {
          text: prompt,
        },
        {
          inlineData: {
            data: request.imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const rawResponse = response.text();
      console.log('Raw Gemini response for room detection:', {
        imageId: request.imageId,
        rawResponse: rawResponse
      });
      
      const analysis = this.parseAnalysisResponse(response);
      
      console.log('Room detection result:', {
        imageId: request.imageId,
        detectedRoomType: analysis.room_type,
        roomContext: analysis.room_context,
        fullAnalysis: analysis
      });
      
      return {
        imageId: request.imageId,
        analysis
      };
    } catch (error) {
      return {
        imageId: request.imageId,
        error: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  }



  private parseAnalysisResponse(response: any): ImageAnalysis {
    let responseText: string;
    
    if (typeof response === 'string') {
      responseText = response;
    } else if (response?.text) {
      responseText = typeof response.text === 'function' ? response.text() : response.text;
    } else {
      throw new Error('Invalid response format');
    }

    console.log('Raw response text before parsing:', responseText);

    // Clean the response text to extract JSON from markdown code blocks
    let cleanedText = responseText.trim();
    
    // Remove markdown code block markers if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log('Cleaned response text:', cleanedText);

    try {
      const analysis = JSON.parse(cleanedText) as ImageAnalysis;
      console.log('Parsed analysis:', analysis);
      this.validateAnalysis(analysis);
      return analysis;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response text that failed to parse:', cleanedText);
      throw new Error(`Failed to parse analysis response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  }

  private validateAnalysis(analysis: any): asserts analysis is ImageAnalysis {
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Invalid analysis response: not an object');
    }

    // Validate required fields
    const requiredFields = ['room_type', 'room_context', 'lighting', 'composition', 'technical_quality', 'clutter_and_staging', 'color_and_tone', 'enhancement_priority', 'specific_improvements', 'batch_consistency'];
    
    for (const field of requiredFields) {
      if (!analysis[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate room type
    if (!['bedroom', 'kitchen', 'bathroom', 'living_room', 'exterior', 'other'].includes(analysis.room_type)) {
      throw new Error(`Invalid room type: ${analysis.room_type}`);
    }

    // Validate room context
    if (!analysis.room_context || typeof analysis.room_context !== 'object') {
      throw new Error('Invalid room context analysis');
    }
    if (!['small', 'medium', 'large'].includes(analysis.room_context.size)) {
      throw new Error(`Invalid room size: ${analysis.room_context.size}`);
    }

    // Validate lighting
    if (!['excellent', 'good', 'poor'].includes(analysis.lighting.quality)) {
      throw new Error(`Invalid lighting quality: ${analysis.lighting.quality}`);
    }

    // Validate composition
    if (!['good', 'needs_adjustment'].includes(analysis.composition.framing)) {
      throw new Error(`Invalid composition framing: ${analysis.composition.framing}`);
    }

    // Validate enhancement priority is array
    if (!Array.isArray(analysis.enhancement_priority)) {
      throw new Error('Enhancement priority must be an array');
    }

    // Validate specific improvements
    if (!analysis.specific_improvements || typeof analysis.specific_improvements !== 'object') {
      throw new Error('Invalid specific improvements analysis');
    }
  }

  private getRoomDetectionPrompt(): string {
    return `You are a professional real estate photographer and image enhancement specialist analyzing an Airbnb listing image for comprehensive optimization opportunities.

OBJECTIVE: Enhance real estate photos to appear professionally shot, optimized for Airbnb listings, maximizing visual appeal while maintaining authenticity (NO fake elements).

CRITICAL: You MUST accurately identify the room type. Look carefully at the image and determine if it's clearly a bedroom, kitchen, bathroom, living room, or exterior. Only use "other" if the room type is genuinely ambiguous or unclear.

ANALYZE THIS IMAGE FOR:

1. ROOM TYPE & CONTEXT:
   - Primary room type (bedroom, kitchen, bathroom, living_room, exterior, other)
   - Look for clear indicators: beds = bedroom, stovetop/sink = kitchen, toilet/shower = bathroom, sofas/TV = living_room, outdoor space = exterior
   - Room size and layout characteristics
   - Key architectural features and selling points

2. LIGHTING ANALYSIS:
   - Overall quality and distribution
   - Natural vs artificial light sources
   - Shadow patterns and harshness
   - Color temperature and white balance
   - Brightness levels and exposure

3. COMPOSITION & FRAMING:
   - Current framing effectiveness
   - Camera angle and perspective
   - Symmetry and balance
   - Key selling points visibility
   - Vertical/horizontal line alignment
   - Wide-angle potential

4. TECHNICAL QUALITY:
   - Image sharpness and focus
   - Noise levels and grain
   - Exposure accuracy
   - Color accuracy and saturation
   - Overall image clarity

5. CLUTTER & STAGING:
   - People presence (must be removed)
   - Clutter levels and distracting elements
   - Room organization and tidiness
   - Personal items and cords
   - Styling opportunities

6. COLOR & TONE:
   - Current color temperature
   - Saturation levels
   - White balance accuracy
   - Overall mood and atmosphere

7. ENHANCEMENT OPPORTUNITIES:
   - Specific technical improvements needed
   - Composition adjustments required
   - Lighting enhancements needed
   - Styling and organization improvements
   - Color and tone adjustments

Return ONLY valid JSON with this exact structure:
{
  "room_type": "bedroom|kitchen|bathroom|living_room|exterior|other",
  // IMPORTANT: Choose the most appropriate room type based on clear visual indicators:
  // - bedroom: contains bed, nightstand, dresser, bedroom furniture
  // - kitchen: contains stove, refrigerator, sink, countertops, kitchen cabinets
  // - bathroom: contains toilet, shower, bathtub, sink, bathroom fixtures
  // - living_room: contains sofa, TV, coffee table, living room furniture
  // - exterior: outdoor space, garden, patio, balcony, exterior view
  // - other: only if room type is genuinely unclear or ambiguous
  "room_context": {
    "size": "small|medium|large",
    "layout": "open|closed|mixed",
    "key_features": ["large_windows", "high_ceilings", "modern_fixtures", "natural_light", "architectural_details"],
    "selling_points": ["spacious_feel", "natural_light", "modern_design", "luxury_finishes", "outdoor_access"]
  },
  "lighting": {
    "quality": "excellent|good|poor",
    "type": "natural|artificial|mixed",
    "brightness": "too_dark|good|too_bright",
    "distribution": "even|uneven|harsh",
    "color_temperature": "warm|neutral|cool|mixed",
    "issues": ["harsh_shadows", "uneven_lighting", "color_cast", "dim_corners", "overexposed_areas", "yellow_tint", "blue_tint"],
    "needs_enhancement": ["brighten_rooms", "simulate_daylight", "avoid_shadows", "adjust_contrast", "fix_white_balance", "even_lighting", "warm_lighting"]
  },
  "composition": {
    "framing": "good|needs_adjustment",
    "angle": "optimal|too_low|too_high|off_center",
    "symmetry": "good|needs_correction",
    "perspective": "wide_angle|normal|telephoto|distorted",
    "key_selling_points_visible": true|false,
    "vertical_lines": "straight|slightly_tilted|significantly_tilted",
    "horizontal_lines": "straight|slightly_tilted|significantly_tilted",
    "issues": ["poor_angle", "cut_off_elements", "asymmetrical", "not_centered", "tilted_lines", "distorted_perspective"],
    "needs_enhancement": ["reframe_wide_angle", "center_balanced", "highlight_selling_points", "correct_vertical_lines", "correct_horizontal_lines", "improve_perspective"]
  },
  "technical_quality": {
    "sharpness": "excellent|good|poor",
    "noise_level": "low|medium|high",
    "exposure": "perfect|underexposed|overexposed|mixed",
    "color_balance": "neutral|warm|cool|color_cast",
    "focus": "sharp|slightly_soft|blurry",
    "issues": ["blurry", "noisy", "washed_out", "oversaturated", "soft_focus", "motion_blur"],
    "needs_enhancement": ["sharpen_edges", "clean_noise", "adjust_exposure", "enhance_textures", "improve_focus", "reduce_blur"]
  },
  "clutter_and_staging": {
    "people_present": true|false,
    "clutter_level": "minimal|moderate|high",
    "distracting_objects": ["cords", "personal_items", "random_counters", "messy_areas", "toiletries", "clothes", "electronics"],
    "styling_needs": ["straighten_pillows", "smooth_bed_sheets", "align_chairs", "fold_towels", "align_cushions", "organize_items", "clean_surfaces"],
    "needs_removal": ["people", "cords", "personal_items", "clutter", "distracting_objects", "toiletries", "clothes", "electronics"],
    "organization_opportunities": ["tidy_surfaces", "align_furniture", "organize_items", "clean_areas", "straighten_objects"]
  },
  "color_and_tone": {
    "current_tone": "neutral|warm|cool|mixed",
    "saturation_level": "low|good|high",
    "white_balance": "good|too_warm|too_cool",
    "color_accuracy": "accurate|slightly_off|significantly_off",
    "mood": "inviting|neutral|cold|overwhelming",
    "needs_enhancement": ["apply_professional_filter", "warm_tones", "neutral_whites", "enhance_saturation", "consistency_filter", "improve_white_balance", "adjust_color_temperature"]
  },
  "enhancement_priority": ["lighting", "composition", "styling", "technical_quality", "color_tone"],
  "specific_improvements": {
    "lighting_fixes": ["brighten_dark_areas", "soften_harsh_shadows", "improve_color_temperature", "even_lighting_distribution"],
    "composition_fixes": ["correct_perspective", "improve_framing", "straighten_lines", "highlight_features"],
    "styling_fixes": ["remove_clutter", "organize_items", "straighten_objects", "clean_surfaces"],
    "technical_fixes": ["sharpen_image", "reduce_noise", "adjust_exposure", "improve_focus"],
    "color_fixes": ["adjust_white_balance", "enhance_saturation", "warm_tones", "neutral_whites"]
  },
  "batch_consistency": {
    "needs_consistency_filter": true|false,
    "style_reference": "first_image|none",
    "consistency_notes": "Maintain same lighting style, color temperature, and enhancement level across batch"
  }
}`;
  }
}
