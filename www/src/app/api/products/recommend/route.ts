import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      style, 
      room, 
      budget, 
      recommendations = [], 
      contextual_queries = [],
      limit = 40 
    } = body;

    console.log(`API: Recommending products for ${room} (${style}), budget: ${budget}`);

    const allProducts: any[] = [];
    const seenIds = new Set<string>();

    // Pomocná funkce pro přidání produktů do seznamu bez duplicit
    const addProducts = (products: any[]) => {
      for (const p of products) {
        if (!seenIds.has(p.id)) {
          allProducts.push(p);
          seenIds.add(p.id);
        }
      }
    };

    // --- ÚROVEŇ 1: Přímá doporučení (Značky na fotce) ---
    if (recommendations.length > 0) {
      for (const rec of recommendations) {
        if (!rec.search_query) continue;
        
        // FTS5 vyhledávání pro každou značku - zvýšen limit na 6 pro větší diverzitu
        // Vylepšená logika vyhledávání: zkusíme nejdřív volnější shodu slov (AND), pak případně OR
        const cleanQuery = rec.search_query
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter((w: string) => w.length > 2)
          .map((w: string) => `${w}*`)
          .join(' ');

        if (!cleanQuery) continue;

        const query = `
          SELECT p.*, bm25(products_fts, 10.0, 2.0, 1.0, 1.0, 5.0, 5.0) as rank
          FROM products p
          JOIN products_fts f ON p.id = f.id
          WHERE products_fts MATCH ?
          ${budget ? 'AND p.price_czk <= ?' : ''}
          ORDER BY rank
          LIMIT 8
        `;
        
        const params = [cleanQuery];
        if (budget) params.push(budget);

        try {
          let matches = await db.all(query, params) as any[];
          
          // Pokud nemáme žádné výsledky, zkusíme méně restriktivní vyhledávání (OR)
          if (matches.length === 0) {
            const relaxedQuery = cleanQuery.split(/\s+/).join(' OR ');
            const relaxedParams = [relaxedQuery];
            if (budget) relaxedParams.push(budget);
            matches = await db.all(query, relaxedParams) as any[];
          }
          
          addProducts(matches);
        } catch (e) {
          console.error(`FTS error for query "${rec.search_query}":`, e);
        }
      }
    }

    // --- ÚROVEŇ 2: Kontextová doporučení (Skrytá) ---
    if (contextual_queries.length > 0 && allProducts.length < limit) {
      // Rozšíření dotazu o OR pro širší záběr
      const combinedContextQuery = contextual_queries.map((q: string) => `"${q}"`).join(' OR ');
      const query = `
        SELECT p.*, bm25(products_fts, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0) as rank
        FROM products p
        JOIN products_fts f ON p.id = f.id
        WHERE products_fts MATCH ?
        ${budget ? 'AND p.price_czk <= ?' : ''}
        ORDER BY rank
        LIMIT ?
      `;
      const params = [combinedContextQuery];
      if (budget) params.push(budget);
      params.push(limit - allProducts.length);

      try {
        const matches = await db.all(query, params) as any[];
        addProducts(matches);
      } catch (e) {
        console.error(`FTS error for contextual queries:`, e);
      }
    }

    // --- ÚROVEŇ 3: Discovery (Garantované zaplnění) ---
    if (allProducts.length < limit) {
      let query = "SELECT * FROM products WHERE 1=1";
      const params: any[] = [];

      if (budget) {
        query += " AND price_czk <= ?";
        params.push(budget);
      }

      // Exclude outdoor for indoor rooms
      const indoorRooms = ['living', 'bedroom', 'kids', 'office'];
      if (room && indoorRooms.includes(room)) {
        query += " AND name NOT LIKE '%zahrada%' AND name NOT LIKE '%venkovní%' AND category NOT LIKE '%outdoor%' AND category NOT LIKE '%garden%'";
      }

      // Přidáme náhodnost, ale preferujeme kategorii odpovídající místnosti
      let orderBy = "ORDER BY ";
      if (room === 'living') orderBy += "CASE WHEN category LIKE '%pohovk%' OR category LIKE '%stolek%' THEN 0 ELSE 1 END, ";
      if (room === 'bedroom') orderBy += "CASE WHEN category LIKE '%postel%' OR category LIKE '%matrac%' THEN 0 ELSE 1 END, ";
      
      if (style) {
        orderBy += `CASE WHEN style_tags LIKE ? THEN 0 ELSE 1 END, `;
        params.push(`%${style}%`);
      }
      
      orderBy += "RANDOM()";
      query += ` ${orderBy} LIMIT ?`;
      params.push(limit - allProducts.length);

      const discovery = await db.all(query, params) as any[];
      addProducts(discovery);
    }

    // Finální zpracování produktů
    const parsedProducts = allProducts.map((p: any) => ({
      ...p,
      dimensions_cm: p.dimensions_cm ? JSON.parse(p.dimensions_cm) : null,
      style_tags: p.style_tags ? JSON.parse(p.style_tags) : [],
      search_keywords: p.search_keywords ? JSON.parse(p.search_keywords) : [],
    }));

    console.log(`API: Returned ${parsedProducts.length} products total.`);
    return NextResponse.json(parsedProducts);

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
