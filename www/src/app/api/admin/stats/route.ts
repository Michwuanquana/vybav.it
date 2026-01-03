import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const productCount = await db.get("SELECT COUNT(*) as count FROM products") as any;
    const sessionCount = await db.get("SELECT COUNT(*) as count FROM sessions") as any;
    const brandStats = await db.all("SELECT brand, COUNT(*) as count FROM products GROUP BY brand") as any[];
    const recentSessions = await db.all("SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5") as any[];

    return NextResponse.json({
      products: productCount.count,
      sessions: sessionCount.count,
      brands: brandStats,
      recentSessions
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Chyba při načítání statistik" }, { status: 500 });
  }
}
