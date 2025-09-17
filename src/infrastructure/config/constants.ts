import { RoomType } from '@/domain/entities/RoomType';

export const API_ENDPOINTS = {
  OPTIMIZE: '/api/v1/optimize',
  JOB_STATUS: '/api/v1/job/:id',
} as const;

export const ROOM_OPTIMIZATION_PROMPTS: Record<RoomType, string> = {
  [RoomType.BEDROOM]: `Transform this bedroom into a luxury hotel-quality space optimized for Airbnb listings:

TECHNICAL SPECIFICATIONS:
- Resize and crop to 16:9 ratio (minimum 1024x683px)
- Professional real estate photography framing (wide-angle, centered, balanced)
- Correct all vertical and horizontal lines for polished look
- Ensure perfect perspective and symmetry

LIGHTING & EXPOSURE:
- Brighten room evenly with natural morning light simulation
- Eliminate harsh shadows and dark corners
- Adjust contrast and white balance for clean, welcoming look
- Ensure whites look crisp without overexposure
- Create warm, inviting atmosphere with soft lighting

COLOR & TONE:
- Apply subtle professional filter for consistency
- Use slightly warm tones to make space inviting
- Keep whites neutral and crisp
- Enhance saturation slightly (wood, plants, textiles) without being unrealistic
- Maintain natural, believable color palette

VIRTUAL STAGING & ORGANIZATION:
- Remove all people from the image
- Straighten and smooth bed sheets perfectly
- Align and fluff pillows professionally
- Remove all clutter, personal items, and cords
- Organize any visible items neatly
- Create hotel-like tidiness and order

DETAIL ENHANCEMENT:
- Sharpen edges of furniture, décor, and room features
- Make textures (wood, fabric, glass) stand out clearly
- Clean up any image noise or blur
- Enhance fabric textures and material details

COMPOSITION:
- Reframe to highlight key selling points (bed, windows, space)
- Ensure wide-angle real estate photography style
- Center and balance the composition
- Correct any tilted or distorted elements

MAINTAIN AUTHENTICITY: Enhance only - no fake elements, maintain room authenticity`,

  [RoomType.KITCHEN]: `Transform this kitchen into a premium real estate showcase optimized for Airbnb listings:

TECHNICAL SPECIFICATIONS:
- Resize and crop to 16:9 ratio (minimum 1024x683px)
- Professional real estate photography framing (wide-angle, centered, balanced)
- Correct all vertical and horizontal lines for polished look
- Ensure perfect perspective and symmetry

LIGHTING & EXPOSURE:
- Maximize brightness with natural daylight simulation
- Make all surfaces gleam and sparkle
- Eliminate harsh shadows and dark areas
- Adjust contrast for clean, professional look
- Ensure whites look crisp without overexposure

COLOR & TONE:
- Apply subtle professional filter for consistency
- Use slightly warm tones to make space inviting
- Keep whites neutral and crisp
- Enhance saturation slightly (wood, metal, stone) without being unrealistic
- Maintain natural, believable color palette

VIRTUAL STAGING & ORGANIZATION:
- Remove all people from the image
- Clear all counters completely - remove all items
- Remove all cords, personal items, and clutter
- Organize any visible items in cabinets/drawers
- Create spotless, showroom-like cleanliness
- Ensure perfect tidiness and order

DETAIL ENHANCEMENT:
- Sharpen edges of cabinets, appliances, and fixtures
- Make textures (wood, metal, stone, glass) stand out clearly
- Clean up any image noise or blur
- Enhance material details and finishes

COMPOSITION:
- Reframe to highlight key selling points (counters, appliances, space)
- Ensure wide-angle real estate photography style
- Center and balance the composition
- Correct any tilted or distorted elements

MAINTAIN AUTHENTICITY: Enhance only - no fake elements, maintain room authenticity`,

  [RoomType.BATHROOM]: `Transform this bathroom into a spa-like luxury space optimized for Airbnb listings:

TECHNICAL SPECIFICATIONS:
- Resize and crop to 16:9 ratio (minimum 1024x683px)
- Professional real estate photography framing (wide-angle, centered, balanced)
- Correct all vertical and horizontal lines for polished look
- Ensure perfect perspective and symmetry

LIGHTING & EXPOSURE:
- Create bright, clinical lighting throughout
- Eliminate harsh shadows and dark corners
- Adjust contrast for clean, sterile look
- Ensure whites look crisp without overexposure
- Create spa-like atmosphere with soft, even lighting

COLOR & TONE:
- Apply subtle professional filter for consistency
- Use slightly warm tones to make space inviting
- Keep whites neutral and crisp
- Enhance saturation slightly (tile, metal, stone) without being unrealistic
- Maintain natural, believable color palette

VIRTUAL STAGING & ORGANIZATION:
- Remove all people from the image
- Remove all toiletries, personal items, and clutter
- Fold and organize towels perfectly
- Remove all cords and personal items
- Create spotless, hotel-like cleanliness
- Ensure perfect tidiness and order

DETAIL ENHANCEMENT:
- Sharpen edges of fixtures, tiles, and surfaces
- Make textures (tile, metal, stone, glass) stand out clearly
- Clean up any image noise or blur
- Enhance material details and finishes

COMPOSITION:
- Reframe to highlight key selling points (fixtures, space, natural light)
- Ensure wide-angle real estate photography style
- Center and balance the composition
- Correct any tilted or distorted elements

MAINTAIN AUTHENTICITY: Enhance only - no fake elements, maintain room authenticity`,

  [RoomType.LIVING_ROOM]: `Transform this living room into a warm, inviting space optimized for Airbnb listings:

TECHNICAL SPECIFICATIONS:
- Resize and crop to 16:9 ratio (minimum 1024x683px)
- Professional real estate photography framing (wide-angle, centered, balanced)
- Correct all vertical and horizontal lines for polished look
- Ensure perfect perspective and symmetry

LIGHTING & EXPOSURE:
- Enhance natural light throughout the space
- Eliminate harsh shadows and dark corners
- Adjust contrast for clean, welcoming look
- Ensure whites look crisp without overexposure
- Create warm, cozy atmosphere with soft lighting

COLOR & TONE:
- Apply subtle professional filter for consistency
- Use slightly warm tones to make space inviting
- Keep whites neutral and crisp
- Enhance saturation slightly (wood, plants, textiles) without being unrealistic
- Maintain natural, believable color palette

VIRTUAL STAGING & ORGANIZATION:
- Remove all people from the image
- Straighten and align all cushions and pillows
- Align chairs and furniture perfectly
- Remove all clutter, personal items, and cords
- Organize any visible items neatly
- Create cozy, organized atmosphere

DETAIL ENHANCEMENT:
- Sharpen edges of furniture, décor, and room features
- Make textures (wood, fabric, glass) stand out clearly
- Clean up any image noise or blur
- Enhance material details and finishes

COMPOSITION:
- Reframe to highlight key selling points (seating, windows, space)
- Ensure wide-angle real estate photography style
- Center and balance the composition
- Correct any tilted or distorted elements

MAINTAIN AUTHENTICITY: Enhance only - no fake elements, maintain room authenticity`,

  [RoomType.EXTERIOR]: `Transform this exterior into a stunning property showcase optimized for Airbnb listings:

TECHNICAL SPECIFICATIONS:
- Resize and crop to 16:9 ratio (minimum 1024x683px)
- Professional real estate photography framing (wide-angle, centered, balanced)
- Correct all vertical and horizontal lines for polished look
- Ensure perfect perspective and symmetry

LIGHTING & EXPOSURE:
- Create perfect golden hour lighting
- Eliminate harsh shadows and dark areas
- Adjust contrast for clean, vibrant look
- Ensure whites look crisp without overexposure
- Create warm, inviting atmosphere

COLOR & TONE:
- Apply subtle professional filter for consistency
- Use slightly warm tones to make space inviting
- Keep whites neutral and crisp
- Enhance saturation slightly (landscaping, sky, materials) without being unrealistic
- Maintain natural, believable color palette

VIRTUAL STAGING & ORGANIZATION:
- Remove all people from the image
- Remove any vehicles, personal items, and clutter
- Enhance landscaping and curb appeal
- Remove any distracting elements
- Create clean, professional appearance

DETAIL ENHANCEMENT:
- Sharpen edges of building, landscaping, and features
- Make textures (brick, wood, stone, plants) stand out clearly
- Clean up any image noise or blur
- Enhance material details and finishes

COMPOSITION:
- Reframe to highlight key selling points (architecture, landscaping, space)
- Ensure wide-angle real estate photography style
- Center and balance the composition
- Correct any tilted or distorted elements

MAINTAIN AUTHENTICITY: Enhance only - no fake elements, maintain room authenticity`,

  [RoomType.OTHER]: `Transform this room into a professional real estate showcase optimized for Airbnb listings:

TECHNICAL SPECIFICATIONS:
- Resize and crop to 16:9 ratio (minimum 1024x683px)
- Professional real estate photography framing (wide-angle, centered, balanced)
- Correct all vertical and horizontal lines for polished look
- Ensure perfect perspective and symmetry

LIGHTING & EXPOSURE:
- Brighten room evenly with natural light simulation
- Eliminate harsh shadows and dark corners
- Adjust contrast for clean, welcoming look
- Ensure whites look crisp without overexposure
- Create warm, inviting atmosphere

COLOR & TONE:
- Apply subtle professional filter for consistency
- Use slightly warm tones to make space inviting
- Keep whites neutral and crisp
- Enhance saturation slightly (materials, textures) without being unrealistic
- Maintain natural, believable color palette

VIRTUAL STAGING & ORGANIZATION:
- Remove all people from the image
- Remove all clutter, personal items, and cords
- Organize any visible items neatly
- Create clean, professional appearance
- Ensure perfect tidiness and order

DETAIL ENHANCEMENT:
- Sharpen edges of furniture, décor, and room features
- Make textures stand out clearly
- Clean up any image noise or blur
- Enhance material details and finishes

COMPOSITION:
- Reframe to highlight key selling points
- Ensure wide-angle real estate photography style
- Center and balance the composition
- Correct any tilted or distorted elements

MAINTAIN AUTHENTICITY: Enhance only - no fake elements, maintain room authenticity`
};

