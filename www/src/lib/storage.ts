import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

export async function uploadImage(
  _key: string, // Původní klíč už nepoužíváme pro název souboru
  buffer: Buffer,
  _contentType: string
): Promise<string> {
  // 1. Vytvoříme hash obsahu souboru pro deduplikaci (cachování)
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const fileName = `${hash}.jpg`;
  const publicPath = path.join(process.cwd(), "public", "uploads", fileName);

  try {
    // 2. Zkontrolujeme, zda už soubor existuje (pokud ano, máme "cache hit")
    await fs.access(publicPath);
    console.log(`Cache hit for image: ${fileName}`);
  } catch {
    // 3. Pokud neexistuje, optimalizujeme a uložíme
    console.log(`Cache miss, optimizing and saving: ${fileName}`);
    
    await sharp(buffer)
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toFile(publicPath);
  }
  
  // Vrátíme URL cestu
  return `/uploads/${fileName}`;
}
