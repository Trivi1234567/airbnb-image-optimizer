import { v4 as uuidv4 } from 'uuid';
import { OptimizationJob, JobStatus } from '@/domain/entities/OptimizationJob';
import { Image, ImagePair } from '@/domain/entities/Image';
import { RoomType } from '@/domain/entities/RoomType';
import { IJobRepository } from '@/domain/repositories/IJobRepository';
import { IImageScraper } from '@/domain/services/IImageScraper';
import { IBatchRoomDetector, BatchRoomDetectionRequest } from '@/domain/services/IBatchRoomDetector';
import { IBatchImageOptimizer, BatchImageOptimizationRequest } from '@/domain/services/IBatchImageOptimizer';
import { OptimizationRequest } from '../dto/OptimizationRequest.dto';
import { OptimizationResponse } from '../dto/OptimizationResponse.dto';
import { logger } from '@/infrastructure/config/logger';

// Circuit Breaker Implementation
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000, // 1 minute
    private name: string
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        logger.info(`Circuit breaker ${this.name} entering HALF_OPEN state`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN - service unavailable`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn(`Circuit breaker ${this.name} opened due to ${this.failureCount} failures`);
    }
  }
}

// Telemetry Collector
class TelemetryCollector {
  private static instance: TelemetryCollector;
  private operations: Map<string, { startTime: number; metadata: any }> = new Map();

  static getInstance(): TelemetryCollector {
    if (!TelemetryCollector.instance) {
      TelemetryCollector.instance = new TelemetryCollector();
    }
    return TelemetryCollector.instance;
  }

  startOperation(jobId: string, operation: string, metadata: any = {}): string {
    const operationId = `${jobId}-${operation}-${Date.now()}`;
    this.operations.set(operationId, {
      startTime: Date.now(),
      metadata
    });
    return operationId;
  }

  endOperation(operationId: string, success: boolean, error?: string): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      const duration = Date.now() - operation.startTime;
      logger.info('Operation completed', {
        operationId,
        duration,
        success,
        error,
        metadata: operation.metadata
      });
      this.operations.delete(operationId);
    }
  }
}

// Batch Consistency Manager
class BatchConsistencyManager {
  private isFirstImage = true;
  
  resetBatch() {
    this.isFirstImage = true;
  }
  
  isFirstImageInBatch(): boolean {
    return this.isFirstImage;
  }
  
  markFirstImageProcessed() {
    this.isFirstImage = false;
  }
}

export class ProcessOptimizationJob {
  private scraperCircuitBreaker: CircuitBreaker;
  private batchRoomDetectorCircuitBreaker: CircuitBreaker;
  private batchImageOptimizerCircuitBreaker: CircuitBreaker;
  private telemetry: TelemetryCollector;
  private batchConsistencyManager: BatchConsistencyManager;

  constructor(
    private jobRepository: IJobRepository,
    private imageScraper: IImageScraper,
    private batchRoomDetector: IBatchRoomDetector,
    private batchImageOptimizer: IBatchImageOptimizer
  ) {
    this.scraperCircuitBreaker = new CircuitBreaker(3, 30000, 'ImageScraper');
    this.batchRoomDetectorCircuitBreaker = new CircuitBreaker(5, 60000, 'BatchRoomDetector');
    this.batchImageOptimizerCircuitBreaker = new CircuitBreaker(5, 60000, 'BatchImageOptimizer');
    this.telemetry = TelemetryCollector.getInstance();
    this.batchConsistencyManager = new BatchConsistencyManager();
  }

  async execute(request: OptimizationRequest): Promise<OptimizationResponse> {
    const jobId = uuidv4();
    const operationId = this.telemetry.startOperation(jobId, 'ProcessOptimizationJob', {
      url: request.airbnbUrl,
      maxImages: request.maxImages
    });
    
    try {
      logger.info('Starting optimization job with batch processing', { 
        jobId, 
        url: request.airbnbUrl, 
        maxImages: request.maxImages 
      });

      // Validate input using Zod schema
      const validatedRequest = this.validateRequest(request);
      
      // Create initial job
      const job = await this.createInitialJob(jobId, validatedRequest.airbnbUrl);
      
      // Reset batch consistency for new job
      this.batchConsistencyManager.resetBatch();
      
      // Start processing asynchronously
      this.processJobAsync(job, validatedRequest.maxImages);

      this.telemetry.endOperation(operationId, true);
      
      return {
        success: true,
        jobId,
        message: 'Optimization job started successfully with batch processing',
        data: {
          job: {
            id: job.id,
            airbnbUrl: job.airbnbUrl,
            status: job.status,
            progress: job.progress,
            createdAt: job.createdAt.toISOString(),
            updatedAt: job.updatedAt.toISOString()
          },
          images: job.images.map(img => ({
            id: img.id,
            originalUrl: img.originalUrl,
            fileName: img.fileName,
            roomType: this.mapApifyRoomTypeToRoomType('', img.analysis?.room_type),
            processingStatus: img.processingStatus,
            error: img.error
          })),
          imagePairs: job.imagePairs.map(pair => ({
            original: {
              id: pair.original.id,
              originalUrl: pair.original.originalUrl,
              fileName: pair.original.fileName,
              roomType: this.mapApifyRoomTypeToRoomType('', pair.original.analysis?.room_type),
              processingStatus: pair.original.processingStatus,
              error: pair.original.error
            },
            optimized: pair.optimized ? {
              id: pair.optimized.id,
              originalUrl: pair.optimized.originalUrl,
              fileName: pair.optimized.fileName,
              roomType: this.mapApifyRoomTypeToRoomType('', pair.optimized.analysis?.room_type),
              processingStatus: pair.optimized.processingStatus,
              error: pair.optimized.error
            } : undefined,
            roomType: pair.roomType,
            fileName: pair.fileName,
            optimizationComment: (pair as any).optimizationComment
          }))
        }
      };

    } catch (error) {
      this.telemetry.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Optimization job failed', { 
        jobId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        jobId,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private validateRequest(request: OptimizationRequest): OptimizationRequest {
    // Basic validation - in production, use Zod schema
    if (!request.airbnbUrl || typeof request.airbnbUrl !== 'string') {
      throw new Error('Invalid Airbnb URL');
    }
    
    if (request.maxImages && (request.maxImages < 1 || request.maxImages > 20)) {
      throw new Error('Max images must be between 1 and 20');
    }

    return {
      airbnbUrl: request.airbnbUrl,
      maxImages: request.maxImages || 10
    };
  }

  private async createInitialJob(jobId: string, airbnbUrl: string): Promise<OptimizationJob> {
    const job: OptimizationJob = {
      id: jobId,
      airbnbUrl,
      status: JobStatus.PENDING,
      images: [],
      imagePairs: [],
      progress: {
        total: 0,
        completed: 0,
        failed: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.jobRepository.create(job);
  }

  private async processJobAsync(job: OptimizationJob, maxImages: number): Promise<void> {
    const operationId = this.telemetry.startOperation(job.id, 'ProcessJobAsync');
    
    try {
      console.log('🔄 Starting async processing with batch optimization for job:', job.id);
      
      // Update status to scraping
      await this.jobRepository.updateStatus(job.id, JobStatus.SCRAPING);
      
      // Scrape Airbnb listing with circuit breaker
      const listing = await this.scraperCircuitBreaker.execute(async () => {
        return await this.imageScraper.scrapeAirbnbListing(job.airbnbUrl);
      });

      const imageUrls = listing.images.slice(0, maxImages);
      logger.info('Scraped images from Airbnb listing', { 
        jobId: job.id, 
        totalImages: listing.images.length, 
        processingImages: imageUrls.length,
        roomType: listing.roomType
      });

      // Update job with scraped images and room type
      const images = imageUrls.map((url, index) => this.createImageFromUrl(url, index));
      const updatedJob = { 
        ...job, 
        images, 
        progress: { ...job.progress, total: images.length },
        status: JobStatus.SCRAPING,
        roomType: listing.roomType
      };
      await this.jobRepository.update(updatedJob);

      // Update status to processing
      await this.jobRepository.updateStatus(job.id, JobStatus.PROCESSING);

      // Process all images using batch processing
      const imagePairs = await this.processImagesWithBatch(images, job.id, listing.roomType, updatedJob);

      // Mark job as completed
      await this.jobRepository.updateStatus(job.id, JobStatus.COMPLETED);
      this.telemetry.endOperation(operationId, true);
      
      logger.info('Optimization job completed with batch processing', { 
        jobId: job.id, 
        totalImages: images.length,
        completed: imagePairs.filter(p => p.optimized).length,
        failed: imagePairs.filter(p => !p.optimized).length
      });

    } catch (error) {
      this.telemetry.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Optimization job failed', { 
        jobId: job.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      await this.jobRepository.updateStatus(job.id, JobStatus.FAILED, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async processImagesWithBatch(
    images: Image[], 
    jobId: string, 
    apifyRoomType: string, 
    updatedJob: OptimizationJob
  ): Promise<ImagePair[]> {
    const imagePairs: ImagePair[] = [];
    
    try {
      logger.info('Processing images with batch API', { 
        jobId, 
        imageCount: images.length
      });
      
      // Download all images
      const imageData = await Promise.all(
        images.map(async (image, index) => {
          const imageBuffer = await this.downloadImage(image.originalUrl);
          const imageBase64 = imageBuffer.toString('base64');
          return {
            image: { ...image, originalBase64: imageBase64, processingStatus: 'analyzing' as const },
            imageBase64,
            index
          };
        })
      );

      // Batch room detection
      const roomDetectionRequests: BatchRoomDetectionRequest[] = imageData.map(({ image, imageBase64 }) => ({
        imageId: image.id,
        imageBase64
      }));

      const roomDetectionResponses = await this.batchRoomDetectorCircuitBreaker.execute(async () => {
        return await this.batchRoomDetector.analyzeImagesBatch(roomDetectionRequests);
      });
      
      // Process room detection results
      const analyzedImages = imageData.map(({ image }) => {
        const response = roomDetectionResponses.find(r => r.imageId === image.id);
        if (response?.analysis) {
          // Apply batch consistency settings
          const isFirstImage = this.batchConsistencyManager.isFirstImageInBatch();
          response.analysis.batch_consistency = {
            needs_consistency_filter: true,
            style_reference: isFirstImage ? 'first_image' : 'none',
            consistency_notes: 'Maintain same lighting style, color temperature, and enhancement level across batch'
          };
          
          if (isFirstImage) {
            this.batchConsistencyManager.markFirstImageProcessed();
          }
          
          return { 
            ...image, 
            analysis: response.analysis, 
            processingStatus: 'optimizing' as const 
          };
        } else {
          return { 
            ...image, 
            processingStatus: 'failed' as const,
            error: response?.error || 'Room detection failed'
          };
        }
      });

      // Batch image optimization - use individual detected room type for each image
      const optimizationRequests: BatchImageOptimizationRequest[] = analyzedImages
        .filter(img => img.analysis && img.processingStatus === 'optimizing')
        .map(img => {
          // Use individual detected room type, fallback to Apify room type
          const detectedRoomType = img.analysis?.room_type;
          const roomType = this.mapApifyRoomTypeToRoomType(apifyRoomType, detectedRoomType);
          
          console.log('Room type mapping debug:', {
            imageId: img.id,
            apifyRoomType,
            detectedRoomType,
            mappedRoomType: roomType,
            analysis: img.analysis
          });
          
          return {
            imageId: img.id,
            imageBase64: img.originalBase64!,
            roomType,
            analysis: img.analysis!
          };
        });

      const optimizationResponses = await this.batchImageOptimizerCircuitBreaker.execute(async () => {
        return await this.batchImageOptimizer.optimizeImagesBatch(optimizationRequests);
      });

      // Create image pairs
      for (let i = 0; i < images.length; i++) {
        const originalImage = analyzedImages[i];
        if (!originalImage) continue;
        const optimizationResponse = optimizationResponses.find(r => r.imageId === originalImage.id);
        
        // Determine room type for this specific image
        const detectedRoomType = originalImage.analysis?.room_type;
        const imageRoomType = this.mapApifyRoomTypeToRoomType(apifyRoomType, detectedRoomType);
        
        console.log('Image pair creation debug:', {
          imageIndex: i,
          imageId: originalImage.id,
          apifyRoomType,
          detectedRoomType,
          imageRoomType,
          fileName: `${imageRoomType}_${i + 1}.jpg`
        });
        
        if (optimizationResponse?.optimizedImageBase64) {
          const optimizedImage: Image = {
            id: uuidv4(),
            originalUrl: originalImage.originalUrl,
            originalBase64: originalImage.originalBase64!,
            optimizedBase64: optimizationResponse.optimizedImageBase64,
            analysis: originalImage.analysis!,
            fileName: `${imageRoomType}_${i + 1}.jpg`,
            processingStatus: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const optimizationComment = this.generateOptimizationComment(imageRoomType, originalImage.analysis!);

          imagePairs.push({
            original: originalImage,
            optimized: optimizedImage,
            roomType: imageRoomType,
            fileName: optimizedImage.fileName,
            optimizationComment
          });
        } else {
          const failedOptimizedImage = {
            ...originalImage,
            processingStatus: 'failed' as const,
            error: optimizationResponse?.error || 'Image optimization failed'
          };

          imagePairs.push({
            original: originalImage,
            optimized: failedOptimizedImage,
            roomType: imageRoomType,
            fileName: `failed_${i + 1}.jpg`,
            optimizationComment: 'Processing failed'
          });
        }
      }

      // Update progress
      const progress = { 
        ...updatedJob.progress, 
        completed: images.length,
        failed: imagePairs.filter(p => !p.optimized).length
      };
      
      await this.jobRepository.update({
        ...updatedJob,
        imagePairs,
        progress,
        status: JobStatus.PROCESSING
      });

    } catch (error) {
      logger.error('Batch processing failed', { 
        jobId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Create failed image pairs for all images
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image) continue;
        
        const failedImage: Image = { 
          id: image.id,
          originalUrl: image.originalUrl,
          fileName: image.fileName,
          processingStatus: 'failed' as const,
          error: error instanceof Error ? error.message : 'Batch processing failed',
          createdAt: image.createdAt,
          updatedAt: image.updatedAt
        };
        
        imagePairs.push({
          original: failedImage,
          optimized: failedImage,
          roomType: this.mapApifyRoomTypeToRoomType(apifyRoomType, 'other'),
          fileName: `failed_${i + 1}.jpg`,
          optimizationComment: 'Batch processing failed'
        });
      }
    }
    
    return imagePairs;
  }

  private createImageFromUrl(url: string, index: number): Image {
    return {
      id: uuidv4(),
      originalUrl: url,
      fileName: `image_${index + 1}.jpg`,
      processingStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private mapApifyRoomTypeToRoomType(apifyRoomType: string, detectedRoomType?: string): RoomType {
    const roomTypeMap: Record<string, RoomType> = {
      'bedroom': RoomType.BEDROOM,
      'kitchen': RoomType.KITCHEN,
      'bathroom': RoomType.BATHROOM,
      'living_room': RoomType.LIVING_ROOM,
      'exterior': RoomType.EXTERIOR,
      'other': RoomType.OTHER
    };
    
    let mappedRoomType: RoomType;
    
    // If Apify provides a specific room type, use it
    if (apifyRoomType && roomTypeMap[apifyRoomType.toLowerCase()]) {
      mappedRoomType = roomTypeMap[apifyRoomType.toLowerCase()];
    }
    // Otherwise, use Gemini-detected room type if available
    else if (detectedRoomType && detectedRoomType.toLowerCase() !== 'other') {
      mappedRoomType = roomTypeMap[detectedRoomType.toLowerCase()] || RoomType.OTHER;
    }
    // Fallback to other
    else {
      mappedRoomType = RoomType.OTHER;
    }
    
    console.log('Room type mapping debug:', {
      apifyRoomType,
      detectedRoomType,
      mappedRoomType,
      apifyHasSpecificType: !!(apifyRoomType && roomTypeMap[apifyRoomType.toLowerCase()]),
      usingGeminiDetection: !!(detectedRoomType && detectedRoomType.toLowerCase() !== 'other' && !(apifyRoomType && roomTypeMap[apifyRoomType.toLowerCase()]))
    });
    
    return mappedRoomType;
  }

  private generateOptimizationComment(roomType: RoomType, analysis: any): string {
    const enhancements = [];
    
    // Only include enhancements that were actually applied based on specific issues found
    if (analysis.lighting?.quality === 'poor' || analysis.lighting?.brightness === 'too_dark') {
      enhancements.push('• Improved lighting and brightness');
    }
    
    if (analysis.lighting?.issues?.includes('harsh_shadows')) {
      enhancements.push('• Reduced harsh shadows');
    }
    
    if (analysis.lighting?.issues?.includes('color_cast') || analysis.lighting?.issues?.includes('yellow_tint')) {
      enhancements.push('• Corrected color temperature');
    }
    
    if (analysis.composition?.vertical_lines === 'slightly_tilted' || analysis.composition?.vertical_lines === 'significantly_tilted') {
      enhancements.push('• Straightened architectural lines');
    }
    
    if (analysis.composition?.horizontal_lines === 'slightly_tilted' || analysis.composition?.horizontal_lines === 'significantly_tilted') {
      enhancements.push('• Aligned horizontal elements');
    }
    
    if (analysis.composition?.angle === 'too_low' || analysis.composition?.angle === 'too_high') {
      enhancements.push('• Improved framing and perspective');
    }
    
    if (analysis.technical_quality?.sharpness === 'poor' || analysis.technical_quality?.focus === 'blurry') {
      enhancements.push('• Enhanced image sharpness');
    }
    
    if (analysis.clutter_and_staging?.people_present) {
      enhancements.push('• Removed people from image');
    }
    
    if (analysis.clutter_and_staging?.clutter_level === 'high' || analysis.clutter_and_staging?.clutter_level === 'moderate') {
      if (analysis.clutter_and_staging?.distracting_objects?.includes('cords')) {
        enhancements.push('• Cleaned up visible cables and cords');
      }
      if (analysis.clutter_and_staging?.distracting_objects?.includes('personal_items')) {
        enhancements.push('• Removed personal belongings');
      }
      if (analysis.clutter_and_staging?.distracting_objects?.includes('random_counters')) {
        enhancements.push('• Cleaned up clutter and distractions');
      }
    }
    
    // Room-specific enhancements
    if (roomType === RoomType.BEDROOM) {
      if (analysis.clutter_and_staging?.styling_needs?.includes('straighten_pillows')) {
        enhancements.push('• Straightened and fluffed pillows');
      }
      if (analysis.clutter_and_staging?.styling_needs?.includes('smooth_bed_sheets')) {
        enhancements.push('• Smoothed bed sheets');
      }
    }
    
    if (roomType === RoomType.BATHROOM) {
      if (analysis.clutter_and_staging?.styling_needs?.includes('fold_towels')) {
        enhancements.push('• Folded and organized towels');
      }
      if (analysis.clutter_and_staging?.distracting_objects?.includes('toiletries')) {
        enhancements.push('• Removed toiletries and personal items');
      }
    }
    
    if (roomType === RoomType.LIVING_ROOM) {
      if (analysis.clutter_and_staging?.styling_needs?.includes('align_chairs')) {
        enhancements.push('• Aligned chairs and furniture');
      }
      if (analysis.clutter_and_staging?.styling_needs?.includes('align_cushions')) {
        enhancements.push('• Straightened cushions');
      }
    }
    
    if (roomType === RoomType.KITCHEN) {
      if (analysis.clutter_and_staging?.distracting_objects?.includes('random_counters')) {
        enhancements.push('• Cleared countertops');
      }
    }
    
    return enhancements.length > 0 
      ? enhancements.join('\n')
      : `• Applied professional ${roomType} enhancement`;
  }

}