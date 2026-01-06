import { NextResponse } from "next/server";
import { ftsConfig } from "@/lib/recommendation/fts-config";

export async function POST() {
  try {
    await ftsConfig.refreshCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FTS Cache Refresh error:", error);
    return NextResponse.json({ error: "Failed to refresh cache" }, { status: 500 });
  }
}
