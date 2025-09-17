# API Reference

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.vercel.app`

## Authentication
All API endpoints require authentication via API key in the `Authorization` header:
```
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting
- **Limit**: 100 requests per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Error Responses
All errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints

### 1. Optimize Images

**POST** `/api/v1/optimize`

Starts an image optimization job for an Airbnb listing.

#### Request Body
```json
{
  "airbnbUrl": "https://www.airbnb.com/rooms/1234567890123456",
  "maxImages": 10
}
```

#### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `airbnbUrl` | string | Yes | Valid Airbnb listing URL |
| `maxImages` | number | No | Maximum images to process (1-10, default: 10) |

#### Response
```json
{
  "success": true,
  "jobId": "uuid-string",
  "message": "Optimization job started successfully with batch processing",
  "data": {
    "job": {
      "id": "uuid-string",
      "airbnbUrl": "https://www.airbnb.com/rooms/1234567890123456",
      "status": "pending",
      "progress": {
        "total": 0,
        "completed": 0,
        "failed": 0
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "images": [],
    "imagePairs": []
  }
}
```

#### Status Codes
- `201` - Job created successfully
- `400` - Invalid request or validation error
- `401` - Unauthorized
- `429` - Rate limit exceeded
- `500` - Internal server error

#### Example cURL
```bash
curl -X POST "https://your-domain.vercel.app/api/v1/optimize" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "airbnbUrl": "https://www.airbnb.com/rooms/1234567890123456",
    "maxImages": 5
  }'
```

### 2. Get Job Status

**GET** `/api/v1/job/{jobId}`

Retrieves the current status and progress of an optimization job.

#### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobId` | string | Yes | Job UUID |

#### Response
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "completed",
    "progress": {
      "total": 5,
      "completed": 5,
      "failed": 0
    },
    "currentStep": "Job completed",
    "metadata": {
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:05:00.000Z",
      "completedAt": "2024-01-01T00:05:00.000Z",
      "totalImages": 5,
      "completedImages": 5,
      "failedImages": 0
    },
    "job": {
      "id": "uuid-string",
      "airbnbUrl": "https://www.airbnb.com/rooms/1234567890123456",
      "status": "completed",
      "progress": {
        "total": 5,
        "completed": 5,
        "failed": 0
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:05:00.000Z"
    },
    "images": [
      {
        "id": "image-uuid",
        "originalUrl": "https://example.com/image1.jpg",
        "originalBase64": "base64-string",
        "optimizedBase64": "base64-string",
        "fileName": "bedroom_1.jpg",
        "roomType": "bedroom",
        "processingStatus": "completed",
        "error": null
      }
    ],
    "imagePairs": [
      {
        "original": {
          "id": "original-uuid",
          "originalUrl": "https://example.com/image1.jpg",
          "originalBase64": "base64-string",
          "optimizedBase64": null,
          "fileName": "image_1.jpg",
          "roomType": "bedroom",
          "processingStatus": "completed",
          "error": null
        },
        "optimized": {
          "id": "optimized-uuid",
          "originalUrl": "https://example.com/image1.jpg",
          "originalBase64": "base64-string",
          "optimizedBase64": "base64-string",
          "fileName": "bedroom_1.jpg",
          "roomType": "bedroom",
          "processingStatus": "completed",
          "error": null
        },
        "roomType": "bedroom",
        "fileName": "bedroom_1.jpg",
        "optimizationComment": "• Improved lighting and brightness\n• Straightened architectural lines\n• Enhanced image sharpness"
      }
    ]
  }
}
```

#### Status Codes
- `200` - Job found successfully
- `404` - Job not found
- `401` - Unauthorized
- `500` - Internal server error

#### Example cURL
```bash
curl -X GET "https://your-domain.vercel.app/api/v1/job/uuid-string" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. Download Image

**GET** `/api/v1/download/{jobId}/{imageId}`

Downloads an optimized image as a JPEG file. This endpoint is used by both individual download buttons and bulk download functionality.

#### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobId` | string | Yes | Job UUID |
| `imageId` | string | Yes | Optimized image UUID |

#### Response
- **Content-Type**: `image/jpeg`
- **Content-Disposition**: `attachment; filename="optimized-filename.jpg"`
- **Body**: Binary image data

#### Status Codes
- `200` - Image downloaded successfully
- `404` - Job or image not found
- `401` - Unauthorized
- `500` - Internal server error

#### Example cURL
```bash
curl -X GET "https://your-domain.vercel.app/api/v1/download/job-uuid/image-uuid" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  --output optimized-image.jpg
```

### 4. Health Check

**GET** `/api/health`

