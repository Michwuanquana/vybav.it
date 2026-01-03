import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { uploadImage } from "@/lib/storage";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Soubor nebyl nalezen" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Soubor musí být obrázek" }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Obrázek je příliš velký (max 10MB)" }, { status: 400 });
    }

    const sessionId = nanoid();
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop() || "jpg";
    const key = `sessions/${sessionId}/original.${extension}`;

    // 1. Uložení obrázku lokálně (s deduplikací pomocí hashe)
    const imageUrl = await uploadImage(key, buffer, file.type);

    // 2. Kontrola, zda už pro tento obrázek existuje analýza (AI Cache)
    const existingSession = await db.get(
      'SELECT * FROM sessions WHERE original_image_url = ? AND status = ? LIMIT 1',
      [imageUrl, 'analyzed']
    ) as any;

    if (existingSession) {
      console.log(`AI Cache hit for image: ${imageUrl}`);
      // Pokud už analýza existuje, vytvoříme novou session, ale rovnou s výsledky
      await db.run(
        'INSERT INTO sessions (id, original_image_url, status, room_type, analysis_result) VALUES (?, ?, ?, ?, ?)',
        [sessionId, imageUrl, 'analyzed', existingSession.room_type, existingSession.analysis_result]
      );
    } else {
      // 3. Vytvoření nové čisté session
      await db.run(
        'INSERT INTO sessions (id, original_image_url, status) VALUES (?, ?, ?)',
        [sessionId, imageUrl, 'ready']
      );
    }

    return NextResponse.json({
      sessionId,
      imageUrl,
      isAnalyzed: !!existingSession
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
