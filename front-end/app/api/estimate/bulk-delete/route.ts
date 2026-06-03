export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: "削除するIDが指定されていません。" }, { status: 400 });
    }

    // 🚀 既存の「estimate」ルートの並びとして、安全に見積もりを一括削除！
    const { error } = await supabase
      .from("estimates")
      .delete()
      .in("id", ids);

    if (error) throw error;

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error("見積もり一括削除エラー:", error);
    return NextResponse.json({ success: false, message: error.message || "一括削除に失敗しました。" }, { status: 500 });
  }
}