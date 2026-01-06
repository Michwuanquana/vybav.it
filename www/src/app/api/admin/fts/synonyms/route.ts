import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ftsConfig } from "@/lib/recommendation/fts-config";

export async function GET() {
  try {
    const synonyms = await db.all("SELECT * FROM fts_synonyms ORDER BY source_term ASC");
    return NextResponse.json(synonyms);
  } catch (error) {
    console.error("FTS Synonyms GET error:", error);
    return NextResponse.json({ error: "Failed to fetch synonyms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { source_term, synonym, weight } = await req.json();
    
    if (!source_term || !synonym) {
      return NextResponse.json({ error: "Source term and synonym are required" }, { status: 400 });
    }

    await db.run(
      "INSERT INTO fts_synonyms (source_term, synonym, weight) VALUES (?, ?, ?)",
      [source_term.toLowerCase(), synonym.toLowerCase(), weight || 1.0]
    );

    await ftsConfig.refreshCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FTS Synonyms POST error:", error);
    return NextResponse.json({ error: "Failed to create synonym" }, { status: 500 });
  }
}
