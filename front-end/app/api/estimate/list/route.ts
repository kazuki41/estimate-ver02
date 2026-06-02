import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function GET() {
  try {
    // estimatesテーブルから一覧を取得し、紐づく明細の金額と数量も一緒に引っ張ってくる！
    const { data: estimates, error } = await supabase
      .from("estimates")
      .select(`
        id,
        status,
        created_at,
        estimate_items (
          price,
          quantity
        )
      `)
      .order("created_at", { ascending: false }); // 新しい順（降順）に並べる

    if (error) {
      throw new Error(`データ取得失敗: ${error.message}`);
    }

    // 画面で扱いやすいように、各見積もりの「合計金額」を裏方で計算して整形する
    const formattedEstimates = estimates.map((est) => {
      const items = est.estimate_items as any[] || [];
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        id: est.id,
        status: est.status,
        createdAt: est.created_at,
        totalAmount: total,
        itemCount: items.length
      };
    });

    return NextResponse.json(formattedEstimates);

  } catch (error: any) {
    console.error("履歴取得エラー:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}