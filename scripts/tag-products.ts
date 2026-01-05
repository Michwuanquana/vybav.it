import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { LocalDB } from './lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// JSON schema pro výstup
const schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      product_id: { type: SchemaType.STRING },
      search_keywords: { 
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      },
      style_tags: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      },
      subcategory: { type: SchemaType.STRING },
      ai_description: { type: SchemaType.STRING },
      placement_type: { 
        type: SchemaType.STRING
      }
    },
    required: ['product_id', 'search_keywords', 'style_tags', 'subcategory', 'ai_description', 'placement_type']
  }
};

const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 100000,
    responseMimeType: 'application/json',
    responseSchema: schema,
  }
});

const BATCH_SIZE = 500; // 500 produktů na batch

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  color: string | null;
  material: string | null;
  price_czk: number;
  description_visual: string | null;
}

interface TagResult {
  product_id: string;
  search_keywords: string[];
  style_tags: string[];
  subcategory: string;
  ai_description: string;
  placement_type: 'wall' | 'floor' | 'table' | 'ceiling' | 'window' | 'any';
}

async function tagAllProducts() {
  const db = new LocalDB();
  await (db as any).init();

  console.log('📊 Načítám produkty bez tagů...');
  const products: Product[] = await db.all(
    `SELECT id, name, brand, category, color, material, price_czk, description_visual 
     FROM products 
     WHERE placement_type IS NULL OR placement_type = 'any'
     ORDER BY id`
  );

  const totalProducts = products.length;
  console.log(`✅ Načteno ${totalProducts} produktů`);

  if (totalProducts === 0) {
    console.log('ℹ️  Všechny produkty jsou již otagovány!');
    return;
  }

  const totalBatches = Math.ceil(totalProducts / BATCH_SIZE);
  console.log(`\n🚀 Zpracování v ${totalBatches} batchích po ${BATCH_SIZE} produktech...\n`);

  let processedTotal = 0;

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const start = batchNum * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, totalProducts);
    const batch = products.slice(start, end);

    console.log(`📦 Batch ${batchNum + 1}/${totalBatches} (${batch.length} produktů)...`);

    // Připravíme data pro Gemini
    const productList = batch
      .map(
        (p, idx) => `${idx + 1}. ID: ${p.id} | ${p.name} | ${p.brand} | ${p.category} | ${p.color || '-'} | ${p.material || '-'} | ${p.price_czk} Kč`
      )
      .join('\n');

  const prompt = `Analyzuj následující ${totalProducts} produktů nábytku a dekorací. Pro KAŽDÝ produkt vygeneruj:

1. search_keywords: 5-10 českých slov/frází pro vyhledávání (synonyma, varianty)
2. style_tags: 1-3 styly ze seznamu: scandinavian, modern, industrial, rustic, minimalist, traditional, bohemian, art-deco, retro
3. subcategory: přesnější kategorie (např. "rohová pohovka", "jídelní stůl")
4. ai_description: 1-2 věty česky popisující produkt
5. placement_type: KDE SE POUŽÍVÁ - POUZE JEDNA Z TĚCHTO HODNOT:
   - "wall" → na zeď (obrazy, zrcadla, police, hodiny, nástěnné lampy, háčky, věšáky)
   - "floor" → na podlahu (koberce, pohovky, postele, stoly, skříně, stojací lampy, rostliny, polštáře)
   - "table" → na stůl/poličku (vázy, svíčky, dekorace, stolní lampy, knihy, koš)
   - "ceiling" → na strop (lustry, závěsná svítidla)
   - "window" → na okno (závěsy, záclony, rolety)
   - "any" → univerzální (textilie, povlečení, doplňky)

DŮLEŽITÉ PRAVIDLA:
- Stůl, židle, skříň, postel → "floor" (stojí na podlaze)
- Polštář, povlak na polštář → "floor" (používá se na pohovce/posteli)
- Obraz, zrcadlo → "wall"
- Svíčka, váza → "table"

Vrať VALIDNÍ JSON array ve formátu:
[
  {
    "product_id": "ID produktu",
    "search_keywords": ["klíčové", "slovo"],
    "style_tags": ["modern"],
    "subcategory": "podkategorie",
    "ai_description": "popis",
    "placement_type": "floor"
  }
]

PRODUKTY:
${productList}

VÝSTUP MUSÍ BÝT ČISTÝ JSON ARRAY BEZ MARKDOWN, BEZ TEXTU PŘED/PO.`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const tags: TagResult[] = JSON.parse(text);
      console.log(`  ✅ Gemini vygenerovalo ${tags.length} tagů`);

      if (tags.length !== batch.length) {
        console.warn(`  ⚠️  Očekáváno ${batch.length} tagů, obdrženo ${tags.length}`);
      }

      // Uložíme do DB
      for (const tag of tags) {
        try {
          await (db as any).runAsync(
            `UPDATE products SET 
              search_keywords = ?,
              style_tags = ?,
              subcategory = ?,
              ai_description = ?,
              placement_type = ?
            WHERE id = ?`,
            [
              JSON.stringify(tag.search_keywords),
              JSON.stringify(tag.style_tags),
              tag.subcategory,
              tag.ai_description,
              tag.placement_type,
              tag.product_id,
            ]
          );
        } catch (error) {
          console.error(`  ❌ Chyba při ukládání ${tag.product_id}:`, error);
        }
      }

      processedTotal += tags.length;
      console.log(`  💾 Uloženo ${tags.length} tagů (celkem: ${processedTotal}/${totalProducts})\n`);

      // Pauza mezi batchi kvůli rate limitu
      if (batchNum < totalBatches - 1) {
        console.log(`  ⏸️  Pauza 30s kvůli rate limitu...`);
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
    } catch (error: any) {
      console.error(`  ❌ Chyba v batchi ${batchNum + 1}:`, error.message);
      
      if (error.status === 429) {
        console.log(`  ⏸️  Rate limit - čekám 60s...`);
        await new Promise((resolve) => setTimeout(resolve, 60000));
        batchNum--; // Zkusíme batch znovu
        continue;
      }
    }
  }

  console.log(`\n✨ Hotovo! ${processedTotal}/${totalProducts} produktů otagováno`);
  // Statistiky
  const placementStats = await db.all(
    `SELECT placement_type, COUNT(*) as count 
     FROM products 
     WHERE placement_type IS NOT NULL
     GROUP BY placement_type 
     ORDER BY count DESC`
  );
  console.log('\n📊 Rozdělení podle placement_type:');
  placementStats.forEach((stat: any) => {
    console.log(`  ${stat.placement_type}: ${stat.count}`);
  });
}

tagAllProducts().catch(console.error);
