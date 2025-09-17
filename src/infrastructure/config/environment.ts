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
      process.exit(1);
    }
    throw error;
  }
}

// Export validated environment
export const env = validateEnvironment();

// Type-safe environment access
export type Environment = z.infer<typeof envSchema>;

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flags
export const features = {
  beta: env.ENABLE_BETA_FEATURES,
  debug: env.ENABLE_DEBUG_MODE,
  analytics: env.ENABLE_ANALYTICS,
  errorReporting: env.ENABLE_ERROR_REPORTING,
  performanceMonitoring: env.ENABLE_PERFORMANCE_MONITORING,
} as const;

// Service configurations
export const services = {
  apify: {
    token: env.APIFY_TOKEN,
    baseUrl: env.APIFY_API_BASE_URL,
    timeout: env.APIFY_TIMEOUT_MS,
    retryAttempts: env.APIFY_RETRY_ATTEMPTS,
  },
  gemini: {
    apiKey: env.GEMINI_API_KEY,
    baseUrl: env.GEMINI_API_BASE_URL,
    timeout: env.GEMINI_TIMEOUT_MS,
    retryAttempts: env.GEMINI_RETRY_ATTEMPTS,
  },
  redis: {
    url: env.REDIS_URL || undefined,
    password: env.REDIS_PASSWORD || undefined,
  },
  database: {
    url: env.DATABASE_URL || undefined,
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
      idleTimeout: env.DB_POOL_IDLE_TIMEOUT_MS,
    },
  },
} as const;

// Cache configurations
export const cache = {
  ttl: {
    default: env.CACHE_TTL_SECONDS,
    api: env.API_CACHE_TTL_SECONDS,
    image: env.IMAGE_CACHE_TTL_SECONDS,
  },
} as const;

// Image processing configuration
export const imageConfig = {
  maxImages: env.MAX_IMAGES_PER_REQUEST,
  maxSizeMB: env.MAX_IMAGE_SIZE_MB,
  supportedFormats: env.SUPPORTED_IMAGE_FORMATS.split(','),
  quality: env.IMAGE_QUALITY,
  maxWidth: env.IMAGE_MAX_WIDTH,
  maxHeight: env.IMAGE_MAX_HEIGHT,
} as const;

// Rate limiting configuration
export const rateLimit = {
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
} as const;