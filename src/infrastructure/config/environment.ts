import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),

  // Required API Keys
  APIFY_TOKEN: z.string().min(1, 'APIFY_TOKEN is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  // Security (optional in development)
  NEXTAUTH_SECRET: z.string().optional().default('dev-secret-key-for-development-only'),
  NEXTAUTH_URL: z.string().url().optional().default('http://localhost:3000'),
  JWT_SECRET: z.string().optional().default('dev-jwt-secret-key-for-development-only'),

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),

  // Image Processing
  MAX_IMAGES_PER_REQUEST: z.string().transform(Number).default('10'),
  MAX_IMAGE_SIZE_MB: z.string().transform(Number).default('5'),
  SUPPORTED_IMAGE_FORMATS: z.string().default('jpg,jpeg,png,webp'),
  IMAGE_QUALITY: z.string().transform(Number).default('85'),
  IMAGE_MAX_WIDTH: z.string().transform(Number).default('1920'),
  IMAGE_MAX_HEIGHT: z.string().transform(Number).default('1080'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),

  // Monitoring
  SENTRY_DSN: z.string().optional().refine((val) => !val || val.trim() === '' || z.string().url().safeParse(val).success, {
    message: "SENTRY_DSN must be a valid URL or empty"
  }).default(''),
  SENTRY_ENVIRONMENT: z.string().default('development'),
  NEXT_PUBLIC_GA_ID: z.string().optional().default(''),
  NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().optional().default(''),
  ENABLE_PERFORMANCE_MONITORING: z.string().transform(val => val === 'true').default('true'),
  PERFORMANCE_SAMPLE_RATE: z.string().transform(Number).default('0.1'),

  // Caching
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  CACHE_TTL_SECONDS: z.string().transform(Number).default('3600'),
  API_CACHE_TTL_SECONDS: z.string().transform(Number).default('300'),
  IMAGE_CACHE_TTL_SECONDS: z.string().transform(Number).default('86400'),

  // Database (Future)
  DATABASE_URL: z.string().optional(),
  DB_POOL_MIN: z.string().transform(Number).default('2'),
  DB_POOL_MAX: z.string().transform(Number).default('10'),
  DB_POOL_IDLE_TIMEOUT_MS: z.string().transform(Number).default('30000'),

  // External Services
  APIFY_API_BASE_URL: z.string().url().default('https://api.apify.com/v2'),
  APIFY_TIMEOUT_MS: z.string().transform(Number).default('30000'),
  APIFY_RETRY_ATTEMPTS: z.string().transform(Number).default('3'),
  GEMINI_API_BASE_URL: z.string().url().default('https://generativelanguage.googleapis.com/v1beta'),
  GEMINI_TIMEOUT_MS: z.string().transform(Number).default('60000'),
  GEMINI_RETRY_ATTEMPTS: z.string().transform(Number).default('3'),

  // Feature Flags
  ENABLE_BETA_FEATURES: z.string().transform(val => val === 'true').default('false'),
  ENABLE_DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('true'),

  // CDN
  CLOUDFRONT_DISTRIBUTION_ID: z.string().optional(),
  CDN_BASE_URL: z.string().optional(),

  // Email (Future)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Notifications
  SLACK_WEBHOOK_URL: z.string().optional().refine((val) => !val || val.trim() === '' || z.string().url().safeParse(val).success, {
    message: "SLACK_WEBHOOK_URL must be a valid URL or empty"
  }).default(''),
  DISCORD_WEBHOOK_URL: z.string().optional().refine((val) => !val || val.trim() === '' || z.string().url().safeParse(val).success, {
    message: "DISCORD_WEBHOOK_URL must be a valid URL or empty"
  }).default(''),

  // Development
  FAST_REFRESH: z.string().transform(val => val === 'true').default('true'),
  GENERATE_SOURCEMAP: z.string().transform(val => val === 'true').default('false'),
  DEBUG: z.string().optional(),
  VERBOSE_LOGGING: z.string().transform(val => val === 'true').default('false'),
});

