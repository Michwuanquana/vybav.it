import { LocalDB } from './lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const ANALYSIS_PROMPT = `Analyze this room for interior design. Return ONLY a JSON object with: 
- room_type
- detected_style
- recommendations (array of objects with: item, reason, suggested_style, suggested_color)`;

async function testPipeline() {
  console.log('🚀 Starting AI Pipeline Test...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing!');
    return;
  }

  const db = new LocalDB();
  await db.init();

  // 1. Pick a sample image from uploads
  const uploadsDir = path.join(process.cwd(), 'www/public/uploads');
  const files = await fs.readdir(uploadsDir);
  const imageFile = files.find(f => f.endsWith('.jpg'));

  if (!imageFile) {
    console.error('❌ No sample image found in uploads!');
    return;
  }

  console.log(`📸 Using image: ${imageFile}`);
  const imageBuffer = await fs.readFile(path.join(uploadsDir, imageFile));

  // 2. Call Gemini
  console.log('🤖 Calling Gemini 3 Flash...');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Použijeme model specifikovaný v projektu
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }); 

  try {
    let responseText: string;
    try {
      const result = await model.generateContent([
        ANALYSIS_PROMPT,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: 'image/jpeg',
          },
        },
      ]);
      responseText = result.response.text();
      console.log('✅ Gemini Response received');
    } catch (apiError: any) {
      console.warn('⚠️ Gemini API failed (Quota or Auth), using MOCK response for testing logic.');
      responseText = JSON.stringify({
        room_type: "living_room",
        detected_style: "scandinavian",
        recommendations: [
          { item: "pohovka", reason: "Fits the scandinavian style", suggested_style: "scandinavian", suggested_color: "grey" },
          { item: "stůl", reason: "Natural wood matches the floor", suggested_style: "scandinavian", suggested_color: "oak" }
        ]
      });
    }
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    console.log('📊 Analysis Result:', JSON.stringify(analysis, null, 2));

    // 3. Test Recommendation Logic
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      for (const rec of analysis.recommendations.slice(0, 2)) {
        console.log(`\n🔍 Testing recommendation for: ${rec.item} (${rec.suggested_style})`);
        
        // Hledání v DB - vylepšený dotaz
        const products = await (db as any).getAsync(
          "SELECT name, brand, price_czk FROM products WHERE (name LIKE ? OR category LIKE ?) AND (style_tags LIKE ? OR description_visual LIKE ?) LIMIT 3",
          [`%${rec.item}%`, `%${rec.item}%`, `%${rec.suggested_style}%`, `%${rec.suggested_style}%`]
        );

        if (products) {
          console.log('🎁 Matching products found:', products);
        } else {
          console.log('⚠️ No direct matches found in DB for this style/item combination.');
        }
      }
    }
  } catch (error) {
    console.error('❌ Pipeline Error:', error);
  } finally {
    await db.close();
    console.log('\n🏁 Test complete.');
  }
}

testPipeline().catch(console.error);
