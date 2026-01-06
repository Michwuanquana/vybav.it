import { NextRequest, NextResponse } from "next/server";
import { cleanFTSQuery, getCategoryFromItem, searchByRecommendation } from "@/lib/recommendation/strategies/fts";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const [cleanQuery, category] = await Promise.all([
      cleanFTSQuery(query),
      getCategoryFromItem(query)
    ]);

    const results = await searchByRecommendation({ 
      item: query, 
      reason: "Admin test",
      suggested_style: "Modern",
      suggested_color: "Neutral"
    });

    return NextResponse.json({
      query,
      cleanQuery,
      category,
      resultsCount: results.length,
      results: results.slice(0, 5) // Jen prvních 5 pro náhled
    });
  } catch (error) {
    console.error("FTS Test error:", error);
    return NextResponse.json({ error: "Failed to test FTS" }, { status: 500 });
  }
}
