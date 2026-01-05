/**
 * Primitivní detekce prázdné místnosti pomocí analýzy hustoty hran (Edge Density).
 * Prázdné místnosti mají velké plochy (stěny, podlahy) s nízkým kontrastem,
 * zatímco zařízené místnosti mají mnoho hran a detailů.
 */
export async function detectEmptyRoom(imageDataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(false);
        return;
      }

      // Zmenšíme obrázek pro rychlejší zpracování
      const width = 200;
      const height = Math.round((img.height / img.width) * width);
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      let edgePixels = 0;
      const threshold = 30; // Práh pro detekci hrany (rozdíl jasu)

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          
          // Jas aktuálního pixelu (jednoduchý průměr)
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          
          // Jas sousedního pixelu (vpravo)
          const rightIdx = (y * width + (x + 1)) * 4;
          const rightBrightness = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
          
          // Jas sousedního pixelu (dole)
          const bottomIdx = ((y + 1) * width + x) * 4;
          const bottomBrightness = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;

          // Pokud je rozdíl jasu větší než práh, považujeme to za hranu
          if (
            Math.abs(brightness - rightBrightness) > threshold ||
            Math.abs(brightness - bottomBrightness) > threshold
          ) {
            edgePixels++;
          }
        }
      }

      const totalPixels = width * height;
      const edgeDensity = edgePixels / totalPixels;

      console.log(`[Heuristics] Edge density: ${(edgeDensity * 100).toFixed(2)}%`);
      
      // Práh pro prázdnou místnost (empiricky stanoveno)
      // Typicky prázdná místnost < 8-10%, zařízená > 15%
      resolve(edgeDensity < 0.12);
    };
    img.onerror = () => resolve(false);
    img.src = imageDataUrl;
  });
}
