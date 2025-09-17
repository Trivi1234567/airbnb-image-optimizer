import { ApifyClient } from 'apify-client';
import { IImageScraper, ScrapedListing } from '@/domain/services/IImageScraper';
import { env } from '../config/environment';
import { APIFY_ACTOR } from '../config/constants';

export class ApifyScraperService implements IImageScraper {
  private client: ApifyClient;

  constructor() {
    if (!env.APIFY_TOKEN) {
      throw new Error('APIFY_TOKEN is not configured. Please check your environment variables.');
    }
    this.client = new ApifyClient({
      token: env.APIFY_TOKEN,
    });
  }

  validateAirbnbUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check if it's a valid Airbnb domain
      const isValidDomain = hostname.includes('airbnb.com') || hostname.includes('airbnb.co.uk');
      
      // Check if the path contains /rooms/
      const hasRoomsPath = urlObj.pathname.includes('/rooms/');
      
      // Check if the room ID looks valid (not just numbers like 123456)
      const roomIdMatch = urlObj.pathname.match(/\/rooms\/(\d+)/);
      const hasValidRoomId = !!(roomIdMatch && roomIdMatch[1] && roomIdMatch[1].length >= 8);
      
      return isValidDomain && hasRoomsPath && hasValidRoomId;
    } catch {
      return false;
    }
  }

  async scrapeAirbnbListing(url: string): Promise<ScrapedListing> {
    if (!this.validateAirbnbUrl(url)) {
      throw new Error('Invalid Airbnb URL provided. Please ensure the URL is a valid Airbnb listing with a proper room ID (e.g., https://www.airbnb.com/rooms/1234567890123456)');
    }

    console.log('Starting Airbnb scraping', { url });

    try {
      const result = await this.performScrapingWithRetry(url);

      console.log('Airbnb scraping completed successfully', { 
        url, 
        imageCount: result.images.length 
      });

      return result;
    } catch (error) {
      console.error('Airbnb scraping failed', { url, error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error(`Failed to scrape Airbnb listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async performScrapingWithRetry(url: string, maxRetries: number = 3): Promise<ScrapedListing> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.performScraping(url);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          console.warn('Scraping attempt failed', { 
            attempt, 
            retriesLeft: maxRetries - attempt,
            error: lastError.message 
          });
          
          // Exponential backoff - use shorter delays in test environment
          const delay = process.env.NODE_ENV === 'test' ? 10 : Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  private async performScraping(url: string): Promise<ScrapedListing> {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 120000); // 2 minutes timeout for real scraping
    });

    const scrapingPromise = this.client.actor(APIFY_ACTOR).call({
      startUrls: [{ url }]
    });

    const run = await Promise.race([scrapingPromise, timeoutPromise]) as any;

    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      throw new Error('No data found for the provided URL - this might not be a valid Airbnb listing');
    }

    const item = items[0] as any;

    console.log('Apify response item structure:', JSON.stringify(item, null, 2));

    // Extract images from the response - this actor returns images in a different format
    let images: string[] = [];
    
    // Try different possible image fields
    const possibleImageFields = ['images', 'imageUrls', 'photos', 'gallery', 'media'];
    
    for (const field of possibleImageFields) {
      if (item[field] && Array.isArray(item[field])) {
        console.log(`Found images in field: ${field}`, item[field]);
        images = item[field].map((img: any) => {
          // Handle different image formats that might be returned
          if (typeof img === 'string') {
            return img;
          } else if (img.imageUrl) {
            return img.imageUrl;
          } else if (img.url) {
            return img.url;
          } else if (img.src) {
            return img.src;
          } else if (img.originalUrl) {
            return img.originalUrl;
          }
          return null;
        }).filter(Boolean);
        
        if (images.length > 0) {
          break;
        }
      }
    }

    console.log('Extracted images:', images);

    if (images.length === 0) {
      console.log('Available fields in item:', Object.keys(item));
      throw new Error('No images found in the listing - this might not be a valid Airbnb listing or the listing might be private');
    }

    return {
      id: item.id || `listing_${Date.now()}`,
      title: item.title || item.name || 'Untitled Listing',
      images: images.slice(0, 10), // Limit to 10 images
      thumbnail: images[0] || '',
      roomType: item.propertyType || 'unknown',
      host: {
        name: item.host?.name || item.hostName || 'Unknown Host',
        isSuperHost: item.host?.isSuperHost || item.host?.isSuperhost || false
      }
    };
  }
}
