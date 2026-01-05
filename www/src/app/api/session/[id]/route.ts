import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const session = await db.get('SELECT * FROM sessions WHERE id = ?', [id]) as any;

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Parse JSON fields
    const analysisResult = session.analysis_result 
      ? JSON.parse(session.analysis_result) 
      : null;

    return NextResponse.json({
      sessionId: session.id,
      imageUrl: session.original_image_url,
      roomType: session.room_type,
      analysis: analysisResult,
      status: session.status,
      createdAt: session.created_at,
    });
  } catch (error: any) {
    console.error("Session GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await db.run('DELETE FROM sessions WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Session DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete session" },
      { status: 500 }
    );
  }
}
