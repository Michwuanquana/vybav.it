import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geminiFlash } from "@/lib/gemini-client";
import { buildInpaintingPrompt } from "@/lib/prompts/inpainting";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  console.log("API: /api/generate started");
  try {
    const body = await req.json();
    console.log("API: Request body received", body);
    const { sessionId, productId, userInstruction, coordinates } = body;

    console.log("API: Gemini Key present:", !!process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_API_KEY) {
      console.log("API: Gemini Key starts with:", process.env.GEMINI_API_KEY.substring(0, 4));
    }

    if (!sessionId || !productId) {
      return NextResponse.json({ error: "Session ID nebo Product ID chybí" }, { status: 400 });
    }

    // 1. Získání dat o session a produktu
    console.log("API: Fetching session and product from DB");
    const session = await db.get('SELECT * FROM sessions WHERE id = ?', [sessionId]) as any;
    const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]) as any;

    if (!session || !product) {
      console.error("API: Session or product not found", { sessionId, productId });
      return NextResponse.json({ error: "Session nebo produkt nebyl nalezen" }, { status: 404 });
    }

    const analysis = JSON.parse(session.analysis_result || "{}");

    // 2. Příprava obrázků
    console.log("API: Reading room image", session.original_image_url);
    const roomImagePath = path.join(process.cwd(), 'public', session.original_image_url);
    const roomImageBuffer = await fs.readFile(roomImagePath);

    // 3. Volání Gemini 3 Flash pro Inpainting
    console.log("API: Building prompt");
    const prompt = buildInpaintingPrompt(analysis, product, userInstruction, coordinates);
    
    let finalImageUrl: string;

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY chybí, vracím mock obrázek (původní)");
      // Simulujeme zpoždění pro realističtější pocit z AI
      await new Promise(resolve => setTimeout(resolve, 1500));
      finalImageUrl = session.original_image_url;
    } else {
      console.log("API: Calling Gemini API with model:", geminiFlash.model);
      console.log("API: Image buffer size:", roomImageBuffer.length, "bytes");
      
      // Přidáme timeout pro volání Gemini (50 sekund)
      const geminiPromise = geminiFlash.generateContent([
        {
          text: prompt
        },
        {
          inlineData: {
            data: roomImageBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        },
      ]);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Gemini API timeout")), 50000)
      );

      const result = await Promise.race([geminiPromise, timeoutPromise]) as any;
      console.log("API: Gemini responded");

      if (result.response.promptFeedback?.blockReason) {
        console.warn("API: Gemini blocked the prompt:", result.response.promptFeedback.blockReason);
        throw new Error(`Systém nemohl vygenerovat obrázek: ${result.response.promptFeedback.blockReason}`);
      }

      // Hledáme obrázek v odpovědi
      const response = result.response;
      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (imagePart && imagePart.inlineData) {
        console.log("API: Gemini returned an image");
        const buffer = Buffer.from(imagePart.inlineData.data, "base64");
        const hash = crypto.createHash("sha256").update(buffer).digest("hex");
        const fileName = `generated_${hash}.jpg`;
        const publicPath = path.join(process.cwd(), "public", "uploads", fileName);
        
        await fs.writeFile(publicPath, buffer);
        finalImageUrl = `/uploads/${fileName}`;
      } else {
        console.warn("API: Gemini did not return an image, falling back to original");
        finalImageUrl = session.original_image_url;
      }
    }

    console.log("API: Success, returning", finalImageUrl);
    return NextResponse.json({ 
      imageUrl: finalImageUrl,
      message: "Návrh byl úspěšně vygenerován (v preview verzi může jít o simulaci)"
    });

  } catch (error) {
    console.error("API: Generation error:", error);
    return NextResponse.json({ error: "Chyba při generování návrhu" }, { status: 500 });
  }
}
