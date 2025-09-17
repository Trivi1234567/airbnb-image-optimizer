# Test Reference Documentation

This document serves as a comprehensive reference for all test specifications and requirements for the Airbnb Image Optimizer application. Use this as a guide when implementing services to ensure they pass all tests.

## Test Coverage Summary

- **Total Test Files**: 8 comprehensive test suites
- **Total Test Cases**: 150+ individual test cases
- **Coverage Target**: 95%+ across all metrics
- **Pattern**: Arrange-Act-Assert with proper mocking

## 1. ApifyScraperService.test.ts

### Test Requirements
- **File**: `tests/unit/infrastructure/services/ApifyScraperService.test.ts`
- **Coverage**: 95%+
- **Test Cases**: 15+

### Key Test Scenarios

#### URL Validation
```typescript
// Should validate Airbnb URLs
'https://www.airbnb.com/rooms/12345678' ✅
'https://airbnb.com/rooms/12345678' ✅
'https://www.airbnb.co.uk/rooms/12345678' ✅
'https://www.example.com/rooms/12345678' ❌
'not-a-url' ❌
```

#### Scraping Functionality
- Handle valid Airbnb URLs
- Reject invalid URLs
- Return max 10 images (enforce limit)
- Handle empty response from Apify
- Handle null/undefined response
- Handle missing required fields gracefully

#### Rate Limiting & Retry
- Implement exponential backoff (max 3 retries)
- Handle API failures with retry
- Timeout after 30 seconds
- Log retry attempts

#### Error Handling
- Network errors
- Malformed JSON response
- API rate limiting
- Authentication errors

### Mock Requirements
```typescript
// Mock ApifyClient
const mockClient = {
  actor: jest.fn().mockReturnValue(mockActor),
  dataset: jest.fn().mockReturnValue(mockDataset)
}

// Mock pRetry
mockedPRetry.mockImplementation((fn: any) => fn())
```

## 2. GeminiOptimizationService.test.ts

### Test Requirements
- **File**: `tests/unit/infrastructure/services/GeminiOptimizationService.test.ts`
- **Coverage**: 95%+
- **Test Cases**: 20+

### Key Test Scenarios

#### Room Type Detection
```typescript
// All 6 room types must be supported
RoomType.BEDROOM ✅
RoomType.KITCHEN ✅
RoomType.BATHROOM ✅
RoomType.LIVING_ROOM ✅
RoomType.EXTERIOR ✅
RoomType.OTHER ✅
```

#### Optimization Prompts
- Apply room-specific optimization prompts
- Build enhanced prompts based on analysis
- Handle different lighting qualities (excellent/good/poor)
- Handle composition issues (cluttered, poor_angle)
- Handle enhancement priorities

#### API Integration
- Handle API failures with retry (max 3)
- Maintain image dimensions
- Handle base64 encoding/decoding
- Extract optimized image from response
- Handle missing optimized image

#### Error Scenarios
- API rate limiting
- Network timeout
- Invalid base64 input
- Malformed response structure
- Empty candidates array

### Mock Requirements
```typescript
// Mock GoogleGenerativeAI
const mockModel = {
  generateContent: jest.fn()
}

// Mock response structure
{
  response: {
    candidates: [{
      content: {
        parts: [{
          inlineData: { data: 'optimized-image-base64' }
        }]
      }
    }]
  }
}
```

## 3. ProcessOptimizationJob.test.ts

### Test Requirements
- **File**: `tests/unit/application/use-cases/ProcessOptimizationJob.test.ts`
- **Coverage**: 95%+
- **Test Cases**: 25+

### Key Test Scenarios

#### Job Lifecycle
- Create job with unique ID
- Update job status (pending → processing → completed)
- Handle job creation failure
- Handle unknown errors during job creation

#### Image Processing
- Process image pairs successfully
- Handle image download failure
- Handle room detection failure
- Handle image optimization failure
- Handle network timeout during download

#### Progress Tracking
- Emit progress events during processing
- Handle partial image processing failures
- Update progress with failed count
- Clean up resources on failure

#### Concurrent Operations
- Handle concurrent job processing
- Handle multiple job creations
- Handle concurrent status requests

### Mock Requirements
```typescript
// Mock all dependencies
const mockJobRepository = { /* ... */ }
const mockImageScraper = { /* ... */ }
const mockRoomDetector = { /* ... */ }
const mockImageOptimizer = { /* ... */ }

// Mock fetch for image downloads
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
})
```

## 4. GeminiRoomDetectionService.test.ts

### Test Requirements
- **File**: `tests/unit/infrastructure/services/GeminiRoomDetectionService.test.ts`
- **Coverage**: 95%+
- **Test Cases**: 18+

### Key Test Scenarios

#### Room Type Detection
- Detect all supported room types correctly
- Handle different lighting quality levels
- Handle different lighting types (natural/artificial/mixed)
- Identify composition issues correctly
- Set enhancement priorities based on analysis

#### Response Validation
- Validate correct analysis structure
- Reject non-object input
- Reject invalid room types
- Reject invalid lighting structure
- Reject invalid composition structure

#### Error Handling
- Handle API failures with proper error messages
- Handle invalid JSON response
- Handle malformed response structure
- Handle network timeout
- Handle empty response text

### Mock Requirements
```typescript
// Mock response structure
{
  roomType: 'bedroom',
  lighting: {
    quality: 'excellent',
    type: 'natural',
    issues: []
  },
  composition: {
    issues: [],
    strengths: ['symmetrical', 'rule_of_thirds']
  },
  enhancementPriority: ['lighting', 'color_correction']
}
```

