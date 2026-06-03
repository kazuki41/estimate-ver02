import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ message: "IDまたはステータスが不足しています。" }, { status: 400 });
    }

    // 🔄 Supabaseのestimatesテーブルのstatusを直接書き換える！
    const { error } = await supabase
      .from("estimates")
      .update({ status: status })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "ステータスを更新しました！" });
  } catch (error: any) {
    console.error("ステータス更新エラー:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}