import { useEffect, useRef, useState } from 'react';

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsIntersecting(entry.isIntersecting);
          if (entry.isIntersecting && !hasIntersected) {
            setHasIntersected(true);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
}

/**
 * Lazy image component with progressive loading
 */
export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  roomType?: string;
}

export function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  priority = false,
  sizes = '100vw',
  quality = 85,
  roomType = 'other',
}: LazyImageProps) {
  const { ref, hasIntersected } = useIntersectionObserver();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  // Generate optimized image URLs
  const generateImageUrl = (width: number, quality: number) => {
    if (process.env.NEXT_PUBLIC_CDN_URL) {
      const params = new URLSearchParams({
        url: src,
        w: width.toString(),
        q: quality.toString(),
        f: 'webp',
        room: roomType,
      });
      return `${process.env.NEXT_PUBLIC_CDN_URL}/optimize?${params.toString()}`;
    }
    return src;
  };

  const imageUrl = hasIntersected || priority 
    ? generateImageUrl(800, quality)
    : placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+';

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {(hasIntersected || priority) && !isError && (
        <picture>
          {/* WebP source for modern browsers */}
          <source
            srcSet={`
              ${generateImageUrl(640, quality)} 640w,
              ${generateImageUrl(1024, quality)} 1024w,
              ${generateImageUrl(1920, quality)} 1920w
            `}
            sizes={sizes}
            type="image/webp"
          />
          
          {/* Fallback for older browsers */}
          <img
            src={imageUrl}
            alt={alt}
            className={`w-full h-auto transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
          />
        </picture>
      )}
    </div>
  );
}

/**
 * Lazy image gallery component
 */
export interface LazyImageGalleryProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    roomType?: string;
  }>;
  onImageClick?: (imageId: string) => void;
  className?: string;
}

export function LazyImageGallery({
  images,
  onImageClick,
  className = '',
}: LazyImageGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (imageId: string) => {
    setLoadedImages(prev => new Set([...prev, imageId]));
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {images.map((image, index) => (
        <div
          key={image.id}
          className="relative group cursor-pointer"
          onClick={() => onImageClick?.(image.id)}
        >
          <LazyImage
            src={image.src}
            alt={image.alt}
            roomType={image.roomType || 'other'}
            priority={index < 3} // First 3 images are priority
            className="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            onLoad={() => handleImageLoad(image.id)}
          />
          
          {/* Room type badge */}
          {image.roomType && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              {image.roomType.replace('_', ' ')}
            </div>
          )}

          {/* Loading indicator */}
          {!loadedImages.has(image.id) && (
            <div className="absolute inset-0 bg-gray-100 rounded-lg animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Progressive image loading hook
 */
export function useProgressiveImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.src = src;
  }, [src]);

  return { imageSrc, isLoaded };
}

/**
 * Image preloader utility
 */
export class ImagePreloader {
  private static preloadedImages = new Set<string>();

  /**
   * Preload an image
   */
  static async preload(src: string): Promise<void> {
    if (this.preloadedImages.has(src)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedImages.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Preload multiple images
   */
  static async preloadMultiple(srcs: string[]): Promise<void> {
    const promises = srcs.map(src => this.preload(src));
    await Promise.allSettled(promises);
  }

  /**
   * Check if image is preloaded
   */
  static isPreloaded(src: string): boolean {
    return this.preloadedImages.has(src);
  }

  /**
   * Clear preloaded images cache
   */
  static clear(): void {
    this.preloadedImages.clear();
  }
}

/**
 * Responsive image hook
 */
export function useResponsiveImage(
  src: string,
  sizes: string[] = ['640w', '1024w', '1920w']
) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    // Generate responsive URLs
    const responsiveUrls = sizes.map(size => {
      const width = parseInt(size.replace('w', ''));
      const params = new URLSearchParams({
        url: src,
        w: width.toString(),
        q: '85',
        f: 'webp',
      });
      return `${process.env.NEXT_PUBLIC_CDN_URL}/optimize?${params.toString()}`;
    });

    // Use the first URL as default
    if (responsiveUrls[0]) {
      setCurrentSrc(responsiveUrls[0]);
    }

    // Preload other sizes
    ImagePreloader.preloadMultiple(responsiveUrls.slice(1));
  }, [src, sizes]);

  return {
    src: currentSrc,
    isLoaded,
    onLoad: () => setIsLoaded(true),
  };
}
