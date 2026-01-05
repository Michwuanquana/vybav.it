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

    console.log(`API: Recommending products for ${room} (${style}), budget: ${budget}, furnishing: ${furnishing_level}%, focus: ${focus_area}`);

    // 1. Načtení všech produktů z databáze
    const query = `
      SELECT 
        p.id, p.name, p.brand, p.price_czk, p.image_url, p.affiliate_url,
        p.style_tags, p.material, p.color, p.category,
        p.dimensions_cm
      FROM products p
      WHERE 1=1
      ${budget ? 'AND p.price_czk <= ? * 1.3' : ''} 
    `;
    
    const params: any[] = [];
    if (budget) params.push(budget); // Načteme i produkty lehce nad rozpočtem pro bomby
    
    const dbProducts = await db.all(query, params) as any[];
    
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
        budget,
        recommendations,
        contextual_queries,
        furnishing_level,
        focus_area,
        limit,
        enableBombs: true,
        maxBombs: budget < 30000 ? 1 : 2 // Budget users: 1 bomba, ostatní: 2
      });
    } else {
      // Discovery Mode - bez AI
      result = await getDiscoveryRecommendations(allProducts, room || 'living', budget, limit);
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
