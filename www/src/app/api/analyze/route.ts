import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geminiFlash } from "@/lib/gemini-client";
import { ANALYSIS_PROMPT } from "@/lib/prompts/analysis";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  console.log("API: /api/analyze started");
  try {
    const body = await req.json();
    const { sessionId } = body;
    console.log("API: sessionId =", sessionId);

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID chybí" }, { status: 400 });
    }

    // 1. Získání dat o session
    const session = await db.get('SELECT * FROM sessions WHERE id = ?', [sessionId]) as any;

    if (!session) {
      console.error("API: Session not found in DB");
      return NextResponse.json({ error: "Session nebyla nalezena" }, { status: 404 });
    }

    // 2. Získání dat obrázku pro Gemini
    let imageBuffer: Buffer;
    if (session.original_image_url.startsWith('/')) {
      // Lokální soubor
      const filePath = path.join(process.cwd(), 'public', session.original_image_url);
      console.log("API: Reading local file", filePath);
      imageBuffer = await fs.readFile(filePath);
    } else {
      // Externí URL
      console.log("API: Fetching external image", session.original_image_url);
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
      console.log("API: Calling Gemini for analysis");
      const result = await geminiFlash.generateContent([
        ANALYSIS_PROMPT,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        },
      ]);

      const responseText = result.response.text();
      console.log("API: Gemini response received");
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysisJson = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    }

    // 4. Uložení výsledku do DB
    console.log("API: Updating session in DB");
    await db.run(
      'UPDATE sessions SET analysis_result = ?, status = ?, room_type = ? WHERE id = ?',
      [JSON.stringify(analysisJson), 'analyzed', analysisJson.room_type, sessionId]
    );

    console.log("API: Analysis complete");
    return NextResponse.json(analysisJson);
  } catch (error) {
    console.error("API: Analysis error:", error);
    return NextResponse.json({ error: "Chyba při analýze místnosti" }, { status: 500 });
  }
}
