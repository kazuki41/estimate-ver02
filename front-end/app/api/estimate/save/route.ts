import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "保存する明細がありません。" }, { status: 400 });
    }

    // 1. estimatesテーブルに見積書の「親データ」を1件登録
    const { data: estimateData, error: estimateError } = await supabase
      .from("estimates")
      .insert([
        {
          status: "draft", // 最初は下書き状態
          tax_rate: 0.10,  // 消費税10%
        }
      ])
      .select()
      .single();

    if (estimateError) {
      throw new Error(`見積親データの保存に失敗: ${estimateError.message}`);
    }

    const estimateId = estimateData.id;

    // 2. estimate_itemsテーブルに見積書の「子データ（明細）」をまとめて登録
    // ★新方針：当時の商品名と単価をそのまま焼き付ける「スナップショット設計」
    const itemsToInsert = items.map((item: { id: string; name: string; quantity: number; price: number }) => ({
      estimate_id: estimateId,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("estimate_items")
      .insert(itemsToInsert);

    if (itemsError) {
      throw new Error(`見積明細データの保存に失敗: ${itemsError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "見積もりを正常に保存しました！",
      estimateId: estimateId
    });

  } catch (error: any) {
    console.error("保存処理でエラーが発生しました:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}