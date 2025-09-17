import { GoogleGenerativeAI } from '@google/generative-ai';
import { IBatchImageOptimizer, BatchImageOptimizationRequest, BatchImageOptimizationResponse } from '@/domain/services/IBatchImageOptimizer';
import { RoomType } from '@/domain/entities/RoomType';
import { ImageAnalysis } from '@/domain/entities/Image';
import { env } from '../config/environment';
import { GEMINI_BATCH_MODELS } from '../config/constants';
import { logger } from '../config/logger';

export class GeminiBatchImageOptimizationService implements IBatchImageOptimizer {
  private genAI: GoogleGenerativeAI;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please check your environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  async optimizeImagesBatch(requests: BatchImageOptimizationRequest[]): Promise<BatchImageOptimizationResponse[]> {
    try {
      logger.info('Starting batch image optimization', { requestCount: requests.length });

      // Always use batch API - no individual processing fallback
      return this.processBatchRequest(requests);

    } catch (error) {
      logger.error('Batch image optimization failed', { 
        requestCount: requests.length,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error(`Batch image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  private async processBatchRequest(requests: BatchImageOptimizationRequest[]): Promise<BatchImageOptimizationResponse[]> {
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
              imageId: `unknown_${index}`,
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

  private async processIndividualRequest(request: BatchImageOptimizationRequest): Promise<BatchImageOptimizationResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: GEMINI_BATCH_MODELS.IMAGE_OPTIMIZATION 
      });

      const prompt = this.buildOptimizationPromptWithRoomSpecific(request.roomType, request.analysis);
      
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
      const optimizedImage = this.extractOptimizedImage(response);
      
      if (optimizedImage) {
        return {
          imageId: request.imageId,
          optimizedImageBase64: optimizedImage
        };
      } else {
        return {
          imageId: request.imageId,
          error: 'No optimized image found in response'
        };
      }
    } catch (error) {
      return {
        imageId: request.imageId,
        error: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  }



  private buildOptimizationPromptWithRoomSpecific(roomType: RoomType, analysis: ImageAnalysis): string {
    const isFirstImage = analysis.batch_consistency?.style_reference === 'first_image';
    
    // Start with the base room-specific prompt but make it more targeted
    let prompt = this.buildTargetedPrompt(roomType, analysis);
    
    // Add batch consistency note if needed
    if (isFirstImage) {
      prompt += `\n\nBATCH CONSISTENCY: Apply this professional real estate photography style as reference for batch consistency.`;
    } else if (analysis.batch_consistency?.needs_consistency_filter) {
      prompt += `\n\nBATCH CONSISTENCY: Maintain consistent lighting style and color temperature with previous images.`;
    }
    
    return prompt;
  }

  private buildTargetedPrompt(roomType: RoomType, analysis: ImageAnalysis): string {
    // Extract the core transformation instruction from the base prompt
    const coreInstruction = this.extractCoreInstruction(roomType);
    
    // Build targeted instructions based on what actually needs fixing
    const targetedInstructions = this.buildTargetedInstructions(analysis, roomType);
    
    // Only include technical requirements that are always needed
    const technicalRequirements = `TECHNICAL REQUIREMENTS:
- Resize to 16:9 ratio (1024x683px minimum)
- Maintain authenticity - NO fake elements`;

    return `${coreInstruction}

${targetedInstructions}

${technicalRequirements}

Apply changes precisely as specified above.`;
  }

  private extractCoreInstruction(roomType: RoomType): string {
    // Extract the main transformation instruction (first line of each room prompt)
    const roomInstructions = {
      [RoomType.BEDROOM]: "Transform this bedroom into a luxury hotel-quality space optimized for Airbnb listings:",
      [RoomType.KITCHEN]: "Transform this kitchen into a premium real estate showcase optimized for Airbnb listings:",
      [RoomType.BATHROOM]: "Transform this bathroom into a spa-like luxury space optimized for Airbnb listings:",
      [RoomType.LIVING_ROOM]: "Transform this living room into a warm, inviting space optimized for Airbnb listings:",
      [RoomType.EXTERIOR]: "Transform this exterior into a stunning property showcase optimized for Airbnb listings:",
      [RoomType.OTHER]: "Transform this room into a professional real estate showcase optimized for Airbnb listings:"
    };
    
    return roomInstructions[roomType] || roomInstructions[RoomType.OTHER];
  }

  private buildTargetedInstructions(analysis: ImageAnalysis, roomType: RoomType): string {
    const instructions = [];
    
    // Only add instructions for issues that actually exist
    if (analysis.lighting.quality === 'poor' || analysis.lighting.brightness === 'too_dark') {
      instructions.push('• Brighten the room evenly - eliminate dark corners and shadows');
    }
    
    if (analysis.lighting.issues.includes('harsh_shadows')) {
      instructions.push('• Soften harsh shadows and create even lighting distribution');
    }
    
    if (analysis.lighting.issues.includes('color_cast') || analysis.lighting.issues.includes('yellow_tint')) {
      instructions.push('• Correct color temperature - remove yellow/blue tint, achieve neutral white balance');
    }
    
    if (analysis.composition.vertical_lines === 'slightly_tilted' || analysis.composition.vertical_lines === 'significantly_tilted') {
      instructions.push('• Straighten all vertical lines (walls, door frames, windows)');
    }
    
    if (analysis.composition.horizontal_lines === 'slightly_tilted' || analysis.composition.horizontal_lines === 'significantly_tilted') {
      instructions.push('• Straighten all horizontal lines (countertops, furniture edges)');
    }
    
    if (analysis.composition.angle === 'too_low' || analysis.composition.angle === 'too_high') {
      instructions.push('• Adjust camera angle to optimal real estate photography height');
    }
    
    if (analysis.composition.issues.includes('cut_off_elements')) {
      instructions.push('• Reframe to include all important room elements');
    }
    
    if (analysis.technical_quality.sharpness === 'poor' || analysis.technical_quality.focus === 'blurry') {
      instructions.push('• Sharpen image and improve focus clarity');
    }
    
    if (analysis.technical_quality.noise_level === 'high' || analysis.technical_quality.noise_level === 'medium') {
      instructions.push('• Reduce image noise and grain');
    }
    
    if (analysis.technical_quality.exposure === 'underexposed') {
      instructions.push('• Increase exposure to proper brightness levels');
    }
    
    if (analysis.technical_quality.exposure === 'overexposed') {
      instructions.push('• Reduce exposure to prevent overexposed areas');
    }
    
    // People removal - always include if people are present
    if (analysis.clutter_and_staging.people_present) {
      instructions.push('• Remove all people from the image');
    }
    
    // Room-specific clutter removal based on actual issues
    if (analysis.clutter_and_staging.clutter_level === 'high' || analysis.clutter_and_staging.clutter_level === 'moderate') {
      if (analysis.clutter_and_staging.distracting_objects.includes('cords')) {
        instructions.push('• Remove all visible cords and cables');
      }
      if (analysis.clutter_and_staging.distracting_objects.includes('personal_items')) {
        instructions.push('• Remove personal items and belongings');
      }
      if (analysis.clutter_and_staging.distracting_objects.includes('random_counters')) {
        instructions.push('• Clear all countertops and surfaces');
      }
    }
    
    // Room-specific styling based on actual needs
    if (roomType === RoomType.BEDROOM) {
      if (analysis.clutter_and_staging.styling_needs.includes('straighten_pillows')) {
        instructions.push('• Straighten and fluff all pillows');
      }
      if (analysis.clutter_and_staging.styling_needs.includes('smooth_bed_sheets')) {
        instructions.push('• Smooth and straighten bed sheets');
      }
    }
    
    if (roomType === RoomType.BATHROOM) {
      if (analysis.clutter_and_staging.styling_needs.includes('fold_towels')) {
        instructions.push('• Fold and organize all towels neatly');
      }
      if (analysis.clutter_and_staging.distracting_objects.includes('toiletries')) {
        instructions.push('• Remove all toiletries and personal items');
      }
    }
    
    if (roomType === RoomType.LIVING_ROOM) {
      if (analysis.clutter_and_staging.styling_needs.includes('align_chairs')) {
        instructions.push('• Align all chairs and furniture');
      }
      if (analysis.clutter_and_staging.styling_needs.includes('align_cushions')) {
        instructions.push('• Straighten and align all cushions');
      }
    }
    
    if (roomType === RoomType.KITCHEN) {
      if (analysis.clutter_and_staging.distracting_objects.includes('random_counters')) {
        instructions.push('• Clear all countertops completely');
      }
    }
    
    // Color and tone adjustments based on actual issues
    if (analysis.color_and_tone.white_balance === 'too_warm' || analysis.color_and_tone.white_balance === 'too_cool') {
      instructions.push('• Correct white balance to neutral temperature');
    }
    
    if (analysis.color_and_tone.saturation_level === 'low') {
      instructions.push('• Slightly enhance saturation for wood, plants, and textiles (keep realistic)');
    }
    
    if (analysis.color_and_tone.saturation_level === 'high') {
      instructions.push('• Reduce oversaturation to natural levels');
    }
    
    if (analysis.color_and_tone.current_tone === 'cool') {
      instructions.push('• Add subtle warm tones to make space more inviting');
    }
    
    // Texture enhancement based on technical quality
    if (analysis.technical_quality.needs_enhancement.includes('enhance_textures')) {
      instructions.push('• Enhance texture details in wood, fabric, and glass surfaces');
    }
    
    // If no specific issues found, provide minimal enhancement
    if (instructions.length === 0) {
      instructions.push('• Apply subtle professional real estate photography enhancement');
      instructions.push('• Ensure optimal brightness and contrast');
      instructions.push('• Maintain natural, inviting atmosphere');
    }
    
    return instructions.join('\n');
  }






  private extractOptimizedImage(result: any): string | null {
    try {
      const candidates = result.candidates;
      if (!candidates || candidates.length === 0) {
        return null;
      }

      const content = candidates[0].content;
      if (!content || !content.parts) {
        return null;
      }

      const imagePart = content.parts.find((part: any) => part.inlineData);
      return imagePart?.inlineData?.data || null;
    } catch (error) {
      logger.error('Failed to extract optimized image from response', { error });
      return null;
    }
  }
}
