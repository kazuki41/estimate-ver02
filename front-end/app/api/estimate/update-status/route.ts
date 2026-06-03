export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "IDまたはステータスが不足しています。" }, { status: 400 });
    }

    // 🚀 指定された見積もりIDの status カラム（draft または submitted）をピンポイントで更新！
    const { error } = await supabase
      .from("estimates")
      .update({ status: status })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ステータス更新エラー:", error);
    return NextResponse.json({ success: false, message: error.message || "ステータス更新に失敗しました。" }, { status: 500 });
  }
}