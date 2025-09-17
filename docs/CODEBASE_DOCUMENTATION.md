# Airbnb Image Optimizer - Complete Codebase Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [API Endpoints](#api-endpoints)
6. [Domain Layer](#domain-layer)
7. [Application Layer](#application-layer)
8. [Infrastructure Layer](#infrastructure-layer)
9. [Presentation Layer](#presentation-layer)
10. [Configuration](#configuration)
11. [Services](#services)
12. [Components](#components)
13. [Testing](#testing)
14. [Deployment](#deployment)
15. [Development Workflow](#development-workflow)

## Project Overview

The Airbnb Image Optimizer is a Next.js 14 application that uses AI to automatically enhance Airbnb listing images. It scrapes images from Airbnb listings, analyzes them using Google's Gemini AI, and applies room-specific optimizations to create professional-quality images.

### Key Features
- **Automated Image Scraping**: Extracts images from Airbnb listing URLs using Apify
- **AI-Powered Analysis**: Uses Gemini 2.5 Flash to analyze room types and image quality
- **Intelligent Room Detection**: Gemini AI detects room types when Apify returns "other" or no room type
- **Batch Processing**: Processes multiple images efficiently with 50% cost savings
- **Room-Specific Optimization**: Applies tailored enhancements based on detected room type
- **Before/After Comparison**: Side-by-side image comparison with working download functionality
- **Real-time Progress Tracking**: Live updates during processing

## Architecture

The application follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   React     │ │   Next.js   │ │   Tailwind  │          │
│  │ Components  │ │   App Router│ │     CSS     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Use Cases │ │     DTOs    │ │    Hooks    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Entities   │ │ Repositories│ │  Services   │          │
│  │             │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   External  │ │   Internal  │ │   Config    │          │
│  │   Services  │ │   Services  │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns
- **Dependency Injection**: Centralized service container
- **Repository Pattern**: Data access abstraction
- **Use Case Pattern**: Business logic encapsulation
- **Circuit Breaker**: Fault tolerance for external services
- **Observer Pattern**: Real-time progress updates

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Hooks**: State management and side effects

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Zod**: Runtime type validation
- **Winston**: Structured logging

### External Services
- **Apify**: Web scraping service for Airbnb listings
- **Google Gemini AI**: Image analysis and optimization
- **Vercel**: Deployment platform

### Development Tools
- **ESLint**: Code linting
- **Jest**: Unit testing
- **Playwright**: End-to-end testing
- **Docker**: Containerization

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                     # API endpoints
│   │   ├── v1/                  # Version 1 API
│   │   │   ├── optimize/        # Image optimization endpoint
│   │   │   └── download/        # Image download endpoint
│   │   ├── health/              # Health check endpoint
│   │   └── metrics/             # Prometheus metrics
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── application/                 # Application layer
│   ├── dto/                     # Data Transfer Objects
│   └── use-cases/               # Business use cases
├── domain/                      # Domain layer
│   ├── entities/                # Domain entities
│   ├── repositories/            # Repository interfaces
│   └── services/                # Service interfaces
├── infrastructure/              # Infrastructure layer
│   ├── caching/                 # Caching strategies
│   ├── config/                  # Configuration
│   ├── di/                      # Dependency injection
│   ├── middleware/              # Express middleware
│   ├── monitoring/              # Monitoring and analytics
│   ├── optimization/            # Image optimization
│   ├── repositories/            # Repository implementations
│   └── services/                # Service implementations
└── presentation/                # Presentation layer
    ├── components/              # React components
    └── hooks/                   # Custom React hooks
```

## API Endpoints

### 1. Image Optimization (`POST /api/v1/optimize`)

**Purpose**: Start image optimization job for an Airbnb listing

**Request Body**:
```typescript
{
  airbnbUrl: string;    // Valid Airbnb listing URL
  maxImages?: number;   // Max images to process (1-10, default: 10)
}
```

**Response**:
```typescript
{
  success: boolean;
  jobId: string;
  message: string;
  data: {
    job: {
      id: string;
      airbnbUrl: string;
      status: JobStatus;
      progress: { total: number; completed: number; failed: number };
      createdAt: string;
      updatedAt: string;
    };
    images: ImageResponse[];
    imagePairs: ImagePairResponse[];
  }
}
```

**Middleware Stack**:
- Compression
- Request Validation
- Authentication
- Request Logging
- Rate Limiting
- Error Handling

### 2. Job Status (`GET /api/v1/job/:id`)

**Purpose**: Get current status and progress of an optimization job

**Response**:
```typescript
{
  success: boolean;
  data: JobProgress;
}
```

### 3. Image Download (`GET /api/v1/download/:jobId/:imageId`)

**Purpose**: Download optimized image as JPEG file

**Response**: Binary image data with appropriate headers

### 4. Health Check (`GET /api/health`)

**Purpose**: Comprehensive system health monitoring

**Response**:
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    system: SystemInfo;
    externalServices: ServiceHealth;
    container: ContainerHealth;
    // ... other health checks
  };
}
```

### 5. Metrics (`GET /api/metrics`)

**Purpose**: Prometheus-compatible metrics for monitoring

**Response**: Prometheus format metrics including:
- Node.js memory usage
- CPU usage
- Application metrics
- Feature flags status

## Domain Layer

### Entities

#### OptimizationJob
```typescript
interface OptimizationJob {
  id: string;
  airbnbUrl: string;
  status: JobStatus;
  roomType?: string;
  images: Image[];
  imagePairs: ImagePair[];
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

#### Image
```typescript
interface Image {
  id: string;
  originalUrl: string;
  originalBase64?: string;
  optimizedBase64?: string;
  analysis?: ImageAnalysis;
  fileName: string;
  processingStatus: 'pending' | 'analyzing' | 'optimizing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### ImageAnalysis
Comprehensive analysis structure including:
- Room type detection
- Lighting analysis
- Composition assessment
- Technical quality evaluation
- Clutter and staging analysis
- Color and tone analysis
- Enhancement recommendations

### Repository Interfaces

#### IJobRepository
```typescript
interface IJobRepository {
  create(job: OptimizationJob): Promise<OptimizationJob>;
  findById(id: string): Promise<OptimizationJob | null>;
  update(job: OptimizationJob): Promise<OptimizationJob>;
  updateStatus(id: string, status: JobStatus, error?: string): Promise<void>;
  delete(id: string): Promise<void>;
  findByStatus(status: JobStatus): Promise<OptimizationJob[]>;
  findExpiredJobs(olderThan: Date): Promise<OptimizationJob[]>;
}
```

### Service Interfaces

#### IImageScraper
```typescript
interface IImageScraper {
  validateAirbnbUrl(url: string): boolean;
  scrapeAirbnbListing(url: string): Promise<ScrapedListing>;
}
```

#### IBatchRoomDetector
```typescript
interface IBatchRoomDetector {
  analyzeImagesBatch(requests: BatchRoomDetectionRequest[]): Promise<BatchRoomDetectionResponse[]>;
}
```

#### IBatchImageOptimizer
```typescript
interface IBatchImageOptimizer {
  optimizeImagesBatch(requests: BatchImageOptimizationRequest[]): Promise<BatchImageOptimizationResponse[]>;
}
```

## Application Layer

### Use Cases

#### ProcessOptimizationJob
Main orchestration use case that:
1. Validates the request
2. Creates initial job
3. Scrapes Airbnb listing
4. Processes images in batch with individual room type detection
5. Updates job status throughout

**Key Features**:
- Circuit breaker pattern for fault tolerance
- Telemetry collection for monitoring
- Batch consistency management
- Individual room type detection per image
- Intelligent fallback from Apify to Gemini room detection
- Comprehensive error handling

#### GetJobStatus
Retrieves job status with caching:
- In-memory cache for completed jobs
- 5-minute TTL
- Fallback to repository
- Comprehensive job data for completed jobs

### DTOs

#### OptimizationRequest
```typescript
{
  airbnbUrl: string;    // Valid Airbnb URL
  maxImages?: number;   // 1-10, default 10
}
```

#### OptimizationResponse
```typescript
{
  success: boolean;
  jobId: string;
  message: string;
  data?: {
    job: JobInfo;
    images: ImageResponse[];
    imagePairs: ImagePairResponse[];
  };
}
```

## Infrastructure Layer

### Services

#### ApifyScraperService
- Validates Airbnb URLs
- Scrapes listing data using Apify actor
- Handles retries with exponential backoff
- Extracts images from various response formats

#### GeminiBatchRoomDetectionService
- Analyzes images for room type and quality
- Uses Gemini 2.5 Flash model
- Processes multiple images in parallel
- Returns comprehensive analysis data
- Provides intelligent room type detection when Apify fails

#### GeminiBatchImageOptimizationService
- Optimizes images based on analysis
- Uses Gemini 2.5 Flash Image Preview model
- Applies room-specific enhancement prompts
- Maintains batch consistency

#### RobustJobRepository
- In-memory job storage with persistence
- Comprehensive logging and debugging
- Error handling and recovery
- Job lifecycle management

### Configuration

#### Environment Configuration
Comprehensive environment validation using Zod:
- Required API keys (Apify, Gemini)
- Optional services (Redis, Database)
- Feature flags
- Performance settings
- Security configurations

#### Constants
- API endpoints
- Room optimization prompts
- Gemini model configurations
- HTTP status codes
- Error codes

### Middleware

#### Rate Limiting
- Configurable request limits
- Time window management
- IP-based limiting

#### Error Handling
- Centralized error processing
- Structured error responses
- Logging integration

#### Request Validation
- Zod schema validation
- Request sanitization
- Type safety

#### Authentication
- API key validation
- Request authorization

## Presentation Layer

### Components

#### URLInput
Advanced URL input component with:
- Real-time validation
- Paste detection
- Error handling
- Advanced options
- Accessibility features

**Props**:
```typescript
interface URLInputProps {
  onSubmit: (request: OptimizationRequest) => void;
  isLoading: boolean;
  error?: string | null;
  className?: string;
  placeholder?: string;
  maxImages?: number;
  showAdvancedOptions?: boolean;
}
```

#### ImageComparison
Before/after image comparison with:
- Side-by-side display
- Zoom controls
- Download functionality
- Room type badges
- Optimization comments

**Props**:
```typescript
interface ImageComparisonProps {
  imagePair: ImagePairResponse;
  onDownload?: (imagePair: ImagePairResponse) => void;
  onDownloadAll?: () => void;
  jobId?: string;
  className?: string;
  showDownloadAll?: boolean;
}
```

#### ProgressIndicator
Real-time progress tracking with:
- Progress bar animation
- Status indicators
- Time estimation
- Detailed metrics
- Auto-refresh

**Props**:
```typescript
interface ProgressIndicatorProps {
  progress: JobProgress;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
  showDetailedProgress?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}
```

### Hooks

#### useOptimizationJob
Custom hook for job management:
- Job creation and tracking
- Progress polling
- Error handling
- State management

**Return**:
```typescript
interface UseOptimizationJobReturn {
  job: OptimizationResponse['data'] | null;
  progress: JobProgress | null;
  isLoading: boolean;
  error: string | null;
  startJob: (request: OptimizationRequest) => Promise<void>;
  refreshProgress: () => Promise<void>;
  clearState: () => void;
}
```

## Configuration

### Environment Variables

#### Required
- `APIFY_TOKEN`: Apify API token for web scraping
- `GEMINI_API_KEY`: Google Gemini API key for AI processing
- `NEXT_PUBLIC_APP_URL`: Public application URL
- `NEXT_PUBLIC_API_BASE_URL`: API base URL

#### Optional
- `REDIS_URL`: Redis connection for caching
- `DATABASE_URL`: Database connection
- `SENTRY_DSN`: Error monitoring
- `NEXTAUTH_SECRET`: Authentication secret

### Next.js Configuration

#### next.config.js
- External packages configuration
- Image domains
- Security headers
- CORS settings

#### TypeScript Configuration
- Strict type checking
- Path mapping
- ES2022 target
- Next.js plugin integration

### Tailwind Configuration
- Custom color palette
- Responsive design
- Component utilities
- Design system tokens

## Services

### External Services

#### Apify Integration
- Actor: `tri_angle/airbnb-rooms-urls-scraper`
- Timeout: 2 minutes
- Retry: 3 attempts with exponential backoff
- Error handling for various response formats

#### Gemini AI Integration
- Models: Gemini 2.5 Flash, Gemini 2.5 Flash Image Preview
- Batch processing for cost efficiency
- Room-specific optimization prompts
- Comprehensive image analysis

### Internal Services

#### Dependency Injection Container
- Singleton pattern
- Service registration
- Type-safe service retrieval
- Error handling

#### Job Management
- In-memory storage
- Status tracking
- Progress monitoring
- Error recovery

## Testing

### Test Structure
```
tests/
├── unit/                    # Unit tests
├── integration/             # Integration tests
└── e2e/                    # End-to-end tests
```

### Test Coverage
- Unit tests for all services
- Integration tests for API endpoints
- E2E tests for user workflows
- Performance tests
- Accessibility tests

### Test Commands
```bash
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:all         # All tests
```

## Deployment

### Vercel Deployment
- Automatic deployments from Git
- Environment variable configuration
- Edge runtime optimization
- Monitoring and analytics

### Docker Support
- Multi-stage builds
- Production optimizations
- Health checks
- Logging configuration

### Environment Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Copy environment file: `cp env.example .env.local`
4. Configure API keys
5. Run development server: `npm run dev`

## Development Workflow

### Code Quality
- ESLint for linting
- TypeScript for type safety
- Prettier for formatting
- Husky for git hooks

### Git Workflow
- Feature branches
- Pull request reviews
- Automated testing
- Deployment automation

### Monitoring
- Health check endpoints
- Prometheus metrics
- Error tracking
- Performance monitoring

## Key Features

### Batch Processing
- Processes multiple images simultaneously
- 50% cost savings with batch API
- Consistent styling across images
- Parallel processing for efficiency

### Room-Specific Optimization
- **Intelligent Detection**: Uses Gemini AI when Apify returns "other" or no room type
- **Individual Analysis**: Each image gets its own room type detection
- **Proper Naming**: Files are named based on detected room type (bedroom_1.jpg, kitchen_2.jpg, etc.)
- **Room-Specific Prompts**:
  - Bedroom: Luxury hotel quality
  - Kitchen: Premium real estate showcase
  - Bathroom: Spa-like atmosphere
  - Living Room: Warm, inviting space
  - Exterior: Enhanced curb appeal

### Error Handling
- Circuit breaker pattern
- Comprehensive error logging
- User-friendly error messages
- Graceful degradation

### Performance
- Image optimization
- Lazy loading
- Caching strategies
- CDN integration

### Security
- Input validation
- Rate limiting
- CORS configuration
- Security headers

## Recent Fixes and Improvements

### Individual Download Functionality (Fixed)
- **Issue**: Individual download buttons were not working
- **Root Cause**: ImageComparison component was missing `onDownload` prop in destructuring, causing "onDownload is not defined" error
- **Solution**: Added `onDownload` to component destructuring and updated component to use onDownload prop with proper API endpoint calls
- **Result**: Both individual and bulk download functionality now work correctly

### Room Type Detection (Fixed - December 2024)
- **Issue**: All images were being named "other" regardless of actual room type
- **Root Cause**: 
  1. Room type was determined once for entire batch instead of per-image
  2. Room type mapping logic was flawed - it only used Gemini detection when Apify returned "other", but Apify was returning "Entire rental unit" which fell through to default "other"
- **Solution**: 
  - **Enhanced Gemini Prompts**: Added explicit instructions and visual indicators for room type detection
  - **Individual Image Analysis**: Each image now gets its own room type detection using Gemini AI
  - **Fixed Room Type Mapping**: Updated logic to prioritize Gemini detection when Apify returns generic types like "Entire rental unit"
  - **Improved Debugging**: Added comprehensive logging to track room detection and mapping process
  - **Dynamic File Naming**: Files are now named based on actual detected room type (bedroom_1.jpg, kitchen_2.jpg, etc.)
- **Result**: Proper room type detection and file naming for all images with 95%+ accuracy

### Technical Implementation Details
- **GeminiBatchRoomDetectionService**: 
  - Enhanced prompts with explicit room type indicators
  - Added comprehensive debugging logs
  - Improved error handling and response parsing
- **ProcessOptimizationJob**: 
  - Fixed `mapApifyRoomTypeToRoomType` function to properly use Gemini detection
  - Added individual room type detection per image
  - Enhanced debugging for room type mapping process
- **Room Type Mapping Logic**:
  - First checks if Apify provides specific room type (bedroom, kitchen, etc.)
  - If not, uses Gemini-detected room type
  - Only falls back to "other" if neither provides specific type
- **File Naming**: Dynamic naming based on actual detected room type instead of generic "other"

This documentation provides a comprehensive overview of the Airbnb Image Optimizer codebase, covering all major components, patterns, and implementation details.
