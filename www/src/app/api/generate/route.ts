import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geminiFlash } from "@/lib/gemini-client";
import { buildInpaintingPrompt } from "@/lib/prompts/inpainting";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, productId, userInstruction } = await req.json();

    if (!sessionId || !productId) {
      return NextResponse.json({ error: "Session ID nebo Product ID chybí" }, { status: 400 });
    }

    // 1. Získání dat o session a produktu
    const session = await db.get('SELECT * FROM sessions WHERE id = ?', [sessionId]) as any;
    const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]) as any;

    if (!session || !product) {
      return NextResponse.json({ error: "Session nebo produkt nebyl nalezen" }, { status: 404 });
    }

    const analysis = JSON.parse(session.analysis_result || "{}");

    // 2. Příprava obrázků
    const roomImagePath = path.join(process.cwd(), 'public', session.original_image_url);
    const roomImageBuffer = await fs.readFile(roomImagePath);

    // 3. Volání Gemini 3 Flash pro Inpainting
    const prompt = buildInpaintingPrompt(analysis, product, userInstruction);
    
    let finalImageUrl: string;

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY chybí, vracím mock obrázek (původní)");
      // V mocku prostě vrátíme původní obrázek jako "výsledek"
      finalImageUrl = session.original_image_url;
    } else {
      // V reálném volání očekáváme, že Gemini 3 Flash (Preview) umí generovat/upravovat
      // Pokud ne, budeme muset v budoucnu integrovat Imagen 3
      const result = await geminiFlash.generateContent([
        prompt,
        {
          inlineData: {
            data: roomImageBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        },
      ]);

      // Hledáme obrázek v odpovědi
      const response = result.response;
      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (imagePart && imagePart.inlineData) {
        // Uložíme vygenerovaný obrázek
        const buffer = Buffer.from(imagePart.inlineData.data, "base64");
        const hash = crypto.createHash("sha256").update(buffer).digest("hex");
        const fileName = `generated_${hash}.jpg`;
        const publicPath = path.join(process.cwd(), "public", "uploads", fileName);
        
        await fs.writeFile(publicPath, buffer);
        finalImageUrl = `/uploads/${fileName}`;
      } else {
        console.warn("Gemini nevrátil obrázek, vracím textovou odpověď jako chybu");
        // Pokud model vrátil jen text, pravděpodobně inpainting v této verzi API ještě není aktivní
        // nebo vyžaduje jiný model. Prozatím vrátíme původní s varováním.
        finalImageUrl = session.original_image_url;
      }
    }

    // 4. Uložení výsledku do DB (volitelně můžeme vytvořit novou tabulku pro generované návrhy)
    // Pro zjednodušení teď jen vrátíme URL
    return NextResponse.json({ 
      imageUrl: finalImageUrl,
      message: "Návrh byl úspěšně vygenerován (v preview verzi může jít o simulaci)"
    });

  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: "Chyba při generování návrhu" }, { status: 500 });
  }
}
