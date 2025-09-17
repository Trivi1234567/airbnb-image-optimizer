import { ApifyScraperService } from '@/infrastructure/services/ApifyScraperService';
import { ApifyClient } from 'apify-client';

// Mock ApifyClient
jest.mock('apify-client');

const MockedApifyClient = ApifyClient as jest.MockedClass<typeof ApifyClient>;

describe('ApifyScraperService', () => {
  let service: ApifyScraperService;
  let mockClient: jest.Mocked<ApifyClient>;
  let mockActor: any;
  let mockDataset: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock dataset
    mockDataset = {
      listItems: jest.fn()
    };

    // Setup mock actor
    mockActor = {
      call: jest.fn()
    };

    // Setup mock client
    mockClient = {
      actor: jest.fn().mockReturnValue(mockActor),
      dataset: jest.fn().mockReturnValue(mockDataset)
    } as any;

    MockedApifyClient.mockImplementation(() => mockClient);
    
    service = new ApifyScraperService();
  });

  describe('validateAirbnbUrl', () => {
    it('should return true for valid Airbnb URLs', () => {
      const validUrls = [
        'https://www.airbnb.com/rooms/12345678',
        'https://airbnb.com/rooms/12345678',
        'https://www.airbnb.co.uk/rooms/12345678',
        'https://airbnb.co.uk/rooms/12345678'
      ];

      validUrls.forEach(url => {
        expect(service.validateAirbnbUrl(url)).toBe(true);
      });
    });

    it('should return false for invalid URLs', () => {
      const invalidUrls = [
        'https://www.example.com/rooms/12345678',
        'https://booking.com/rooms/12345678',
        'not-a-url',
        '',
        'https://airbnb.com/not-rooms/12345678'
      ];

      invalidUrls.forEach(url => {
        expect(service.validateAirbnbUrl(url)).toBe(false);
      });
    });

    it('should return false for malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'ftp://airbnb.com',
        'javascript:alert(1)',
        null as any,
        undefined as any
      ];

      malformedUrls.forEach(url => {
        expect(service.validateAirbnbUrl(url)).toBe(false);
      });
    });
  });

  describe('scrapeAirbnbListing', () => {
    const validUrl = 'https://www.airbnb.com/rooms/12345678';
    const mockListingData = {
      id: 'listing-123',
      title: 'Beautiful Apartment',
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ],
      thumbnail: 'https://example.com/thumb.jpg',
      roomType: 'Entire apartment',
      host: {
        name: 'John Doe',
        isSuperHost: true
      }
    };

    beforeEach(() => {
      // Mock successful API response
      mockActor.call.mockResolvedValue({
        defaultDatasetId: 'dataset-123'
      });
      mockDataset.listItems.mockResolvedValue({
        items: [mockListingData]
      });
      
    });

    it('should successfully scrape valid Airbnb listing', async () => {
      const result = await service.scrapeAirbnbListing(validUrl);

      expect(result).toEqual({
        id: 'listing-123',
        title: 'Beautiful Apartment',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg'
        ],
        thumbnail: 'https://example.com/thumb.jpg',
        roomType: 'Entire apartment',
        host: {
          name: 'John Doe',
          isSuperHost: true
        }
      });

      expect(mockActor.call).toHaveBeenCalledWith({
        startUrls: [{ url: validUrl }],
        maxItems: 1,
        includeImages: true
      });
    });

    it('should limit images to maximum of 10', async () => {
      const listingWithManyImages = {
        ...mockListingData,
        images: Array.from({ length: 15 }, (_, i) => `https://example.com/image${i + 1}.jpg`)
      };

      mockDataset.listItems.mockResolvedValue({
        items: [listingWithManyImages]
      });

      const result = await service.scrapeAirbnbListing(validUrl);

      expect(result.images).toHaveLength(10);
      expect(result.images[0]).toBe('https://example.com/image1.jpg');
      expect(result.images[9]).toBe('https://example.com/image10.jpg');
    });

    it('should handle listing with no images', async () => {
      const listingWithoutImages = {
        ...mockListingData,
        images: []
      };

      mockDataset.listItems.mockResolvedValue({
        items: [listingWithoutImages]
      });

      await expect(service.scrapeAirbnbListing(validUrl))
        .rejects
        .toThrow('No images found in the listing');
    });

    it('should handle empty response from Apify', async () => {
      mockDataset.listItems.mockResolvedValue({
        items: []
      });

      await expect(service.scrapeAirbnbListing(validUrl))
        .rejects
        .toThrow('No data found for the provided URL');
    });

    it('should handle null/undefined response', async () => {
      mockDataset.listItems.mockResolvedValue({
        items: null
      });

      await expect(service.scrapeAirbnbListing(validUrl))
        .rejects
        .toThrow('No data found for the provided URL');
    });

    it('should reject invalid Airbnb URLs', async () => {
      const invalidUrl = 'https://www.example.com/rooms/12345678';

      await expect(service.scrapeAirbnbListing(invalidUrl))
        .rejects
        .toThrow('Invalid Airbnb URL provided');
    });

    it('should handle Apify API failures with retry', async () => {
      const error = new Error('Apify API error');
      mockActor.call.mockRejectedValue(error);

      await expect(service.scrapeAirbnbListing(validUrl))
        .rejects
        .toThrow('Failed to scrape Airbnb listing: Apify API error');
    });

    it('should handle timeout after 30 seconds', async () => {
      jest.useFakeTimers();
      
      mockActor.call.mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(resolve, 35000); // 35 seconds
        })
      );

      const scrapePromise = service.scrapeAirbnbListing(validUrl);
      
      // Fast-forward time
      jest.advanceTimersByTime(30000);
      
      // Process any pending promises
      await Promise.resolve();
      
      await expect(scrapePromise).rejects.toThrow();
      
      jest.useRealTimers();
    }, 10000);

    it('should handle missing required fields gracefully', async () => {
      const incompleteListing = {
        id: 'listing-123'
        // Missing other required fields
      };

      mockDataset.listItems.mockResolvedValue({
        items: [incompleteListing]
      });

      const result = await service.scrapeAirbnbListing(validUrl);

      expect(result).toEqual({
        id: 'listing-123',
        title: 'Untitled Listing',
        images: [],
        thumbnail: undefined,
        roomType: 'unknown',
        host: {
          name: 'Unknown Host',
          isSuperHost: false
        }
      });
    }, 10000);

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockActor.call.mockRejectedValue(networkError);

      await expect(service.scrapeAirbnbListing(validUrl))
        .rejects
        .toThrow('Failed to scrape Airbnb listing: Network error');
    }, 10000);

    it('should handle malformed JSON response', async () => {
      mockDataset.listItems.mockRejectedValue(new Error('Invalid JSON'));

      await expect(service.scrapeAirbnbListing(validUrl))
        .rejects
        .toThrow('Failed to scrape Airbnb listing: Invalid JSON');
    }, 10000);
  });

  describe('error handling and logging', () => {
    it('should log successful scraping', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const validUrl = 'https://www.airbnb.com/rooms/12345678';
      
      const mockListingData = {
        id: 'listing-123',
        title: 'Beautiful Apartment',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg'
        ],
        thumbnail: 'https://example.com/thumb.jpg',
        roomType: 'Entire apartment',
        host: {
          name: 'John Doe',
          isSuperHost: true
        }
      };
      
      mockActor.call.mockResolvedValue({ defaultDatasetId: 'dataset-123' });
      mockDataset.listItems.mockResolvedValue({
        items: [mockListingData]
      });

      await service.scrapeAirbnbListing(validUrl);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Starting Airbnb scraping',
        { url: validUrl }
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Airbnb scraping completed successfully',
        { url: validUrl, imageCount: 3 }
      );

      consoleSpy.mockRestore();
    });

    it('should log retry attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const validUrl = 'https://www.airbnb.com/rooms/12345678';
      
      const mockListingData = {
        id: 'listing-123',
        title: 'Beautiful Apartment',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg'
        ],
        thumbnail: 'https://example.com/thumb.jpg',
        roomType: 'Entire apartment',
        host: {
          name: 'John Doe',
          isSuperHost: true
        }
      };
      
      const error = new Error('Temporary error');
      mockActor.call.mockRejectedValueOnce(error).mockResolvedValueOnce({
        defaultDatasetId: 'dataset-123'
      });
      mockDataset.listItems.mockResolvedValue({
        items: [mockListingData]
      });

      await service.scrapeAirbnbListing(validUrl);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Scraping attempt failed',
        { attempt: 1, retriesLeft: 2, error: 'Temporary error' }
      );

      consoleSpy.mockRestore();
    }, 10000);
  });
});
