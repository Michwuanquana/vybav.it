import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAIRecommendations, getDiscoveryRecommendations, type Product } from "@/lib/recommendation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      style, 
      room, 
      budget, 
      recommendations = [], 
      contextual_queries = [],
      furnishing_level = 50,
      focus_area = 'full_room',
      limit = 40 
    } = body;

    // Validace budgetu - musí být > 0
    const validBudget = budget && budget > 0 ? budget : 150000;
    console.log(`API: Recommending products for ${room} (${style}), budget: ${validBudget}, furnishing: ${furnishing_level}%, focus: ${focus_area}`);

    // 1. Načtení produktů z databáze (Optimalizováno: v AI módu načítáme méně)
    let dbProducts: any[] = [];
    const isAIMode = recommendations.length > 0;

    if (isAIMode) {
      // V AI módu engine využívá FTS pro hlavní výsledky.
      // Stáhneme jen malý vzorek pro "bomby" (upsell) lehce nad rozpočtem.
      const bombQuery = `
        SELECT p.* FROM products p 
        WHERE p.price_czk > ? AND p.price_czk <= ? 
        LIMIT 50
      `;
      dbProducts = await db.all(bombQuery, [validBudget, validBudget * 1.25]);
      console.log(`API: AI Mode - Prefetched ${dbProducts.length} bomb candidates`);
    } else {
      // Discovery Mode - načteme produkty pouze pro daný typ místnosti
      // To dramaticky snižuje počet scanovaných řádků
      const categories = ['sofa', 'table', 'chair', 'lamp', 'shelving']; // Default
      // TODO: Mapování room -> categories by mohlo být v SQL
      const query = `
        SELECT p.* FROM products p
        WHERE p.price_czk <= ?
        AND (p.category IS NULL OR p.category IN ('sofa', 'table', 'chair', 'lamp', 'bed', 'wardrobe', 'desk'))
        ORDER BY p.price_czk ASC
        LIMIT 500
      `;
      dbProducts = await db.all(query, [validBudget]);
      console.log(`API: Discovery Mode - Loaded ${dbProducts.length} category-filtered products`);
    }
    
    // 2. Parsování JSON polí
    const allProducts: Product[] = dbProducts.map((p: any) => {
      let dimensions: Record<string, number> = {};
      try {
        const parsed = p.dimensions_cm ? JSON.parse(p.dimensions_cm) : null;
        if (parsed && typeof parsed === 'object') {
          dimensions = parsed;
        }
      } catch {
        // Invalid JSON, use empty dimensions
      }
      
      return {
        ...p,
        style_tags: Array.isArray(p.style_tags) ? p.style_tags : (p.style_tags ? JSON.parse(p.style_tags) : []),
        width_cm: dimensions?.width || dimensions?.w || undefined,
        depth_cm: dimensions?.depth || dimensions?.d || undefined,
        height_cm: dimensions?.height || dimensions?.h || undefined,
      };
    });

    console.log(`API: Loaded ${allProducts.length} products from DB`);

    // 3. Použití Recommendation Engine
    let result;
    
    if (recommendations.length > 0) {
      // Režim s AI analýzou - používáme AI recommendations
      result = await getAIRecommendations(allProducts, {
        style,
        room,
        budget: validBudget,
        recommendations,
        contextual_queries,
        furnishing_level,
        focus_area,
        limit,
        enableBombs: true,
        maxBombs: validBudget < 30000 ? 1 : 2 // Budget users: 1 bomba, ostatní: 2
      });
    } else {
      // Discovery Mode - bez AI
      result = await getDiscoveryRecommendations(allProducts, room || 'living', validBudget, limit);
    }

    if (result.products.length === 0 && recommendations.length > 0) {
      console.warn(`API: ZERO products found for ${recommendations.length} AI recommendations in session ${body.sessionId || 'unknown'}`);
    }

    console.log(`API: Recommendation engine returned ${result.products.length} products + ${result.bombs.length} bombs`);
    
    // 4. Kombinace produktů a bomb
    const finalProducts = [
      ...result.products,
      ...result.bombs.map(b => ({ ...b, _isBomb: true })) // Označíme bomby pro frontend
    ];

    return NextResponse.json(finalProducts);

  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json({ error: "Chyba při vyhledávání produktů" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const style = searchParams.get("style");
  const room = searchParams.get("room");
  const budget = searchParams.get("max_price");
  const limit = parseInt(searchParams.get("limit") || "40");

  // Simulujeme POST volání s prázdnými doporučeními
  const mockReq = {
    json: async () => ({ style, room, budget: budget ? parseInt(budget) : null, limit })
  };
  return POST(mockReq as any);
}