Comprehensive system health check.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "abc123",
  "environment": "production",
  "checks": {
    "system": {
      "nodeVersion": "v18.17.0",
      "platform": "linux",
      "arch": "x64",
      "memory": {
        "used": 128,
        "total": 512,
        "external": 32
      },
      "cpu": {
        "user": 1000000,
        "system": 500000
      }
    },
    "featureFlags": {
      "analytics": true,
      "errorReporting": true,
      "performanceMonitoring": true,
      "debug": false,
      "beta": false
    },
    "secrets": {
      "valid": true,
      "summary": {
        "apify": "configured",
        "gemini": "configured"
      }
    },
    "externalServices": {
      "apify": {
        "status": "healthy",
        "responseTime": 150,
        "error": null
      },
      "gemini": {
        "status": "healthy",
        "responseTime": 200,
        "error": null
      }
    },
    "container": {
      "status": "healthy",
      "responseTime": 5,
      "services": {
        "jobRepository": "healthy",
        "imageScraper": "healthy",
        "batchRoomDetector": "healthy",
        "batchImageOptimizer": "healthy"
      }
    }
  },
  "responseTime": 25
}
```

#### Status Codes
- `200` - System healthy
- `503` - System degraded or unhealthy

### 5. Metrics

**GET** `/api/metrics`

Prometheus-compatible metrics for monitoring.

#### Response
```
# HELP nodejs_memory_usage_bytes Node.js memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="rss"} 134217728
nodejs_memory_usage_bytes{type="heapTotal"} 67108864
nodejs_memory_usage_bytes{type="heapUsed"} 33554432
nodejs_memory_usage_bytes{type="external"} 16777216
nodejs_memory_usage_bytes{type="arrayBuffers"} 8388608

# HELP nodejs_cpu_usage_microseconds Node.js CPU usage in microseconds
# TYPE nodejs_cpu_usage_microseconds counter
nodejs_cpu_usage_microseconds{type="user"} 1000000
nodejs_cpu_usage_microseconds{type="system"} 500000

# HELP nodejs_process_uptime_seconds Process uptime in seconds
# TYPE nodejs_process_uptime_seconds gauge
nodejs_process_uptime_seconds 3600

# HELP app_requests_total Total number of requests
# TYPE app_requests_total counter
app_requests_total{method="GET",endpoint="/api/health"} 1
app_requests_total{method="GET",endpoint="/api/metrics"} 1

# HELP app_feature_flags Feature flags status
# TYPE app_feature_flags gauge
app_feature_flags{flag="analytics"} 1
app_feature_flags{flag="error_reporting"} 1
app_feature_flags{flag="performance_monitoring"} 1
app_feature_flags{flag="debug"} 0
app_feature_flags{flag="beta"} 0

# HELP app_environment_info Application environment information
# TYPE app_environment_info gauge
app_environment_info{environment="production"} 1

# HELP app_build_info Application build information
# TYPE app_build_info gauge
app_build_info{version="abc123",build_time="2024-01-01T00:00:00Z"} 1

# HELP app_metrics_timestamp_seconds Timestamp of metrics collection
# TYPE app_metrics_timestamp_seconds gauge
app_metrics_timestamp_seconds 1704067200
```

#### Status Codes
- `200` - Metrics retrieved successfully
- `500` - Metrics collection failed

## Data Types

### JobStatus
```typescript
enum JobStatus {
  PENDING = 'pending',
  SCRAPING = 'scraping',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

### RoomType
```typescript
enum RoomType {
  BEDROOM = 'bedroom',
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  LIVING_ROOM = 'living_room',
  EXTERIOR = 'exterior',
  OTHER = 'other'
}
```

### ProcessingStatus
```typescript
type ProcessingStatus = 
  | 'pending'
  | 'analyzing'
  | 'optimizing'
  | 'completed'
  | 'failed';
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_URL` | Invalid Airbnb URL format |
| `SCRAPING_FAILED` | Failed to scrape Airbnb listing |
| `IMAGE_PROCESSING_FAILED` | Image processing error |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `JOB_NOT_FOUND` | Job ID not found |
| `JOB_TIMEOUT` | Job processing timeout |
| `API_KEY_MISSING` | Missing API key |
| `UNAUTHORIZED` | Invalid authentication |
| `VALIDATION_ERROR` | Request validation failed |

## Rate Limits

- **Optimize Images**: 10 requests per minute
- **Get Job Status**: 60 requests per minute
- **Download Image**: 30 requests per minute
- **Health Check**: 120 requests per minute
- **Metrics**: 60 requests per minute

## Webhooks

Currently not implemented. Future versions may include webhook support for job completion notifications.

## SDKs

Currently no official SDKs are available. The API is designed to be language-agnostic and can be consumed by any HTTP client.

## Changelog

### v1.0.0
- Initial API release
- Image optimization endpoints
- Batch processing support
- Health check and metrics endpoints