export const GEMINI_MODELS = {
  IMAGE_ANALYSIS: 'gemini-2.5-flash',
  IMAGE_OPTIMIZATION: 'gemini-2.5-flash-image-preview'
} as const;

export const GEMINI_BATCH_MODELS = {
  IMAGE_ANALYSIS: 'gemini-2.5-flash',
  IMAGE_OPTIMIZATION: 'gemini-2.5-flash-image-preview'
} as const;

export const BATCH_API_CONFIG = {
  MAX_INLINE_REQUESTS: 100,
  MAX_FILE_SIZE_MB: 20,
  MAX_FILE_SIZE_GB: 2,
  POLLING_INTERVAL_MS: 30000, // 30 seconds
  MAX_POLLING_ATTEMPTS: 2880, // 24 hours with 30s intervals
  BATCH_SIZE_THRESHOLD: 2 // Use batch API when processing 2+ images
} as const;

export const APIFY_ACTOR = 'tri_angle/airbnb-rooms-urls-scraper' as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const ERROR_CODES = {
  INVALID_URL: 'INVALID_URL',
  SCRAPING_FAILED: 'SCRAPING_FAILED',
  IMAGE_PROCESSING_FAILED: 'IMAGE_PROCESSING_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  JOB_TIMEOUT: 'JOB_TIMEOUT',
  API_KEY_MISSING: 'API_KEY_MISSING',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;
