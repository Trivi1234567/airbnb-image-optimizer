import { env } from '../config/environment';
import { logger } from '../config/logger';

/**
 * CDN configuration and utilities
 */
export class CDNService {
  private static instance: CDNService;
  private baseUrl: string | null = null;
  private isEnabled = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): CDNService {
    if (!CDNService.instance) {
      CDNService.instance = new CDNService();
    }
    return CDNService.instance;
  }

  private initialize(): void {
    this.baseUrl = env.CDN_BASE_URL || null;
    this.isEnabled = !!this.baseUrl;
    
    if (this.isEnabled) {
      logger.info('CDN service initialized', { baseUrl: this.baseUrl });
    } else {
      logger.warn('CDN service disabled - no CDN_BASE_URL provided');
    }
  }

  /**
   * Check if CDN is enabled
   */
  isCDNEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get CDN base URL
   */
  getBaseUrl(): string | null {
    return this.baseUrl;
  }

  /**
   * Generate CDN URL for image optimization
   */
  generateImageUrl(
    originalUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png' | 'avif';
      roomType?: string;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
      gravity?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    } = {}
  ): string {
    if (!this.isEnabled || !this.baseUrl) {
      return originalUrl;
    }

    const {
      width = 1920,
      height = 1080,
      quality = 85,
      format = 'webp',
      roomType = 'other',
      fit = 'cover',
      gravity = 'center',
    } = options;

    const params = new URLSearchParams({
      url: originalUrl,
      w: width.toString(),
      h: height.toString(),
      q: quality.toString(),
      f: format,
      room: roomType,
      fit,
      gravity,
    });

    return `${this.baseUrl}/optimize?${params.toString()}`;
  }

  /**
   * Generate responsive image URLs
   */
  generateResponsiveUrls(
    originalUrl: string,
    roomType: string = 'other'
  ): {
    mobile: string;
    tablet: string;
    desktop: string;
    retina: string;
  } {
    return {
      mobile: this.generateImageUrl(originalUrl, {
        width: 640,
        height: 480,
        quality: 80,
        roomType,
      }),
      tablet: this.generateImageUrl(originalUrl, {
        width: 1024,
        height: 768,
        quality: 85,
        roomType,
      }),
      desktop: this.generateImageUrl(originalUrl, {
        width: 1920,
        height: 1080,
        quality: 90,
        roomType,
      }),
      retina: this.generateImageUrl(originalUrl, {
        width: 3840,
        height: 2160,
        quality: 95,
        roomType,
      }),
    };
  }

  /**
   * Generate WebP URL with fallback
   */
  generateWebPWithFallback(
    originalUrl: string,
    roomType: string = 'other'
  ): {
    webp: string;
    fallback: string;
  } {
    return {
      webp: this.generateImageUrl(originalUrl, {
        format: 'webp',
        quality: 85,
        roomType,
      }),
      fallback: this.generateImageUrl(originalUrl, {
        format: 'jpeg',
        quality: 85,
        roomType,
      }),
    };
  }

  /**
   * Generate multiple format URLs
   */
  generateMultipleFormats(
    originalUrl: string,
    roomType: string = 'other'
  ): {
    webp: string;
    avif: string;
    jpeg: string;
    png: string;
  } {
    return {
      webp: this.generateImageUrl(originalUrl, {
        format: 'webp',
        quality: 85,
        roomType,
      }),
      avif: this.generateImageUrl(originalUrl, {
        format: 'avif',
        quality: 85,
        roomType,
      }),
      jpeg: this.generateImageUrl(originalUrl, {
        format: 'jpeg',
        quality: 85,
        roomType,
      }),
      png: this.generateImageUrl(originalUrl, {
        format: 'png',
        quality: 85,
        roomType,
      }),
    };
  }

  /**
   * Generate srcset for responsive images
   */
  generateSrcSet(
    originalUrl: string,
    roomType: string = 'other',
    sizes: number[] = [640, 1024, 1920, 3840]
  ): string {
    return sizes
      .map(size => {
        const url = this.generateImageUrl(originalUrl, {
          width: size,
          quality: size <= 640 ? 80 : size <= 1024 ? 85 : 90,
          roomType,
        });
        return `${url} ${size}w`;
      })
      .join(', ');
  }

  /**
   * Generate sizes attribute
   */
  generateSizes(
    breakpoints: { min: number; max?: number; size: string }[] = [
      { min: 0, max: 640, size: '100vw' },
      { min: 641, max: 1024, size: '50vw' },
      { min: 1025, size: '33vw' },
    ]
  ): string {
    return breakpoints
      .map(bp => {
        if (bp.max) {
          return `(min-width: ${bp.min}px) and (max-width: ${bp.max}px) ${bp.size}`;
        }
        return `(min-width: ${bp.min}px) ${bp.size}`;
      })
      .join(', ');
  }

  /**
   * Preload critical images
   */
  async preloadImages(
    images: Array<{
      url: string;
      roomType: string;
      priority: 'high' | 'medium' | 'low';
    }>
  ): Promise<void> {
    const preloadPromises = images
      .filter(img => img.priority === 'high')
      .map(async (image) => {
        try {
          const urls = this.generateResponsiveUrls(image.url, image.roomType);
          
          // Preload mobile and desktop versions
          await Promise.all([
            this.preloadImage(urls.mobile),
            this.preloadImage(urls.desktop),
          ]);
        } catch (error) {
          logger.warn('Failed to preload image', { url: image.url, error });
        }
      });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Preload single image
   */
  private async preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load ${url}`));
      img.src = url;
    });
  }

  /**
   * Generate preload links for critical images
   */
  generatePreloadLinks(
    images: Array<{
      url: string;
      roomType: string;
      priority: 'high' | 'medium' | 'low';
    }>
  ): string[] {
    return images
      .filter(img => img.priority === 'high')
      .slice(0, 3) // Limit to first 3 critical images
      .map((image) => {
        const urls = this.generateResponsiveUrls(image.url, image.roomType);
        
        return `
          <link rel="preload" as="image" href="${urls.mobile}" media="(max-width: 640px)">
          <link rel="preload" as="image" href="${urls.tablet}" media="(min-width: 641px) and (max-width: 1024px)">
          <link rel="preload" as="image" href="${urls.desktop}" media="(min-width: 1025px)">
        `.trim();
      });
  }

  /**
   * Get CDN health status
   */
  async getHealthStatus(): Promise<{
    enabled: boolean;
    baseUrl: string | null;
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime?: number;
  }> {
    if (!this.isEnabled || !this.baseUrl) {
      return {
        enabled: false,
        baseUrl: null,
        status: 'unknown',
      };
    }

    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const responseTime = Date.now() - startTime;

      return {
        enabled: true,
        baseUrl: this.baseUrl,
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
      };
    } catch (error) {
      logger.error('CDN health check failed', { error });
      return {
        enabled: true,
        baseUrl: this.baseUrl,
        status: 'unhealthy',
      };
    }
  }
}

// Export singleton instance
export const cdnService = CDNService.getInstance();

// Convenience functions
export const generateImageUrl = cdnService.generateImageUrl.bind(cdnService);
export const generateResponsiveUrls = cdnService.generateResponsiveUrls.bind(cdnService);
export const generateWebPWithFallback = cdnService.generateWebPWithFallback.bind(cdnService);
export const generateMultipleFormats = cdnService.generateMultipleFormats.bind(cdnService);
export const generateSrcSet = cdnService.generateSrcSet.bind(cdnService);
export const generateSizes = cdnService.generateSizes.bind(cdnService);
export const preloadImages = cdnService.preloadImages.bind(cdnService);
export const generatePreloadLinks = cdnService.generatePreloadLinks.bind(cdnService);
export const getCDNHealthStatus = cdnService.getHealthStatus.bind(cdnService);
