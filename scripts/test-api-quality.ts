import { db } from '../www/src/lib/db';
import { getRecommendations } from '../www/src/lib/recommendation/engine';
import { Product, AIRecommendation } from '../www/src/lib/recommendation/types';

async function runTest(name: string, config: any) {
  console.log(`\n--- TEST: ${name} ---`);
  
  // Simulace NOVÉHO načítání produktů
  const startTimeLoad = Date.now();
  let dbProducts: any[] = [];
  const isAIMode = config.recommendations && config.recommendations.length > 0;
  
  if (isAIMode) {
    // AI Mode: Only fetch bomb candidates
    dbProducts = await db.all(
      "SELECT * FROM products WHERE price_czk > ? AND price_czk <= ? LIMIT 50", 
      [config.budget, config.budget * 1.25]
    );
  } else {
    // Discovery Mode: Fetch relevant categories
    dbProducts = await db.all(
      "SELECT * FROM products WHERE price_czk <= ? LIMIT 500",
      [config.budget]
    );
  }

  const allProducts: Product[] = dbProducts.map((p: any) => ({
    ...p,
    style_tags: JSON.parse(p.style_tags || '[]'),
  }));
  const loadTime = Date.now() - startTimeLoad;
  
  const startEngine = Date.now();
  const result = await getRecommendations(allProducts, config);
  const engineTime = Date.now() - startEngine;
  
  console.log(`[Time] DB Load: ${loadTime}ms | Engine: ${engineTime}ms | Total: ${loadTime + engineTime}ms`);
  console.log(`[Stats] Found ${result.products.length} products, ${result.bombs.length} bombs`);
  
  if (result.products.length > 0) {
    const first = result.products[0];
    console.log(`[Top Match] ${first.name} (${first.brand}) - ${first.price_czk} Kč`);
  } else {
    console.error(`[Error] No products found for this scenario!`);
  }
  
  return { loadTime, engineTime, count: result.products.length };
}

async function main() {
  console.log("🛋️  Vybaveno.cz - API Quality & Performance Baseline");
  
  const results = [];
  
  results.push(await runTest("Low Budget Living Room", {
    room: 'living',
    budget: 15000,
    recommendations: [
      { item: 'pohovka', reason: 'sezení', suggested_style: 'Modern' } as AIRecommendation
    ],
    limit: 10
  }));
  
  results.push(await runTest("Premium Bedroom with Specific Items", {
    room: 'bedroom',
    style: 'scandinavian',
    budget: 120000,
    recommendations: [
      { item: 'manželská postel dub', reason: 'spánek', suggested_style: 'Scandinavian' } as AIRecommendation,
      { item: 'noční stolek', reason: 'odkládání', suggested_style: 'Scandinavian' } as AIRecommendation,
      { item: 'šatní skříň bílá', reason: 'úložný prostor', suggested_style: 'Scandinavian' } as AIRecommendation
    ],
    limit: 20
  }));

  const totalTime = results.reduce((acc, r) => acc + r.loadTime + r.engineTime, 0);
  console.log(`\n✅ Baseline measurement complete. Average Total Time: ${Math.round(totalTime / results.length)}ms`);
  
  process.exit(0);
}

main().catch(console.error);
