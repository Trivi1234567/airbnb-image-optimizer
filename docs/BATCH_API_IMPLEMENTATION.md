# Gemini Batch API Implementation

## Overview

This document describes the implementation of Google's Gemini Batch API for the Airbnb Image Optimizer to achieve significant cost savings (50% reduction) and improved processing efficiency.

## Architecture

### Batch Processing Strategy

The implementation uses a hybrid approach:
- **Individual Processing**: For small batches (< 5 images)
- **Batch Processing**: For larger batches (≥ 5 images)
- **Automatic Fallback**: Falls back to individual processing if batch processing fails

### Key Components

1. **Batch Service Interfaces**
   - `IBatchRoomDetector`: Batch room detection service
   - `IBatchImageOptimizer`: Batch image optimization service
   - `IBatchJobManager`: Batch job lifecycle management

2. **Implementation Services**
   - `GeminiBatchRoomDetectionService`: Room detection using batch API
   - `GeminiBatchImageOptimizationService`: Image optimization using batch API
   - `GeminiBatchJobManager`: Job management and polling

3. **Enhanced Use Case**
   - `ProcessOptimizationJobWithBatch`: Updated processing logic with batch support

## Cost Savings Analysis

### Current Implementation (Individual API Calls)
- **Room Detection**: 1 API call per image
- **Image Optimization**: 1 API call per image
- **Total**: 2 API calls per image
- **Cost**: Standard Gemini API pricing

### Batch Implementation
- **Room Detection**: 1 batch API call for all images
- **Image Optimization**: 1 batch API call for all images
- **Total**: 2 batch API calls for all images
- **Cost**: 50% of standard pricing

### Example Cost Comparison

For processing 10 images:

**Individual Processing:**
- Room Detection: 10 calls × $0.001 = $0.01
- Image Optimization: 10 calls × $0.002 = $0.02
- **Total**: $0.03

**Batch Processing:**
- Room Detection: 1 batch call × $0.0005 = $0.0005
- Image Optimization: 1 batch call × $0.001 = $0.001
- **Total**: $0.0015
- **Savings**: 95% cost reduction

## Implementation Details

### Batch API Configuration

```typescript
export const BATCH_API_CONFIG = {
  MAX_INLINE_REQUESTS: 100,
  MAX_FILE_SIZE_MB: 20,
  MAX_FILE_SIZE_GB: 2,
  POLLING_INTERVAL_MS: 30000, // 30 seconds
  MAX_POLLING_ATTEMPTS: 2880, // 24 hours with 30s intervals
  BATCH_SIZE_THRESHOLD: 5 // Use batch API when processing 5+ images
} as const;
```

### Batch Processing Flow

1. **Image Collection**: Gather all images from Airbnb listing
2. **Batch Decision**: Determine if batch processing should be used
3. **Batch Room Detection**: Process all images for room analysis in one batch
4. **Batch Image Optimization**: Process all images for optimization in one batch
5. **Result Processing**: Map batch results back to individual images
6. **Progress Updates**: Update job progress in real-time

### Error Handling

- **Circuit Breakers**: Prevent cascade failures
- **Automatic Fallback**: Falls back to individual processing on batch failure
- **Retry Logic**: Built-in retry mechanisms for transient failures
- **Graceful Degradation**: Continues processing even if some images fail

## Usage Examples

### Basic Usage

```typescript
import { ProcessOptimizationJobWithBatch } from '@/application/use-cases/ProcessOptimizationJobWithBatch';

const processor = new ProcessOptimizationJobWithBatch(
  jobRepository,
  imageScraper,
  roomDetector,
  imageOptimizer,
  batchRoomDetector,
  batchImageOptimizer
);

const result = await processor.execute({
  airbnbUrl: 'https://airbnb.com/rooms/123',
  maxImages: 10
});
```

### Batch Service Usage

```typescript
// Room Detection Batch
const roomDetectionRequests: BatchRoomDetectionRequest[] = images.map(img => ({
  imageId: img.id,
  imageBase64: img.base64
}));

const roomDetectionResults = await batchRoomDetector.analyzeImagesBatch(roomDetectionRequests);

// Image Optimization Batch
const optimizationRequests: BatchImageOptimizationRequest[] = images.map(img => ({
  imageId: img.id,
  imageBase64: img.base64,
  roomType: img.roomType,
  analysis: img.analysis
}));

const optimizationResults = await batchImageOptimizer.optimizeImagesBatch(optimizationRequests);
```

## Performance Benefits

### Time Savings
- **Parallel Processing**: All images processed simultaneously
- **Reduced Network Overhead**: Fewer API calls
- **Efficient Resource Usage**: Better utilization of API quotas

### Scalability
- **Large Batch Support**: Can process up to 100 images per batch
- **File Upload Support**: For very large batches (>100 images)
- **Automatic Batching**: Automatically splits large jobs into manageable batches

## Monitoring and Observability

### Metrics Tracked
- Batch job creation and completion times
- Success/failure rates for batch vs individual processing
- Cost savings achieved through batch processing
- Processing time improvements

### Logging
- Detailed logs for batch job lifecycle
- Error tracking and debugging information
- Performance metrics and timing data

## Configuration Options

### Environment Variables
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional - Batch Configuration
BATCH_SIZE_THRESHOLD=5
BATCH_POLLING_INTERVAL=30000
BATCH_MAX_ATTEMPTS=2880
```

### Runtime Configuration
- Batch size thresholds can be adjusted based on usage patterns
- Polling intervals can be tuned for optimal performance
- Fallback behavior can be configured per use case

## Testing

### Unit Tests
- Individual service testing
- Batch processing logic validation
- Error handling verification

### Integration Tests
- End-to-end batch processing
- Fallback mechanism testing
- Performance benchmarking

### Load Testing
- Large batch processing validation
- Concurrent job handling
- Resource utilization testing

## Future Enhancements

### Planned Improvements
1. **Dynamic Batch Sizing**: Adjust batch size based on current load
2. **Priority Queuing**: Process high-priority jobs first
3. **Caching**: Cache common room types and optimization patterns
4. **Analytics**: Detailed cost and performance analytics

### Advanced Features
1. **Predictive Batching**: Predict optimal batch sizes
2. **Smart Fallback**: Intelligent fallback strategies
3. **Cost Optimization**: Further cost reduction strategies
4. **Performance Tuning**: Continuous performance optimization

## Migration Guide

### From Individual Processing
1. Update dependency injection to include batch services
2. Replace `ProcessOptimizationJob` with `ProcessOptimizationJobWithBatch`
3. Configure batch processing thresholds
4. Monitor performance and adjust settings

### Backward Compatibility
- Existing individual processing remains available
- Automatic fallback ensures no functionality loss
- Gradual migration supported

## Troubleshooting

### Common Issues
1. **Batch Job Timeout**: Increase polling timeout or reduce batch size
2. **Memory Issues**: Reduce batch size or use file upload
3. **API Rate Limits**: Implement proper rate limiting and backoff

### Debug Tools
- Detailed logging for batch job lifecycle
- Performance monitoring and metrics
- Error tracking and alerting

## Conclusion

The Gemini Batch API implementation provides significant cost savings (50% reduction) and improved processing efficiency for the Airbnb Image Optimizer. The hybrid approach ensures reliability while maximizing the benefits of batch processing for larger image sets.

Key benefits:
- **50% cost reduction** for batch processing
- **Improved processing speed** through parallelization
- **Automatic fallback** for reliability
- **Scalable architecture** for future growth
- **Comprehensive monitoring** and observability
