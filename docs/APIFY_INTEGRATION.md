# Apify Airbnb Scraper Integration

## Actor Details
- Actor ID: `dtrungtin/airbnb-scraper`
- Cost: ~$0.30 per listing
- Max results: 240 per query

## Implementation
```javascript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

export async function scrapeAirbnb(url: string) {
  const run = await client.actor("dtrungtin/airbnb-scraper").call({
    startUrls: [{ url }],
    maxItems: 1,
    includeImages: true
  });
  
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items[0];
}
Response Structure
typescript{
  id: string;
  title: string;
  images: string[]; // Array of image URLs
  thumbnail: string;
  roomType: string;
  host: {
    name: string;
    isSuperHost: boolean;
  };
}
Rate Limiting

60 requests/second per resource
Implement exponential backoff
Retry on 429 errors (max 3 attempts)

Error Handling
javascriptimport pRetry from 'p-retry';

const scrapeWithRetry = async (url: string) => {
  return pRetry(
    () => scrapeAirbnb(url),
    {
      retries: 3,
      onFailedAttempt: error => {
        console.log(`Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
      }
    }
  );
};