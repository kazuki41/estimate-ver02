import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ★追加：画面から顧客IDと自社情報IDも受け取る
    const { items, customerId, companyInfoId, status, userId } = body;

    // 💡 🔥 【新設】ユーザーIDがちゃんと届いているか検証する門番
    if (!userId) {
      console.error("🚨 警告: バックエンドに userId が届いていません！");
      return NextResponse.json({ message: "エラー: ユーザーIDが届いていないため保存できません。" }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "保存する明細がありません。" }, { status: 400 });
    }

    // 1. estimatesテーブルに見積書の「親データ」を登録
    const { data: estimateData, error: estimateError } = await supabase
      .from("estimates")
      .insert([
        {
          status: status || "draft",
          tax_rate: 0.10,
          customer_id: customerId || null,      // ★新しく作った列に保存！
          company_info_id: companyInfoId || null, // ★新しく作った列に保存！
          created_by: userId || null
        }
      ])
      .select()
      .single();

    if (estimateError) {
      throw new Error(`見積親データの保存に失敗: ${estimateError.message}`);
    }

    const estimateId = estimateData.id;

    // 2. estimate_itemsテーブルに見積書の「明細」をまとめて登録
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
      message: "顧客・自社情報を含めた見積もりを正常に保存しました！",
      estimateId: estimateId
    });

  } catch (error: any) {
    console.error("保存処理でエラーが発生しました:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}