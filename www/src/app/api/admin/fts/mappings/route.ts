import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ftsConfig } from "@/lib/recommendation/fts-config";

export async function GET() {
  try {
    const mappings = await db.all("SELECT * FROM fts_term_mappings ORDER BY term ASC");
    return NextResponse.json(mappings);
  } catch (error) {
    console.error("FTS Mappings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch mappings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { term, category, priority } = await req.json();
    
    if (!term || !category) {
      return NextResponse.json({ error: "Term and category are required" }, { status: 400 });
    }

    await db.run(
      "INSERT INTO fts_term_mappings (term, category, priority) VALUES (?, ?, ?)",
      [term.toLowerCase(), category, priority || 0]
    );

    // Refresh cache after change
    await ftsConfig.refreshCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FTS Mappings POST error:", error);
    return NextResponse.json({ error: "Failed to create mapping" }, { status: 500 });
  }
}
