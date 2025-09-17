# Deployment Guide

## Overview

This guide covers deploying the Airbnb Image Optimizer application to Vercel, including environment setup, configuration, and monitoring.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Vercel Deployment](#vercel-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Domain Setup](#domain-setup)
5. [Monitoring Setup](#monitoring-setup)
6. [Troubleshooting](#troubleshooting)
7. [Production Checklist](#production-checklist)

## Prerequisites

### Required Accounts
- **Vercel Account**: For hosting and deployment
- **Apify Account**: For web scraping services
- **Google Cloud Account**: For Gemini AI API access

### Required API Keys
- **Apify Token**: Get from [Apify Console](https://console.apify.com/)
- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/)

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/your-username/airbnb-optimizer-v2.git
cd airbnb-optimizer-v2

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Configure environment variables
# Edit .env.local with your API keys

# Run development server
npm run dev
```

## Vercel Deployment

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the repository and click "Import"

### 2. Configure Build Settings

Vercel will auto-detect Next.js settings, but verify:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 3. Environment Variables

Add the following environment variables in Vercel dashboard:

#### Required Variables
```
APIFY_TOKEN=your_apify_token_here
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://your-domain.vercel.app
```

#### Optional Variables
```
NODE_ENV=production
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
MAX_IMAGES_PER_REQUEST=10
LOG_LEVEL=info
ENABLE_ANALYTICS=true
ENABLE_ERROR_REPORTING=true
SENTRY_DSN=your_sentry_dsn_here
```

### 4. Deploy

1. Click "Deploy" in Vercel dashboard
2. Wait for build to complete
3. Access your application at the provided URL

## Environment Configuration

### Production Environment Variables

Create a comprehensive `.env.production` file:

```bash
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://your-domain.vercel.app

# Required API Keys
APIFY_TOKEN=your_apify_token_here
GEMINI_API_KEY=your_gemini_api_key_here

# Security
NEXTAUTH_SECRET=your_secure_secret_here
NEXTAUTH_URL=https://your-domain.vercel.app
JWT_SECRET=your_jwt_secret_here

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Image Processing
MAX_IMAGES_PER_REQUEST=10
MAX_IMAGE_SIZE_MB=5
SUPPORTED_IMAGE_FORMATS=jpg,jpeg,png,webp
IMAGE_QUALITY=85
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1080

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=./logs/app.log

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_GA_ID=your_google_analytics_id
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=0.1

# Caching
CACHE_TTL_SECONDS=3600
API_CACHE_TTL_SECONDS=300
IMAGE_CACHE_TTL_SECONDS=86400

# External Services
APIFY_API_BASE_URL=https://api.apify.com/v2
APIFY_TIMEOUT_MS=30000
APIFY_RETRY_ATTEMPTS=3
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_TIMEOUT_MS=60000
GEMINI_RETRY_ATTEMPTS=3

# Feature Flags
ENABLE_BETA_FEATURES=false
ENABLE_DEBUG_MODE=false
ENABLE_ANALYTICS=true
ENABLE_ERROR_REPORTING=true

# CDN (Optional)
CLOUDFRONT_DISTRIBUTION_ID=your_distribution_id
CDN_BASE_URL=https://your-cdn-domain.com
```

### Environment Validation

The application validates all environment variables on startup:

```typescript
// src/infrastructure/config/environment.ts
const envSchema = z.object({
  // All environment variables with validation rules
});

export const env = validateEnvironment();
```

## Domain Setup

### 1. Custom Domain (Optional)

1. Go to Vercel project settings
2. Navigate to "Domains" section
3. Add your custom domain
4. Configure DNS records as instructed

### 2. SSL Certificate

Vercel automatically provides SSL certificates for all domains.

### 3. DNS Configuration

For custom domains, configure DNS:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

## Monitoring Setup

### 1. Health Check Monitoring

The application provides comprehensive health checks:

```bash
# Basic health check
curl https://your-domain.vercel.app/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "system": { /* system info */ },
    "externalServices": { /* service status */ },
    "container": { /* container health */ }
  }
}
```

### 2. Prometheus Metrics

Access metrics endpoint:

```bash
# Prometheus metrics
curl https://your-domain.vercel.app/api/metrics

# Expected response (Prometheus format)
# HELP nodejs_memory_usage_bytes Node.js memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="rss"} 134217728
# ... more metrics
```

### 3. Sentry Integration (Optional)

1. Create Sentry project
2. Get DSN from Sentry dashboard
3. Add `SENTRY_DSN` environment variable
4. Configure error reporting

### 4. Google Analytics (Optional)

1. Create Google Analytics property
2. Get tracking ID
3. Add `NEXT_PUBLIC_GA_ID` environment variable

### 5. Uptime Monitoring

Recommended services:
- **UptimeRobot**: Free tier available
- **Pingdom**: Professional monitoring
- **StatusCake**: Simple monitoring

Configure monitoring for:
- `https://your-domain.vercel.app/api/health`
- `https://your-domain.vercel.app/`

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Error**: `Module not found` or `TypeScript errors`

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

#### 2. Environment Variable Issues

**Error**: `Environment validation failed`

**Solution**:
1. Check all required variables are set
2. Verify variable names match exactly
3. Ensure no extra spaces or quotes
4. Check Vercel environment variable configuration

#### 3. API Key Issues

**Error**: `API_KEY_MISSING` or `UNAUTHORIZED`

**Solution**:
1. Verify API keys are correct
2. Check API key permissions
3. Ensure keys are active and not expired
4. Test keys locally first

#### 4. Memory Issues

**Error**: `JavaScript heap out of memory`

**Solution**:
1. Increase Vercel memory limit (Pro plan required)
2. Optimize image processing
3. Implement image size limits
4. Add memory monitoring

#### 5. Rate Limiting

**Error**: `RATE_LIMIT_EXCEEDED`

**Solution**:
1. Implement client-side rate limiting
2. Add exponential backoff
3. Show user-friendly error messages
4. Consider upgrading API limits

#### 6. Download Issues

**Error**: Individual download buttons not working with "onDownload is not defined" error

**Solution**:
1. Verify `onDownload` prop is properly destructured in ImageComparison component
2. Check that `onDownload` prop is passed from parent component (page.tsx)
3. Check API endpoint `/api/v1/download/{jobId}/{imageId}` is accessible
4. Ensure proper error handling in download handlers
5. Test with browser developer tools network tab

#### 7. Room Type Detection Issues

**Error**: All images showing as "other" room type

**Solution**:
1. Verify Gemini API key is configured correctly
2. Check that room type detection is working in batch processing
3. Ensure individual room type detection is enabled
4. Test with different Airbnb listing types

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# Add to environment variables
ENABLE_DEBUG_MODE=true
LOG_LEVEL=debug
VERBOSE_LOGGING=true
```

### Log Analysis

View logs in Vercel dashboard:
1. Go to project dashboard
2. Click "Functions" tab
3. Select function to view logs
4. Check for errors and warnings

## Production Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] API keys tested and working
- [ ] Build passes locally (`npm run build`)
- [ ] Tests pass (`npm run test:all`)
- [ ] Security headers configured
- [ ] Rate limiting configured
- [ ] Error monitoring setup
- [ ] Health checks working

### Post-Deployment

- [ ] Application accessible via URL
- [ ] Health check endpoint responding
- [ ] API endpoints working
- [ ] Image optimization working
- [ ] Individual download buttons working
- [ ] Room type detection working (proper file naming)
- [ ] Error monitoring active
- [ ] Performance monitoring active
- [ ] SSL certificate valid
- [ ] Custom domain working (if applicable)

### Monitoring Setup

- [ ] Uptime monitoring configured
- [ ] Error tracking active
- [ ] Performance metrics collected
- [ ] Log aggregation setup
- [ ] Alerting configured

### Security

- [ ] API keys secured
- [ ] CORS configured
- [ ] Rate limiting active
- [ ] Security headers set
- [ ] Input validation working
- [ ] Error messages sanitized

### Performance

- [ ] Image optimization working
- [ ] Caching configured
- [ ] CDN setup (if applicable)
- [ ] Memory usage optimized
- [ ] Response times acceptable

## Scaling Considerations

### Vercel Limits

- **Hobby Plan**: 100GB bandwidth, 1000 serverless function invocations
- **Pro Plan**: 1TB bandwidth, 100,000 serverless function invocations
- **Enterprise**: Custom limits

### Optimization Strategies

1. **Image Optimization**:
   - Implement image compression
   - Use WebP format
   - Lazy loading
   - CDN integration

2. **Caching**:
   - Redis for job caching
   - CDN for static assets
   - Browser caching headers

3. **Database**:
   - Consider PostgreSQL for job persistence
   - Implement job cleanup
   - Add database indexing

4. **Monitoring**:
   - Set up alerts for errors
   - Monitor API usage
   - Track performance metrics

## Backup and Recovery

### Data Backup

- **Job Data**: Currently in-memory (consider database)
- **Configuration**: Environment variables in Vercel
- **Code**: Git repository
- **Logs**: Vercel function logs

### Recovery Procedures

1. **Code Issues**: Revert to previous deployment
2. **Configuration Issues**: Update environment variables
3. **API Issues**: Check API key status
4. **Performance Issues**: Scale up or optimize

## Support

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Apify Documentation](https://docs.apify.com/)
- [Google AI Documentation](https://ai.google.dev/docs)

### Community
- [Vercel Community](https://vercel.com/community)
- [Next.js Discord](https://discord.gg/nextjs)
- [GitHub Issues](https://github.com/your-repo/issues)

This deployment guide provides comprehensive instructions for deploying and maintaining the Airbnb Image Optimizer application in production.
