export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function GET() {
  try {
    const { data: estimates, error } = await supabase
      .from("estimates")
      .select(`
        status,
        estimate_items (
          price,
          quantity
        )
      `);

    if (error) throw error;

    let totalCount = 0;
    let draftCount = 0;
    let sentCount = 0;
    let totalSentAmount = 0; // 提出済みの合計金額

    if (estimates) {
      totalCount = estimates.length;
      
      estimates.forEach((est: any) => {
        // この見積もりの税別合計金額を計算
        const items = est.estimate_items || [];
        const estAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        if (est.status === "sent") {
          sentCount++;
          totalSentAmount += estAmount;
        } else {
          draftCount++; // draft または null は下書きカウント
        }
      });
    }

    // フロントエンドが使いやすいサマリーデータにして返す
    return NextResponse.json({
      totalCount,
      draftCount,
      sentCount,
      totalSentAmount
    });

  } catch (error: any) {
    console.error("ダッシュボード集計エラー:", error);
    return NextResponse.json({ message: "集計に失敗しました。" }, { status: 500 });
  }
}