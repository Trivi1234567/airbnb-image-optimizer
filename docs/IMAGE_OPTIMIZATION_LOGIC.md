# Image Optimization Logic

## Complete Processing Pipeline

### Step 1: Download Original
```javascript
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
Step 2: Analyze Image
javascriptasync function analyzeImage(imageBuffer: Buffer) {
  const base64 = imageBuffer.toString('base64');
  const analysis = await detectRoom(base64);
  
  return {
    roomType: analysis.roomType,
    needsWork: analysis.lighting.quality === 'poor' || 
               analysis.composition.issues.length > 0,
    optimizationStrategy: buildStrategy(analysis)
  };
}
Step 3: Build Dynamic Prompts
javascriptfunction buildOptimizationPrompt(roomType: string, analysis: any): string {
  const basePrompts = {
    bedroom: {
      base: "Transform to luxury hotel bedroom",
      lighting_poor: "Add soft morning sunlight streaming through windows",
      lighting_good: "Enhance the existing natural light subtly",
      cluttered: "Remove ALL personal items, straighten bedding to hotel perfection",
      poor_angle: "Adjust perspective to show room's best features"
    },
    kitchen: {
      base: "Create premium real estate kitchen photo",
      lighting_poor: "Dramatically brighten, add natural daylight",
      lighting_good: "Make surfaces gleam with enhanced lighting",
      cluttered: "Clear all countertops except decorative items",
      poor_angle: "Straighten lines, show kitchen's full potential"
    },
    bathroom: {
      base: "Transform to luxury spa bathroom",
      lighting_poor: "Add bright, clinical lighting throughout",
      lighting_good: "Enhance to showroom brightness",
      cluttered: "Remove all personal care items, perfect the towels",
      poor_angle: "Adjust to show spaciousness"
    }
  };

  let prompt = basePrompts[roomType]?.base || "Enhance this room professionally";
  
  // Add specific fixes based on issues
  if (analysis.lighting.quality === 'poor') {
    prompt += `. ${basePrompts[roomType]?.lighting_poor}`;
  }
  
  if (analysis.composition.issues.includes('cluttered')) {
    prompt += `. ${basePrompts[roomType]?.cluttered}`;
  }
  
  // Always add these
  prompt += `. Ensure all vertical lines are perfectly straight. 
             Maintain photorealistic quality. 
             Colors should be vibrant but natural.
             This is for a luxury Airbnb listing.`;
  
  return prompt;
}
Step 4: Process Image Pair
javascriptexport async function processImagePair(imageUrl: string, index: number) {
  try {
    // Download original
    const originalBuffer = await downloadImage(imageUrl);
    const originalBase64 = originalBuffer.toString('base64');
    
    // Analyze
    const analysis = await analyzeImage(originalBuffer);
    
    // Optimize
    const prompt = buildOptimizationPrompt(analysis.roomType, analysis);
    const optimizedBase64 = await optimizeImage(originalBase64, analysis.roomType, analysis);
    
    return {
      index,
      roomType: analysis.roomType,
      original: originalBase64,
      optimized: optimizedBase64,
      fileName: `${analysis.roomType}_${index}.jpg`
    };
  } catch (error) {
    console.error(`Failed to process image ${index}:`, error);
    throw error;
  }
}
Quality Checks

Verify optimized image is valid base64
Check dimensions are maintained
Ensure no over-saturation
Validate room type detection accuracy