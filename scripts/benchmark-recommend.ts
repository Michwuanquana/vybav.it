import { db } from '../www/src/lib/db';
import { getRecommendations } from '../www/src/lib/recommendation/engine';
import { Product } from '../www/src/lib/recommendation/types';

async function benchmark() {
  console.log("🚀 Starting Recommendation Benchmark...");

  // 1. Load products (simulating route.ts)
  const startTimeLoad = Date.now();
  const query = "SELECT * FROM products WHERE price_czk <= 200000";
  const dbProducts = await db.all(query);
  const allProducts: Product[] = dbProducts.map((p: any) => ({
    ...p,
    style_tags: JSON.parse(p.style_tags || '[]'),
  }));
  console.log(`DB: Loaded ${allProducts.length} products in ${Date.now() - startTimeLoad}ms`);

  // 2. Test Case: AI Recommendations (Sequential currently)
  const aiRecs = [
    { item: 'modrá pohovka', reason: 'Hlavní kus', suggested_style: 'Modern' },
    { item: 'konferenční stolek dub', reason: 'Doplněk', suggested_style: 'Scandinavian' },
    { item: 'stojací lampa černá', reason: 'Osvětlení', suggested_style: 'Industrial' }
  ];

  console.log("\n--- Testing AI Recommendations (3 items) ---");
  const startAI = Date.now();
  const result = await getRecommendations(allProducts, {
    style: 'modern',
    room: 'living',
    budget: 100000,
    recommendations: aiRecs,
    limit: 20
  });
  const durationAI = Date.now() - startAI;
  console.log(`Duration: ${durationAI}ms`);
  console.log(`Found: ${result.products.length} products, ${result.bombs.length} bombs`);

  // 3. Test Case: Discovery Mode
  console.log("\n--- Testing Discovery Mode (no AI) ---");
  const startDisc = Date.now();
  const discResult = await getRecommendations(allProducts, {
    room: 'living',
    budget: 50000,
    limit: 20
  });
  const durationDisc = Date.now() - startDisc;
  console.log(`Duration: ${durationDisc}ms`);
  console.log(`Found: ${discResult.products.length} products`);

  process.exit(0);
}

benchmark().catch(err => {
  console.error(err);
  process.exit(1);
});
