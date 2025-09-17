import { ImageAnalysis } from '../entities/Image';

export interface IRoomDetector {
  analyzeImage(imageBase64: string): Promise<ImageAnalysis>;
}
