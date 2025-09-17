import { NextRequest, NextResponse } from 'next/server';
import type { Image } from '@/domain/entities/Image';
import { RoomType } from '@/domain/entities/RoomType';
import { cacheManager, CacheKeys } from '../caching/cache-strategy';
import { performanceService } from '../monitoring/performance';
import { logger } from '../config/logger';
import { cache } from '../config/environment';

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  /**
   * Generate optimized image URL for CDN
   */
  static generateOptimizedUrl(
    originalUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
      roomType?: RoomType;
    } = {}
  ): string {
    const {
      width = 1920,
      height = 1080,
      quality = 85,
      format = 'webp',
      roomType = RoomType.OTHER,
    } = options;

    // If using CDN, generate optimized URL
    if (process.env.CDN_BASE_URL) {
      const params = new URLSearchParams({
        url: originalUrl,
        w: width.toString(),
        h: height.toString(),
        q: quality.toString(),
        f: format,
        room: roomType,
      });
      
      return `${process.env.CDN_BASE_URL}/optimize?${params.toString()}`;
    }

    // Fallback to original URL
    return originalUrl;
  }

  /**
   * Generate responsive image URLs
   */
  static generateResponsiveUrls(
    originalUrl: string,
    roomType: RoomType = RoomType.OTHER
  ): {
    mobile: string;
    tablet: string;
    desktop: string;
    retina: string;
  } {
    return {
      mobile: this.generateOptimizedUrl(originalUrl, {
        width: 640,
        height: 480,
        quality: 80,
        roomType,
      }),
      tablet: this.generateOptimizedUrl(originalUrl, {
        width: 1024,
        height: 768,
        quality: 85,
        roomType,
      }),
      desktop: this.generateOptimizedUrl(originalUrl, {
        width: 1920,
        height: 1080,
        quality: 90,
        roomType,
      }),
      retina: this.generateOptimizedUrl(originalUrl, {
        width: 3840,
        height: 2160,
        quality: 95,
        roomType,
      }),
    };
  }

  /**
   * Generate WebP image URL with fallback
   */
  static generateWebPWithFallback(
    originalUrl: string,
    roomType: RoomType = RoomType.OTHER
  ): {
    webp: string;
    fallback: string;
  } {
    return {
      webp: this.generateOptimizedUrl(originalUrl, {
        format: 'webp',
        quality: 85,
        roomType,
      }),
      fallback: this.generateOptimizedUrl(originalUrl, {
        format: 'jpeg',
        quality: 85,
        roomType,
      }),
    };
  }

  /**
   * Preload critical images
   */
  static generatePreloadLinks(images: Image[]): string[] {
    return images
      .filter(img => img.analysis?.room_type)
      .slice(0, 3) // Preload first 3 images
      .map(img => {
        const urls = this.generateResponsiveUrls(
          img.originalUrl,
          img.analysis!.room_type as RoomType
        );
        
        return `
          <link rel="preload" as="image" href="${urls.mobile}" media="(max-width: 640px)">
          <link rel="preload" as="image" href="${urls.tablet}" media="(min-width: 641px) and (max-width: 1024px)">
          <link rel="preload" as="image" href="${urls.desktop}" media="(min-width: 1025px)">
        `.trim();
      });
  }

  /**
   * Generate lazy loading attributes
   */
  static generateLazyLoadingAttributes(
    _image: Image,
    index: number
  ): {
    loading: 'lazy' | 'eager';
    decoding: 'async' | 'sync';
    fetchpriority: 'high' | 'low' | 'auto';
  } {
    return {
      loading: index < 3 ? 'eager' : 'lazy',
      decoding: 'async',
      fetchpriority: index < 2 ? 'high' : 'auto',
    };
  }

  /**
   * Generate image dimensions for layout shift prevention
   */
  static generateImageDimensions(
    _image: Image,
    aspectRatio: number = 16 / 9
  ): {
    width: number;
    height: number;
    style: string;
  } {
    const baseWidth = 800;
    const baseHeight = Math.round(baseWidth / aspectRatio);
    
    return {
      width: baseWidth,
      height: baseHeight,
      style: `aspect-ratio: ${aspectRatio}; width: 100%; height: auto;`,
    };
  }
}

/**
 * Image caching middleware
 */
export class ImageCacheMiddleware {
  /**
   * Cache image analysis results
   */
  static async cacheImageAnalysis(
    imageId: string,
    analysis: any
  ): Promise<void> {
    const key = CacheKeys.imageAnalysis(imageId);
    await cacheManager.set(key, analysis, 3600); // 1 hour TTL
  }

