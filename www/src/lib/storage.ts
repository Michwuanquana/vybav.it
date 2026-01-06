import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

// Determine correct uploads path based on environment
function getUploadsPath(): string {
  // In Docker, the structure is /app/www/public/uploads
  // In development, it's <cwd>/public/uploads
  
  // If we are in the 'www' directory already (common in dev)
  if (process.cwd().endsWith('/www') || !require('fs').existsSync(path.join(process.cwd(), 'www'))) {
    return path.join(process.cwd(), "public", "uploads");
  }
  
  return path.join(process.cwd(), "www", "public", "uploads");
}

// Ensure uploads directory exists
async function ensureUploadsDir(): Promise<string> {
  const uploadsDir = getUploadsPath();
  try {
    await fs.access(uploadsDir);
  } catch {
    console.log("Creating uploads directory:", uploadsDir);
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

export async function uploadImage(
  _key: string, // Původní klíč už nepoužíváme pro název souboru
  buffer: Buffer,
  _contentType: string
): Promise<string> {
  // Ensure directory exists
  const uploadsDir = await ensureUploadsDir();
  
  // 1. Vytvoříme hash obsahu souboru pro deduplikaci (cachování)
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const fileName = `${hash}.jpg`;
  const publicPath = path.join(uploadsDir, fileName);

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
      
    console.log(`Image saved to: ${publicPath}`);
  }
  
  // Vrátíme URL cestu - přes API route kvůli Next.js standalone
  return `/api/uploads/${fileName}`;
}