// Validate environment variables
function validateEnvironment() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease check your environment variables and try again.');
      console.error('See env.example for required variables.');
      
      // Never exit during build process - always return fallback
      console.warn('⚠️ Using fallback environment configuration for build process');
      
      // Return a fallback configuration for build time
      return {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.PORT || '3000',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
        APIFY_TOKEN: process.env.APIFY_TOKEN || 'fallback-token',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'fallback-key',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-key-for-development-only',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-key-for-development-only',
        RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
        RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '60000',
        MAX_IMAGES_PER_REQUEST: process.env.MAX_IMAGES_PER_REQUEST || '10',
        MAX_IMAGE_SIZE_MB: process.env.MAX_IMAGE_SIZE_MB || '5',
        SUPPORTED_IMAGE_FORMATS: process.env.SUPPORTED_IMAGE_FORMATS || 'jpg,jpeg,png,webp',
        IMAGE_QUALITY: process.env.IMAGE_QUALITY || '85',
        IMAGE_MAX_WIDTH: process.env.IMAGE_MAX_WIDTH || '1920',
        IMAGE_MAX_HEIGHT: process.env.IMAGE_MAX_HEIGHT || '1080',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        LOG_FORMAT: process.env.LOG_FORMAT || 'json',
        LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log',
        SENTRY_DSN: process.env.SENTRY_DSN || '',
        SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT || 'development',
        NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID || '',
        NEXT_PUBLIC_MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
        ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING || 'true',
        PERFORMANCE_SAMPLE_RATE: process.env.PERFORMANCE_SAMPLE_RATE || '0.1',
        REDIS_URL: process.env.REDIS_URL || '',
        REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
        CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS || '3600',
        API_CACHE_TTL_SECONDS: process.env.API_CACHE_TTL_SECONDS || '300',
        IMAGE_CACHE_TTL_SECONDS: process.env.IMAGE_CACHE_TTL_SECONDS || '86400',
        DATABASE_URL: process.env.DATABASE_URL || '',
        DB_POOL_MIN: process.env.DB_POOL_MIN || '2',
        DB_POOL_MAX: process.env.DB_POOL_MAX || '10',
        DB_POOL_IDLE_TIMEOUT_MS: process.env.DB_POOL_IDLE_TIMEOUT_MS || '30000',
        APIFY_API_BASE_URL: process.env.APIFY_API_BASE_URL || 'https://api.apify.com/v2',
        APIFY_TIMEOUT_MS: process.env.APIFY_TIMEOUT_MS || '30000',
        APIFY_RETRY_ATTEMPTS: process.env.APIFY_RETRY_ATTEMPTS || '3',
        GEMINI_API_BASE_URL: process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
        GEMINI_TIMEOUT_MS: process.env.GEMINI_TIMEOUT_MS || '60000',
        GEMINI_RETRY_ATTEMPTS: process.env.GEMINI_RETRY_ATTEMPTS || '3',
        ENABLE_BETA_FEATURES: process.env.ENABLE_BETA_FEATURES || 'false',
        ENABLE_DEBUG_MODE: process.env.ENABLE_DEBUG_MODE || 'false',
        ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS || 'true',
        ENABLE_ERROR_REPORTING: process.env.ENABLE_ERROR_REPORTING || 'true',
        CLOUDFRONT_DISTRIBUTION_ID: process.env.CLOUDFRONT_DISTRIBUTION_ID || '',
        CDN_BASE_URL: process.env.CDN_BASE_URL || '',
        SMTP_HOST: process.env.SMTP_HOST || '',
        SMTP_PORT: process.env.SMTP_PORT || '',
        SMTP_USER: process.env.SMTP_USER || '',
        SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
        SMTP_FROM: process.env.SMTP_FROM || '',
        SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
        DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
        FAST_REFRESH: process.env.FAST_REFRESH || 'true',
        GENERATE_SOURCEMAP: process.env.GENERATE_SOURCEMAP || 'false',
        DEBUG: process.env.DEBUG || '',
        VERBOSE_LOGGING: process.env.VERBOSE_LOGGING || 'false',
      } as any;
    }
    throw error;
  }
}

