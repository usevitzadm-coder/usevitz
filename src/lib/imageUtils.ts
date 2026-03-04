/**
 * Transforms a Supabase Storage URL to use image transformation for resizing.
 * This dramatically reduces image payload by requesting appropriately sized images.
 * 
 * @param url - Original Supabase storage URL
 * @param width - Desired width in pixels
 * @param height - Optional desired height in pixels
 * @returns Transformed URL with resize parameters, or original URL if not a Supabase storage URL
 */
export function getOptimizedImageUrl(url: string, width: number, height?: number): string {
  if (!url) return url;
  
  // Match Supabase storage URLs: .../storage/v1/object/public/BUCKET/PATH
  const storagePattern = /^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/(.+)$/;
  const match = url.match(storagePattern);
  
  if (!match) return url;
  
  const [, origin, path] = match;
  
  // Use Supabase image transformation endpoint
  let transformUrl = `${origin}/storage/v1/render/image/public/${path}?width=${width}`;
  if (height) {
    transformUrl += `&height=${height}`;
  }
  transformUrl += '&resize=cover&quality=75';
  
  return transformUrl;
}
