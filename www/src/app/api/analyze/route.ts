import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geminiFlash } from "@/lib/gemini-client";
import { ANALYSIS_PROMPT } from "@/lib/prompts/analysis";
import fs from "fs/promises";
import * as fs_sync from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("API: /api/analyze started");
  try {
    const body = await req.json();
    const { sessionId, roomType, lang = 'cs' } = body;
    console.log("API: sessionId =", sessionId, "roomType =", roomType, "lang =", lang);

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID chybí" }, { status: 400 });
    }

    // 1. Získání dat o session
    const session = await db.get('SELECT * FROM sessions WHERE id = ?', [sessionId]) as any;

    if (!session) {
      console.error("API: Session not found in DB, sessionId:", sessionId);
      return NextResponse.json({ error: "Session nebyla nalezena" }, { status: 400 });
    }

    // 1.5 Kontrola, zda už analýza existuje v DB
    if (session.status === 'analyzed' && session.analysis_result) {
      console.log("API: Returning cached analysis from DB");
      try {
        const cachedResult = JSON.parse(session.analysis_result);
        return NextResponse.json(cachedResult);
      } catch (e) {
        console.error("API: Failed to parse cached analysis", e);
        // Pokračujeme k nové analýze, pokud cache selže
      }
    }

    // 2. Získání dat obrázku pro Gemini
    const imageReadStart = Date.now();
    let imageBuffer: Buffer;
    if (session.original_image_url.startsWith('/')) {
      // Mapování URL na fyzickou cestu
      let relativePath = session.original_image_url;
      
      // Podpora pro nové /api/uploads/ i staré /uploads/
      if (relativePath.startsWith('/api/uploads/')) {
        relativePath = relativePath.replace('/api/uploads/', '/uploads/');
      }
      
      // Odstranění prefixu /public/, pokud tam je (pro zpětnou kompatibilitu)
      const cleanUrl = relativePath.replace(/^\/public\//, '');
      
      // Detekce správného rootu pro public složku (Next.js standalone vs dev)
      let publicDir = path.join(process.cwd(), 'public');
      if (process.cwd().endsWith('/www')) {
        publicDir = path.join(process.cwd(), 'public');
      } else if (fs_sync.existsSync(path.join(process.cwd(), 'www', 'public'))) {
        publicDir = path.join(process.cwd(), 'www', 'public');
      }
      
      const filePath = path.join(publicDir, cleanUrl);
      console.log("API: Reading local file", filePath);
      
      try {
        imageBuffer = await fs.readFile(filePath);
      } catch (e: any) {
        console.error(`API: Failed to read image file at ${filePath}:`, e.message);
        return NextResponse.json({ 
          error: "Soubor s obrázkem nebyl nalezen na serveru",
          path: filePath
        }, { status: 404 });
      }
    } else {
      // Externí URL
      console.log("API: Fetching external image", session.original_image_url);
      const imageResponse = await fetch(session.original_image_url);
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    }
    console.log(`API: Image read took ${Date.now() - imageReadStart}ms`);

    // 3. Volání Gemini 3 Flash
    let analysisJson;
    const geminiStart = Date.now();
    
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY chybí, vracím mock data");
      analysisJson = {
        room_type: session.room_type || "living",
        room_type_probabilities: { [session.room_type || "living"]: 1.0 },
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
        furnishing_level: {
          percentage: 10,
          category: "empty",
          detected_items: [],
          missing_essentials: ["pohovka", "stůl", "osvětlení"]
        },
        recommendations: [
          { 
            item: "pohovka", 
            reason: "Mock doporučení pro prázdný prostor", 
            suggested_style: "scandinavian", 
            suggested_color: "šedá",
            priority: 1,
            size_category: "large",
            placement_coordinates: { x: 500, y: 700 }
          },
          { 
            item: "stůl", 
            reason: "Doplnění pracovního koutu", 
            suggested_style: "minimalist", 
            suggested_color: "dub",
            priority: 2,
            size_category: "large",
            placement_coordinates: { x: 200, y: 800 }
          }
        ]
      };
    } else {
      console.log("API: Calling Gemini for analysis with roomType context:", roomType, "lang:", lang);
      const languageName = lang === 'cs' ? 'Czech' : 'English';
      const result = await geminiFlash.generateContent([
        `${ANALYSIS_PROMPT}\n\nUser context:\n- Room type: ${roomType || 'unknown'}\n- REQUESTED LANGUAGE: ${languageName}. You MUST respond entirely in ${languageName}.`,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        },
      ]);

      const responseText = result.response.text();
      console.log("API: Gemini response received, length:", responseText.length);
      
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in Gemini response");
        }
        analysisJson = JSON.parse(jsonMatch[0]);

        // Map room type and probabilities to frontend format
        const ROOM_TYPE_MAP: Record<string, string> = {
          "living_room": "living",
          "bedroom": "bedroom",
          "office": "office",
          "dining_room": "dining",
          "kids_room": "kids",
          "student_room": "student",
          "kitchen": "kitchen",
          "hallway": "hallway",
          "bathroom": "bathroom",
          "terrace": "terrace",
          "other": "other"
        };

        const mappedType = ROOM_TYPE_MAP[analysisJson.room_type] || "other";
        
        // Ensure the result has the mapped room_type
        analysisJson.room_type = mappedType;

        // Ensure room_type_probabilities exists and uses frontend keys
        const rawProbs = analysisJson.room_type_probabilities || {};
        const mappedProbs: Record<string, number> = {};
        
        // If Gemini followed the prompt and used frontend keys directly in probabilities
        // but used long names in room_type, we need to be robust.
        // We'll trust the keys if they exist in our ROOM_TYPES, otherwise map them.
        Object.entries(rawProbs).forEach(([key, value]) => {
          const mappedKey = ROOM_TYPE_MAP[key] || key;
          mappedProbs[mappedKey] = value as number;
        });

        // Fallback if no probabilities were returned
        if (Object.keys(mappedProbs).length === 0) {
          mappedProbs[mappedType] = 1.0;
        }
        
        analysisJson.room_type_probabilities = mappedProbs;

      } catch (parseError: any) {
        console.error("API: Failed to parse Gemini response:", responseText);
        throw new Error(`Chyba při zpracování odpovědi od AI: ${parseError.message}`);
      }

      // Ensure recommendations are sorted by priority if Gemini didn't do it perfectly
      if (analysisJson.recommendations && Array.isArray(analysisJson.recommendations)) {
        analysisJson.recommendations.sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99));
      }
    }
    console.log(`API: Gemini analysis took ${Date.now() - geminiStart}ms`);

    // 4. Uložení výsledku do DB
    const dbStart = Date.now();
    console.log("API: Updating session in DB");
    await db.run(
      'UPDATE sessions SET analysis_result = ?, status = ?, room_type = ? WHERE id = ?',
      [JSON.stringify(analysisJson), 'analyzed', analysisJson.room_type, sessionId]
    );
    console.log(`API: DB update took ${Date.now() - dbStart}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`API: Analysis complete in ${totalTime}ms`);
    return NextResponse.json({
      ...analysisJson,
      _timing: {
        total: totalTime,
        gemini: Date.now() - geminiStart
      }
    });
  } catch (error: any) {
    console.error("API: Analysis error:", error);
    return NextResponse.json({ 
      error: "Chyba při analýze místnosti",
      details: error.message || String(error)
    }, { status: 500 });
  }
}
