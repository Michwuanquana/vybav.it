import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const style = searchParams.get("style");
    const material = searchParams.get("material");
    const color = searchParams.get("color");
    const category = searchParams.get("category");
    const maxPrice = searchParams.get("max_price");
    const limit = parseInt(searchParams.get("limit") || "10");

    let query = "SELECT * FROM products WHERE 1=1";
    const params: any[] = [];

    if (style) {
      query += " AND style_tags LIKE ?";
      params.push(`%${style}%`);
    }

    if (material) {
      query += " AND material LIKE ?";
      params.push(`%${material}%`);
    }

    if (color) {
      query += " AND color LIKE ?";
      params.push(`%${color}%`);
    }

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    if (maxPrice) {
      query += " AND price_czk <= ?";
      params.push(parseInt(maxPrice));
    }

    query += " ORDER BY RANDOM() LIMIT ?";
    params.push(limit);

    const products = await db.all(query, params) as any[];

    // Parse JSON fields
    const parsedProducts = products.map((p: any) => ({
      ...p,
      dimensions_cm: p.dimensions_cm ? JSON.parse(p.dimensions_cm) : null,
      style_tags: p.style_tags ? JSON.parse(p.style_tags) : [],
      search_keywords: p.search_keywords ? JSON.parse(p.search_keywords) : [],
    }));

    return NextResponse.json(parsedProducts);
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json({ error: "Chyba při vyhledávání produktů" }, { status: 500 });
  }
}
