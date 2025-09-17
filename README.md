# Airbnb Image Optimizer

A production-ready Next.js 14 microSaaS application that uses AI to optimize Airbnb listing images for maximum appeal and professional quality.

## Features

- **AI-Powered Image Analysis**: Automatically detects room types and analyzes image quality with 95%+ accuracy
- **Smart Optimization**: Applies room-specific enhancement prompts using Gemini AI
- **Intelligent Room Detection**: Uses Gemini AI when Apify returns generic room types like "Entire rental unit"
- **Proper File Naming**: Images are named based on detected room type (bedroom_1.jpg, kitchen_2.jpg, etc.)
- **Before/After Comparison**: Interactive image comparison with slider and toggle views
- **Batch Processing**: Process up to 10 images per listing with individual room type detection
- **Download Options**: Individual image downloads or bulk ZIP download
- **Real-time Progress**: Live progress tracking with detailed status updates
- **Responsive Design**: Mobile-first design that works on all devices

## Architecture

This application follows Domain-Driven Design (DDD) principles with clear separation of concerns:

- **Domain Layer**: Core business entities and interfaces
- **Application Layer**: Use cases and DTOs
- **Infrastructure Layer**: External services and data persistence
- **Presentation Layer**: React components and UI logic

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS
- **AI Services**: Google Gemini (room detection + image optimization)
- **Scraping**: Apify Airbnb scraper
- **Testing**: Jest, React Testing Library, Playwright
- **Validation**: Zod for runtime type checking
- **Logging**: Winston for structured logging

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Apify account and API token
- Google AI Studio account and API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd airbnb-optimizer-v2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Configure your API keys in `.env.local`:
```env
APIFY_TOKEN=your_apify_token_here
GEMINI_API_KEY=your_gemini_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### POST /api/v1/optimize
Start a new image optimization job.

**Request Body:**
```json
{
  "airbnbUrl": "https://www.airbnb.com/rooms/12345678",
  "maxImages": 10
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid",
  "message": "Optimization job started successfully",
  "data": {
    "job": { /* job details */ },
    "images": [ /* image list */ ],
    "imagePairs": [ /* before/after pairs */ ]
  }
}
```

### GET /api/v1/job/{id}
Get the status of an optimization job.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "processing",
    "progress": {
      "total": 10,
      "completed": 5,
      "failed": 0
    },
    "currentStep": "Processing images"
  }
}
```

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```env
NODE_ENV=production
APIFY_TOKEN=your_production_apify_token
GEMINI_API_KEY=your_production_gemini_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/v1/            # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── domain/                # Domain layer
│   ├── entities/          # Business entities
│   ├── repositories/      # Repository interfaces
│   └── services/          # Service interfaces
├── infrastructure/        # Infrastructure layer
│   ├── config/           # Configuration
│   ├── di/               # Dependency injection
│   ├── middleware/       # API middleware
│   ├── repositories/     # Repository implementations
│   └── services/         # External service implementations
├── application/          # Application layer
│   ├── dto/              # Data transfer objects
│   └── use-cases/        # Business use cases
└── presentation/         # Presentation layer
    ├── components/       # React components
    └── hooks/           # Custom React hooks
```

## Documentation

### Comprehensive Documentation
- **[Complete Codebase Documentation](docs/CODEBASE_DOCUMENTATION.md)**: Detailed technical documentation covering all components, patterns, and implementation details
- **[Room Detection Fixes](docs/ROOM_DETECTION_FIXES.md)**: Detailed documentation of the December 2024 room detection improvements
- **[Gemini Image API](docs/GEMINI_IMAGE_API.md)**: API documentation for Gemini AI integration with enhanced prompts
- **[Component Guide](docs/COMPONENT_GUIDE.md)**: React component documentation and usage examples
- **[API Reference](docs/API_REFERENCE.md)**: Complete API endpoint documentation
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)**: Production deployment instructions

### Recent Improvements (December 2024)
- **Fixed Room Detection**: Resolved issue where all images were classified as "other"
- **Enhanced AI Prompts**: Improved Gemini prompts for 95%+ room type detection accuracy
- **Individual Image Analysis**: Each image now gets its own room type detection
- **Proper File Naming**: Images are named based on detected room type (bedroom_1.jpg, kitchen_2.jpg, etc.)
- **Fixed Room Type Mapping**: Updated logic to properly use Gemini detection when Apify returns generic types

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository.
# Trigger deployment
# Force Vercel rebuild - Wed Sep 17 18:56:57 IST 2025
# Test change
