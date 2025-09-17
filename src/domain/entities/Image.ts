import { RoomType } from './RoomType';

export interface ImageAnalysis {
  room_type: 'bedroom' | 'kitchen' | 'bathroom' | 'living_room' | 'exterior' | 'other';
  room_context: {
    size: 'small' | 'medium' | 'large';
    layout: 'open' | 'closed' | 'mixed';
    key_features: string[];
    selling_points: string[];
  };
  lighting: {
    quality: 'excellent' | 'good' | 'poor';
    type: 'natural' | 'artificial' | 'mixed';
    brightness: 'too_dark' | 'good' | 'too_bright';
    distribution: 'even' | 'uneven' | 'harsh';
    color_temperature: 'warm' | 'neutral' | 'cool' | 'mixed';
    issues: string[];
    needs_enhancement: string[];
  };
  composition: {
    framing: 'good' | 'needs_adjustment';
    angle: 'optimal' | 'too_low' | 'too_high' | 'off_center';
    symmetry: 'good' | 'needs_correction';
    perspective: 'wide_angle' | 'normal' | 'telephoto' | 'distorted';
    key_selling_points_visible: boolean;
    vertical_lines: 'straight' | 'slightly_tilted' | 'significantly_tilted';
    horizontal_lines: 'straight' | 'slightly_tilted' | 'significantly_tilted';
    issues: string[];
    needs_enhancement: string[];
  };
  technical_quality: {
    sharpness: 'excellent' | 'good' | 'poor';
    noise_level: 'low' | 'medium' | 'high';
    exposure: 'perfect' | 'underexposed' | 'overexposed' | 'mixed';
    color_balance: 'neutral' | 'warm' | 'cool' | 'color_cast';
    focus: 'sharp' | 'slightly_soft' | 'blurry';
    issues: string[];
    needs_enhancement: string[];
  };
  clutter_and_staging: {
    people_present: boolean;
    clutter_level: 'minimal' | 'moderate' | 'high';
    distracting_objects: string[];
    styling_needs: string[];
    needs_removal: string[];
    organization_opportunities: string[];
  };
  color_and_tone: {
    current_tone: 'neutral' | 'warm' | 'cool' | 'mixed';
    saturation_level: 'low' | 'good' | 'high';
    white_balance: 'good' | 'too_warm' | 'too_cool';
    color_accuracy: 'accurate' | 'slightly_off' | 'significantly_off';
    mood: 'inviting' | 'neutral' | 'cold' | 'overwhelming';
    needs_enhancement: string[];
  };
  enhancement_priority: string[];
  specific_improvements: {
    lighting_fixes: string[];
    composition_fixes: string[];
    styling_fixes: string[];
    technical_fixes: string[];
    color_fixes: string[];
  };
  batch_consistency: {
    needs_consistency_filter: boolean;
    style_reference: 'first_image' | 'none';
    consistency_notes: string;
  };
}

export interface Image {
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

export interface ImagePair {
  original: Image;
  optimized: Image;
  roomType: RoomType;
  fileName: string;
  optimizationComment?: string;
}