// Export validated environment (lazy loading to prevent build-time failures)
let _env: any = null;

function getEnv() {
  if (!_env) {
    _env = validateEnvironment();
  }
  return _env;
}

export const env = new Proxy({} as any, {
  get(_target, prop) {
    return getEnv()[prop];
  }
});

// Type-safe environment access
export type Environment = z.infer<typeof envSchema>;

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flags (lazy loading)
export const features = new Proxy({} as any, {
  get(_target, prop) {
    const env = getEnv();
    switch (prop) {
      case 'beta': return env.ENABLE_BETA_FEATURES;
      case 'debug': return env.ENABLE_DEBUG_MODE;
      case 'analytics': return env.ENABLE_ANALYTICS;
      case 'errorReporting': return env.ENABLE_ERROR_REPORTING;
      case 'performanceMonitoring': return env.ENABLE_PERFORMANCE_MONITORING;
      default: return undefined;
    }
  }
});

// Service configurations (lazy loading)
export const services = new Proxy({} as any, {
  get(_target, prop) {
    const env = getEnv();
    switch (prop) {
      case 'apify': return {
        token: env.APIFY_TOKEN,
        baseUrl: env.APIFY_API_BASE_URL,
        timeout: env.APIFY_TIMEOUT_MS,
        retryAttempts: env.APIFY_RETRY_ATTEMPTS,
      };
      case 'gemini': return {
        apiKey: env.GEMINI_API_KEY,
        baseUrl: env.GEMINI_API_BASE_URL,
        timeout: env.GEMINI_TIMEOUT_MS,
        retryAttempts: env.GEMINI_RETRY_ATTEMPTS,
      };
      case 'redis': return {
        url: env.REDIS_URL || undefined,
        password: env.REDIS_PASSWORD || undefined,
      };
      case 'database': return {
        url: env.DATABASE_URL || undefined,
        pool: {
          min: env.DB_POOL_MIN,
          max: env.DB_POOL_MAX,
          idleTimeout: env.DB_POOL_IDLE_TIMEOUT_MS,
        },
      };
      default: return undefined;
    }
  }
});

// Cache configurations (lazy loading)
export const cache = new Proxy({} as any, {
  get(_target, prop) {
    const env = getEnv();
    if (prop === 'ttl') {
      return {
        default: env.CACHE_TTL_SECONDS,
        api: env.API_CACHE_TTL_SECONDS,
        image: env.IMAGE_CACHE_TTL_SECONDS,
      };
    }
    return undefined;
  }
});

// Image processing configuration (lazy loading)
export const imageConfig = new Proxy({} as any, {
  get(_target, prop) {
    const env = getEnv();
    switch (prop) {
      case 'maxImages': return env.MAX_IMAGES_PER_REQUEST;
      case 'maxSizeMB': return env.MAX_IMAGE_SIZE_MB;
      case 'supportedFormats': return env.SUPPORTED_IMAGE_FORMATS.split(',');
      case 'quality': return env.IMAGE_QUALITY;
      case 'maxWidth': return env.IMAGE_MAX_WIDTH;
      case 'maxHeight': return env.IMAGE_MAX_HEIGHT;
      default: return undefined;
    }
  }
});

// Rate limiting configuration (lazy loading)
export const rateLimit = new Proxy({} as any, {
  get(_target, prop) {
    const env = getEnv();
    switch (prop) {
      case 'maxRequests': return env.RATE_LIMIT_MAX_REQUESTS;
      case 'windowMs': return env.RATE_LIMIT_WINDOW_MS;
      default: return undefined;
    }
  }
});