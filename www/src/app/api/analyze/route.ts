import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geminiFlash } from "@/lib/gemini-client";
import { ANALYSIS_PROMPT } from "@/lib/prompts/analysis";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID chybí" }, { status: 400 });
    }

    // 1. Získání dat o session
    const session = await db.get('SELECT * FROM sessions WHERE id = ?', [sessionId]) as any;

    if (!session) {
      return NextResponse.json({ error: "Session nebyla nalezena" }, { status: 404 });
    }

    // 2. Získání dat obrázku pro Gemini
    let imageBuffer: Buffer;
    if (session.original_image_url.startsWith('/')) {
      // Lokální soubor
      const fs = require('fs/promises');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', session.original_image_url);
      imageBuffer = await fs.readFile(filePath);
    } else {
      // Externí URL
      const imageResponse = await fetch(session.original_image_url);
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    }

    // 3. Volání Gemini 3 Flash
    let analysisJson;
    
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY chybí, vracím mock data");
      analysisJson = {
        room_type: session.room_type || "living_room",
        detected_style: "scandinavian",
        color_palette: {
          primary: "#F0E8D9",
          secondary: "#7C8F80",
          accent: "#C87F69",
          description: "Světlé přírodní tóny s akcenty šalvějové zelené (MOCK)"
        },
        architecture: {
          walls: "Bílé omítky",
          floor_material: "Dřevo",
          windows: "Standardní"
        },
        estimated_dimensions: { width_m: 4, length_m: 5, height_m: 2.5 },
        recommendations: [
          { item: "pohovka", reason: "Mock doporučení", suggested_style: "scandinavian", suggested_color: "šedá" }
        ]
      };
    } else {
      const result = await geminiFlash.generateContent([
        ANALYSIS_PROMPT,
        {
          inlineData: {
            data: Buffer.from(imageBuffer).toString("base64"),
            mimeType: "image/jpeg",
          },
        },
      ]);

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysisJson = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    }

    // 4. Uložení výsledku do DB
    await db.run(
      'UPDATE sessions SET analysis_result = ?, status = ?, room_type = ? WHERE id = ?',
      [JSON.stringify(analysisJson), 'analyzed', analysisJson.room_type, sessionId]
    );

    return NextResponse.json(analysisJson);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Chyba při analýze místnosti" }, { status: 500 });
  }
}
