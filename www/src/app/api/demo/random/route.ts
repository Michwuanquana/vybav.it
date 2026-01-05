import { NextResponse } from 'next/server';

// Seznam kvalitních fotek prázdných místností pro demo
const DEMO_IMAGES = [
  { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200", keyword: "empty living room" },
  { url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=1200", keyword: "minimalist apartment" },
  { url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200", keyword: "unfurnished loft" },
  { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200", keyword: "bright apartment" },
  { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200", keyword: "modern studio" },
  { url: "https://images.unsplash.com/photo-1536376074432-cd4258d6c2fe?q=80&w=1200", keyword: "empty room renovation" },
  { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200", keyword: "kitchen space" },
  { url: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=1200", keyword: "bedroom light" },
  { url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200", keyword: "cozy apartment" },
  { url: "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200", keyword: "living space" },
  { url: "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?q=80&w=1200", keyword: "open plan" },
  { url: "https://images.unsplash.com/photo-1486304873000-235643847519?q=80&w=1200", keyword: "natural light room" },
  { url: "https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?q=80&w=1200", keyword: "scandinavian interior" },
  { url: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200", keyword: "white walls room" }
];

const MAX_RETRIES = 3;
const MIN_IMAGE_SIZE = 10000; // Minimálně 10KB

async function fetchAndValidateImage(imageUrl: string, keyword: string): Promise<{
  success: boolean;
  base64?: string;
  contentType?: string;
  size?: number;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Vybaveno/1.0 (Interior Design Demo)'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    // Validace content-type
    if (!contentType.startsWith('image/')) {
      return { success: false, error: `Invalid content-type: ${contentType}` };
    }
    
    const imageBuffer = await response.arrayBuffer();
    
    // Validace velikosti
    if (imageBuffer.byteLength < MIN_IMAGE_SIZE) {
      return { success: false, error: `Image too small: ${imageBuffer.byteLength} bytes` };
    }
    
    // Validace JPEG/PNG magic bytes
    const bytes = new Uint8Array(imageBuffer.slice(0, 8));
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    
    if (!isJpeg && !isPng && !isWebp) {
      return { success: false, error: 'Invalid image format (not JPEG/PNG/WebP)' };
    }
    
    const base64 = Buffer.from(imageBuffer).toString('base64');
    
    console.log(`Demo: Validated "${keyword}" - ${(imageBuffer.byteLength / 1024).toFixed(1)}KB`);
    
    return {
      success: true,
      base64,
      contentType: isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/webp',
      size: imageBuffer.byteLength
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function GET() {
  const usedIndices = new Set<number>();
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Vyber náhodný obrázek, který jsme ještě nezkoušeli
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * DEMO_IMAGES.length);
    } while (usedIndices.has(randomIndex) && usedIndices.size < DEMO_IMAGES.length);
    
    usedIndices.add(randomIndex);
    
    const { url: imageUrl, keyword } = DEMO_IMAGES[randomIndex];
    console.log(`Demo: Attempt ${attempt}/${MAX_RETRIES} - Fetching "${keyword}"`);
    
    const result = await fetchAndValidateImage(imageUrl, keyword);
    
    if (result.success && result.base64) {
      return NextResponse.json({ 
        success: true,
        keyword,
        imageUrl,
        dataUrl: `data:${result.contentType};base64,${result.base64}`,
        contentType: result.contentType,
        size: result.size,
        attempt
      });
    }
    
    console.warn(`Demo: Attempt ${attempt} failed - ${result.error}`);
  }
  
  // Všechny pokusy selhaly
  console.error(`Demo: All ${MAX_RETRIES} attempts failed`);
  return NextResponse.json(
    { success: false, error: "Nepodařilo se stáhnout testovací obrázek po více pokusech" },
    { status: 500 }
  );
}
