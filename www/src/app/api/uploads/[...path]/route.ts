import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Determine correct uploads path based on environment
function getUploadsPath(): string {
  // In Docker, the structure is /app/www/public/uploads
  if (process.cwd().endsWith('/www') || !require('fs').existsSync(path.join(process.cwd(), 'www'))) {
    return path.join(process.cwd(), "public", "uploads");
  }
  return path.join(process.cwd(), "www", "public", "uploads");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params;
    const fileName = pathParts.join("/");
    
    // Security: prevent path traversal
    if (fileName.includes("..") || fileName.includes("\\")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const uploadsDir = getUploadsPath();
    const filePath = path.join(uploadsDir, fileName);

    // Check file exists
    try {
      await fs.access(filePath);
    } catch {
      console.log(`File not found: ${filePath}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read and serve the file
    const buffer = await fs.readFile(filePath);
    
    // Determine content type
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    
    const contentType = contentTypes[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving upload:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
