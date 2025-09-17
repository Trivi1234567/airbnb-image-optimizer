import { ImageAnalysis } from '@/domain/entities/Image';

export interface BatchRoomDetectionRequest {
  imageId: string;
  imageBase64: string;
}

export interface BatchRoomDetectionResponse {
  imageId: string;
  analysis?: ImageAnalysis;
  error?: string;
}

export interface IBatchRoomDetector {
  /**
   * Analyze multiple images in a single batch request
   * @param requests Array of image analysis requests
   * @returns Promise with array of analysis results
   */
  analyzeImagesBatch(requests: BatchRoomDetectionRequest[]): Promise<BatchRoomDetectionResponse[]>;
}
