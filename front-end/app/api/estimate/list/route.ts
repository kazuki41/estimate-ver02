import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function GET() {
  try {
    // ★大改造：estimates（親）を取得する際、紐づくcustomersの会社名と、ステータス、有効期限もまとめて取得！
    const { data: estimatesData, error } = await supabase
      .from("estimates")
      .select(`
        id,
        created_at,
        status,
        valid_until,
        customers (
          company_name
        ),
        estimate_items (
          price,
          quantity
        )
      `)
      .order("created_at", { ascending: false }); // 新しい順

    if (error) {
      throw error;
    }

    // フロントエンドが扱いやすい形（品目数や合計金額の計算）に整形してあげる
    const formattedData = (estimatesData || []).map((est: any) => {
      const items = est.estimate_items || [];
      const itemCount = items.length;
      const totalAmount = items.reduce((sum: any, item: any) => sum + (item.price * item.quantity), 0);

      return {
        id: est.id,
        createdAt: est.created_at,
        status: est.status || "draft",
        validUntil: est.valid_until,
        companyName: est.customers?.company_name || "顧客未設定",
        itemCount: itemCount,
        totalAmount: totalAmount,
      };
    });

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error("履歴一覧取得エラー:", error);
    return NextResponse.json({ message: "データ取得に失敗しました。" }, { status: 500 });
  }
}