  /**
   * Get cached image analysis
   */
  static async getCachedImageAnalysis(imageId: string): Promise<any | null> {
    const key = CacheKeys.imageAnalysis(imageId);
    return await cacheManager.get(key);
  }

  /**
   * Cache optimized image data
   */
  static async cacheOptimizedImage(
    imageId: string,
    optimizedData: string
  ): Promise<void> {
    const key = CacheKeys.imageOptimized(imageId);
    await cacheManager.set(key, optimizedData, 3600); // 1 hour TTL
  }

  /**
   * Get cached optimized image
   */
  static async getCachedOptimizedImage(imageId: string): Promise<string | null> {
    const key = CacheKeys.imageOptimized(imageId);
    return await cacheManager.get(key);
  }

  /**
   * Cache job progress
   */
  static async cacheJobProgress(
    jobId: string,
    progress: any
  ): Promise<void> {
    const key = CacheKeys.jobProgress(jobId);
    await cacheManager.set(key, progress, cache.ttl.api);
  }

  /**
   * Get cached job progress
   */
  static async getCachedJobProgress(jobId: string): Promise<any | null> {
    const key = CacheKeys.jobProgress(jobId);
    return await cacheManager.get(key);
  }
}

/**
 * Image optimization API handler
 */
export async function handleImageOptimization(
  _request: NextRequest,
  imageId: string
): Promise<NextResponse> {
  const startTime = performance.now();
  
  try {
    // Check cache first
    const cachedImage = await ImageCacheMiddleware.getCachedOptimizedImage(imageId);
    if (cachedImage) {
      return new NextResponse(cachedImage, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Cache': 'HIT',
        },
      });
    }

    // If not cached, return 404 for now
    // In a real implementation, this would trigger image optimization
    return new NextResponse('Image not found', {
      status: 404,
      headers: {
        'X-Cache': 'MISS',
      },
    });

  } catch (error) {
    logger.error('Image optimization error:', { imageId, error });
    
    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: {
        'X-Cache': 'ERROR',
      },
    });
  } finally {
    const duration = performance.now() - startTime;
    performanceService.trackCustomMetric('image_optimization_duration', duration);
  }
}

/**
 * Image preloading service
 */
export class ImagePreloadService {
  /**
   * Preload critical images
   */
  static async preloadCriticalImages(images: Image[]): Promise<void> {
    const criticalImages = images
      .filter(img => img.analysis?.room_type)
      .slice(0, 3);

    const preloadPromises = criticalImages.map(async (image) => {
      try {
        const urls = ImageOptimizer.generateResponsiveUrls(
          image.originalUrl,
          image.analysis!.room_type as RoomType
        );

        // Preload mobile version
        await this.preloadImage(urls.mobile);
        
        // Preload desktop version
        await this.preloadImage(urls.desktop);
      } catch (error) {
        logger.warn('Failed to preload image:', { imageId: image.id, error });
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Preload single image
   */
  private static async preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load ${url}`));
      img.src = url;
    });
  }
}

/**
 * Image compression utilities
 */
export class ImageCompression {
  /**
   * Calculate optimal quality based on file size
   */
  static calculateOptimalQuality(
    originalSize: number,
    targetSize: number
  ): number {
    const ratio = targetSize / originalSize;
    
    if (ratio >= 1) return 95;
    if (ratio >= 0.8) return 90;
    if (ratio >= 0.6) return 85;
    if (ratio >= 0.4) return 80;
    if (ratio >= 0.2) return 75;
    return 70;
  }

  /**
   * Estimate compressed size
   */
  static estimateCompressedSize(
    originalSize: number,
    quality: number
  ): number {
    const qualityFactor = quality / 100;
    const compressionFactor = 0.8; // WebP compression factor
    
    return Math.round(originalSize * qualityFactor * compressionFactor);
  }

  /**
   * Generate compression report
   */
  static generateCompressionReport(
    originalSize: number,
    compressedSize: number
  ): {
    originalSize: number;
    compressedSize: number;
    savings: number;
    savingsPercentage: number;
  } {
    const savings = originalSize - compressedSize;
    const savingsPercentage = (savings / originalSize) * 100;

    return {
      originalSize,
      compressedSize,
      savings,
      savingsPercentage: Math.round(savingsPercentage * 100) / 100,
    };
  }
}
