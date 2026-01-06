import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ftsConfig } from "@/lib/recommendation/fts-config";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { source_term, synonym, weight, is_active } = await req.json();

    await db.run(
      `UPDATE fts_synonyms 
       SET source_term = ?, synonym = ?, weight = ?, is_active = ?
       WHERE id = ?`,
      [source_term.toLowerCase(), synonym.toLowerCase(), weight, is_active ? 1 : 0, id]
    );

    await ftsConfig.refreshCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FTS Synonyms PUT error:", error);
    return NextResponse.json({ error: "Failed to update synonym" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.run("DELETE FROM fts_synonyms WHERE id = ?", [id]);
    
    await ftsConfig.refreshCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FTS Synonyms DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete synonym" }, { status: 500 });
  }
}
