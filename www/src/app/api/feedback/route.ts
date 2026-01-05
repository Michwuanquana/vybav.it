import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, type, comment, target = 'analysis' } = body;

    if (!sessionId || !type) {
      return NextResponse.json({ error: "Session ID a typ feedbacku jsou povinné" }, { status: 400 });
    }

    console.log(`API: Feedback received for session ${sessionId}: ${type} (${target})`);

    // Uložení do user_interactions tabulky
    await db.run(
      `INSERT INTO user_interactions (session_id, interaction_type, metadata) 
       VALUES (?, ?, ?)`,
      [
        sessionId, 
        type === 'up' ? 'thumbs_up' : 'thumbs_down', 
        JSON.stringify({ 
          comment: comment || null, 
          target,
          timestamp: new Date().toISOString() 
        })
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API: Feedback error:", error);
    return NextResponse.json({ error: "Chyba při ukládání feedbacku" }, { status: 500 });
  }
}
