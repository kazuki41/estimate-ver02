import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ message: "IDが必要です。" }, { status: 400 });
    }

    // 🗑️ 1. 先に紐づいている見積明細（子）を削除
    const { error: itemsError } = await supabase
      .from("estimate_items")
      .delete()
      .eq("estimate_id", id);

    if (itemsError) throw itemsError;

    // 🗑️ 2. 親の見積もり本体を削除
    const { error: estimateError } = await supabase
      .from("estimates")
      .delete()
      .eq("id", id);

    if (estimateError) throw estimateError;

    return NextResponse.json({ success: true, message: "見積もりを削除しました。" });
  } catch (error: any) {
    console.error("削除エラー:", error);
    return NextResponse.json({ message: "削除処理に失敗しました。" }, { status: 500 });
  }
}