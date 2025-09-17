import { RoomType } from '../entities/RoomType';
import { ImageAnalysis } from '../entities/Image';

export interface IImageOptimizer {
  optimizeImage(
    imageBase64: string, 
    roomType: RoomType, 
    analysis: ImageAnalysis
  ): Promise<string>;
}
