# MVP Specification - Before/After Comparison

## User Flow
1. Landing page with Airbnb URL input
2. Processing page with progress indicator
3. Results page showing:
   - Before image (original)
   - After image (optimized)
   - Side-by-side or slider comparison
4. Download optimized images
5. Download all as ZIP

## Display Features
- Before/After comparison for each image
- Room type label (bedroom, kitchen, etc.)
- Image counter (1/10, 2/10, etc.)
- Processing status for each image
- No watermarks - full quality display

## Technical Constraints
- Max 10 images per listing
- 5-minute timeout (Vercel limit)
- Images up to 5MB each
- Display at web-optimized resolution
- Download at full resolution

## API Routes
- POST /api/optimize - Main processing
- GET /api/download/[id] - Single image download
- GET /api/download-all/[jobId] - ZIP download

## Data Structure
```typescriptinterface ProcessedImage {
id: string;
roomType: string;
originalUrl: string;
originalBase64: string;
optimizedBase64: string;
fileName: string;
}