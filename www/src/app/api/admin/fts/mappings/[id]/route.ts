import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ftsConfig } from "@/lib/recommendation/fts-config";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { term, category, priority, is_active } = await req.json();

    await db.run(
      `UPDATE fts_term_mappings 
       SET term = ?, category = ?, priority = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [term.toLowerCase(), category, priority, is_active ? 1 : 0, id]
    );

    await ftsConfig.refreshCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FTS Mappings PUT error:", error);
    return NextResponse.json({ error: "Failed to update mapping" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.run("DELETE FROM fts_term_mappings WHERE id = ?", [id]);
    
    await ftsConfig.refreshCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FTS Mappings DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete mapping" }, { status: 500 });
  }
}
