export interface ScrapedListing {
  id: string;
  title: string;
  images: string[];
  thumbnail: string;
  roomType: string;
  host: {
    name: string;
    isSuperHost: boolean;
  };
}

export interface IImageScraper {
  scrapeAirbnbListing(url: string): Promise<ScrapedListing>;
  validateAirbnbUrl(url: string): boolean;
}
