import { RoomType } from '@/domain/entities/RoomType';
import { ImageAnalysis } from '@/domain/entities/Image';

export interface BatchImageOptimizationRequest {
  imageId: string;
  imageBase64: string;
  roomType: RoomType;
  analysis: ImageAnalysis;
}

export interface BatchImageOptimizationResponse {
  imageId: string;
  optimizedImageBase64?: string;
  error?: string;
}

export interface IBatchImageOptimizer {
  /**
   * Optimize multiple images in a single batch request
   * @param requests Array of image optimization requests
   * @returns Promise with array of optimized images
   */
  optimizeImagesBatch(requests: BatchImageOptimizationRequest[]): Promise<BatchImageOptimizationResponse[]>;
}
