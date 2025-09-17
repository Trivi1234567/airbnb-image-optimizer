# Production Deployment Guide

This guide covers deploying the Airbnb Image Optimizer application to production.

## Prerequisites

- Node.js 18+
- npm or yarn
- Vercel account (for hosting)
- API keys for external services

## Environment Setup

### 1. Environment Variables

Copy the production environment template:
```bash
cp env.production.example .env.production
```

Required environment variables:
```bash
# API Keys
APIFY_TOKEN=your_apify_token_here
GEMINI_API_KEY=your_gemini_api_key_here

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api

# Security
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com
```

### 2. API Keys Setup

#### Apify Token
1. Sign up at [Apify](https://apify.com)
2. Go to Settings > Integrations > API tokens
3. Create a new token
4. Add to environment variables

#### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Add to environment variables

## Deployment Options

### Option 1: Vercel (Recommended)

#### Automatic Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Vercel Configuration
- **File**: `vercel.json`
- **Functions**: API routes with timeout configuration
- **Headers**: Security headers and caching
- **Redirects**: URL redirects and rewrites

### Option 2: Docker

#### Build Docker Image
```bash
docker build -t airbnb-optimizer .
```

#### Run Container
```bash
docker run -p 3000:3000 \
  -e APIFY_TOKEN=your_token \
  -e GEMINI_API_KEY=your_key \
  airbnb-optimizer
```

#### Docker Compose
```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down
```

### Option 3: Self-Hosted

#### Prerequisites
- Ubuntu 20.04+ or similar
- Nginx
- PM2 or similar process manager
- SSL certificate

#### Setup Steps
1. **Install Dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx
   ```

2. **Deploy Application**
   ```bash
   git clone your-repo
   cd airbnb-optimizer
   npm ci
   npm run build
   ```

3. **Configure Nginx**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/airbnb-optimizer
   sudo ln -s /etc/nginx/sites-available/airbnb-optimizer /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Start Application**
   ```bash
   pm2 start npm --name "airbnb-optimizer" -- start
   pm2 save
   pm2 startup
   ```

## Security Configuration

### 1. Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: Restrictive policy

### 2. Rate Limiting
- API endpoints: 10 requests per minute
- General pages: 30 requests per minute
- Implemented in middleware

### 3. Input Validation
- URL validation for Airbnb links
- File size limits for images
- Request size limits

### 4. Authentication
- API key authentication
- Rate limiting per user
- Request logging

## Monitoring and Logging

### 1. Application Monitoring
- **Uptime**: UptimeRobot or similar
- **Performance**: Vercel Analytics or custom metrics
- **Errors**: Sentry integration

### 2. Logging
- **Level**: INFO in production
- **Format**: JSON for structured logging
- **Storage**: CloudWatch, LogDNA, or similar

### 3. Metrics
- Request count and response times
- Error rates
- API usage statistics
- Image processing metrics

## Performance Optimization

### 1. Caching
- Static assets: 1 year cache
- API responses: No cache
- CDN: Vercel Edge Network

### 2. Image Optimization
- Next.js Image component
- WebP format support
- Lazy loading
- Responsive images

### 3. Bundle Optimization
- Code splitting
- Tree shaking
- Minification
- Compression

## Backup and Recovery

### 1. Code Backup
- Git repository (primary)
- Regular backups to multiple locations

### 2. Data Backup
- Environment variables backup
- Configuration files backup
- Database backups (if applicable)

### 3. Recovery Procedures
- Document recovery steps
- Test recovery procedures
- Maintain runbooks

## Scaling Considerations

### 1. Horizontal Scaling
- Multiple Vercel instances
- Load balancer configuration
- Database scaling (if applicable)

### 2. Vertical Scaling
- Increase memory/CPU
- Optimize code performance
- Database optimization

### 3. CDN Configuration
- Global content delivery
- Edge caching
- Geographic distribution

## Maintenance

### 1. Regular Updates
- Dependencies updates
- Security patches
- Feature updates

### 2. Monitoring
- Performance monitoring
- Error tracking
- Usage analytics

### 3. Backup Verification
- Test backup restoration
- Verify data integrity
- Update recovery procedures

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify API keys
   - Check build logs

2. **Runtime Errors**
   - Check application logs
   - Verify external service connectivity
   - Check resource limits

3. **Performance Issues**
   - Monitor resource usage
   - Check for memory leaks
   - Optimize database queries

### Support
- Check application logs
- Review monitoring dashboards
- Contact support team
- Check documentation

## Rollback Procedures

### 1. Code Rollback
```bash
# Vercel
vercel rollback [deployment-url]

# Docker
docker run -p 3000:3000 airbnb-optimizer:previous-tag
```

### 2. Configuration Rollback
- Revert environment variables
- Restore configuration files
- Restart services

### 3. Database Rollback
- Restore from backup
- Run migration rollbacks
- Verify data integrity

## Security Checklist

- [ ] Environment variables secured
- [ ] API keys rotated regularly
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error handling secure
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Backup procedures tested
- [ ] Recovery procedures documented

## Performance Checklist

- [ ] Caching configured
- [ ] Images optimized
- [ ] Bundle size minimized
- [ ] CDN configured
- [ ] Database optimized
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Load testing completed

## Post-Deployment

1. **Verify Deployment**
   - Check application is running
   - Test key functionality
   - Verify environment variables

2. **Monitor Performance**
   - Check response times
   - Monitor error rates
   - Verify resource usage

3. **Update Documentation**
   - Update deployment docs
   - Record any issues
   - Update runbooks

4. **Team Notification**
   - Notify team of deployment
   - Share monitoring links
   - Document any changes
