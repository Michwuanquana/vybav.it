import { pipeline } from '@xenova/transformers';

let detector: any = null;

export async function checkImageSafety(imageBuffer: Buffer): Promise<{ safe: boolean; reason?: string }> {
  try {
    if (!detector) {
      // Použijeme malý a rychlý model pro detekci objektů
      detector = await pipeline('object-detection', 'Xenova/detr-resnet-50');
    }

    // Převedeme buffer na base64 pro transformers.js (nebo přímo URL)
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    const output = await detector(base64Image, {
      threshold: 0.5,
      percentage: true,
    });

    // Seznam věcí, které v interiéru nechceme (lidé, kočárky, zvířata atd.)
    const forbiddenLabels = ['person', 'dog', 'cat', 'stroller', 'bicycle', 'car', 'motorcycle'];
    
    const detectedForbidden = output.filter((item: any) => 
      forbiddenLabels.includes(item.label)
    );

    if (detectedForbidden.length > 0) {
      const labels = Array.from(new Set(detectedForbidden.map((i: any) => i.label)));
      return { 
        safe: false, 
        reason: `Na fotce byly detekovány nežádoucí objekty: ${labels.join(', ')}. Prosím nahrajte pouze prázdnou místnost.` 
      };
    }

    return { safe: true };
  } catch (error) {
    console.error('Local vision check failed:', error);
    // Pokud lokální kontrola selže, raději pustíme dál (nebo ne, podle preference)
    return { safe: true };
  }
}