## 5. InMemoryJobRepository.test.ts

### Test Requirements
- **File**: `tests/unit/infrastructure/repositories/InMemoryJobRepository.test.ts`
- **Coverage**: 100%
- **Test Cases**: 20+

### Key Test Scenarios

#### CRUD Operations
- Create new job successfully
- Store job in memory
- Handle multiple job creations
- Return job when found
- Return null when job not found
- Return copy of job to prevent mutation

#### Update Operations
- Update existing job successfully
- Store updated job in memory
- Return copy of updated job
- Update job status with error message
- Update updatedAt timestamp
- Set completedAt for completed/failed status

#### Query Operations
- Return jobs with matching status
- Return empty array when no jobs match
- Return copies of jobs to prevent mutation
- Find expired jobs older than specified date
- Only return pending or processing jobs

#### Edge Cases
- Handle concurrent operations
- Handle large number of jobs (1000+)
- Handle jobs with complex data structures
- Handle deletion of non-existent job gracefully

## 6. GetJobStatus.test.ts

### Test Requirements
- **File**: `tests/unit/application/use-cases/GetJobStatus.test.ts`
- **Coverage**: 95%+
- **Test Cases**: 15+

### Key Test Scenarios

#### Status Retrieval
- Return job progress for existing job
- Return correct current step for different statuses
- Return error message when job has error
- Handle job not found
- Handle repository errors

#### Current Step Mapping
```typescript
'pending' → 'Job queued'
'scraping' → 'Scraping Airbnb listing'
'processing' → 'Processing images'
'completed' → 'Job completed'
'failed' → 'Job failed'
'cancelled' → 'Job cancelled'
'invalid_status' → 'Unknown status'
```

#### Error Handling
- Handle use case execution failure
- Handle unknown errors
- Handle null/undefined errors gracefully

#### Edge Cases
- Handle jobs with zero progress
- Handle jobs with maximum progress
- Handle jobs with all failed progress
- Handle concurrent status requests
- Handle very long job IDs
- Handle special characters in job ID

## 7. API Route Tests

### Optimize Route (POST /api/v1/optimize)
- **File**: `tests/unit/app/api/v1/optimize/route.test.ts`
- **Coverage**: 95%+

#### Validation Tests
- Process valid optimization request successfully
- Handle request with default maxImages
- Reject invalid Airbnb URL
- Reject malformed URL
- Reject missing airbnbUrl
- Reject invalid maxImages value (>10)
- Reject negative maxImages value
- Reject non-integer maxImages value

#### Method Validation
- Reject non-POST requests

#### Processing Tests
- Handle use case execution failure
- Handle unknown errors
- Handle malformed JSON in request body
- Handle empty request body

#### Rate Limiting
- Handle rate limit exceeded

### Job Status Route (GET /api/v1/job/[id])
- **File**: `tests/unit/app/api/v1/job/[id]/route.test.ts`
- **Coverage**: 95%+

#### Validation Tests
- Return job status for valid job ID
- Return job status with error message
- Handle different job statuses
- Reject invalid job ID format
- Reject empty job ID
- Reject non-UUID job ID

#### Method Validation
- Reject non-GET requests

#### Error Handling
- Handle job not found error
- Handle use case execution failure
- Handle unknown errors

## 8. E2E Tests

### Optimization Flow
- **File**: `tests/e2e/optimization-flow.spec.ts`
- **Coverage**: User journey testing

#### Test Scenarios
- Display landing page correctly
- Validate Airbnb URL input
- Handle form submission
- Handle API errors gracefully
- Be responsive on mobile devices

## Test Configuration

### Jest Setup
```typescript
// jest.config.js
{
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

### Global Mocks
```typescript
// tests/setup.ts
- Mock Next.js router
- Mock fetch API
- Mock window.matchMedia
- Mock ResizeObserver
- Mock IntersectionObserver
- Mock crypto.randomUUID
- Environment variables
```

## Implementation Guidelines

### Error Handling Patterns
```typescript
// Use early returns for error conditions
if (!isValid) {
  throw new Error('Validation failed')
}

// Handle errors at the beginning of functions
if (error) {
  logger.error('Operation failed', { error })
  throw new Error(`Operation failed: ${error.message}`)
}
```

### Mocking Strategy
```typescript
// Mock external dependencies
jest.mock('external-library')

// Use realistic test data
const mockData = {
  // Realistic structure matching actual API responses
}

// Mock async operations
mockFunction.mockResolvedValue(expectedResult)
mockFunction.mockRejectedValue(new Error('Expected error'))
```

### Test Structure
```typescript
describe('ServiceName', () => {
  beforeEach(() => {
    // Arrange - Setup mocks and test data
  })

  it('should handle specific scenario', async () => {
    // Arrange - Setup specific test conditions
    // Act - Execute the function
    // Assert - Verify the results
  })
})
```

## Success Criteria

### Coverage Requirements
- **Overall Coverage**: 95%+
- **Branch Coverage**: 90%+
- **Function Coverage**: 95%+
- **Line Coverage**: 95%+

### Test Quality
- All tests follow Arrange-Act-Assert pattern
- Descriptive test names explain the scenario
- Proper setup and cleanup in beforeEach/afterEach
- Comprehensive error path testing
- Edge case coverage
- Realistic mock data

### Performance
- Tests run in under 30 seconds
- No memory leaks in test execution
- Proper cleanup of resources
- Efficient mocking strategy

This reference document should be used as the definitive guide when implementing services to ensure they pass all tests and meet the specified requirements.
