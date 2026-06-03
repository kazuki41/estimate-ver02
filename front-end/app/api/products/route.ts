import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

// 📦 1. 全ての商品情報を取得する
export async function GET() {
  try {
    // ★ データベースにある全てのカラムを正確に取得
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, description, category, price, unit, billing_type")
      .order("created_at", { ascending: false }); // 新しく作った順に並べる

    if (error) throw error;

    return NextResponse.json(products || []);
  } catch (error: any) {
    console.error("商品一覧取得エラー:", error);
    return NextResponse.json({ message: "データ取得に失敗しました。" }, { status: 500 });
  }
}

// 💾 2. 商品情報を「新規追加」または「更新」する
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ★ 全ての入力項目を画面から受け取る
    const { id, name, description, category, price, unit, billingType } = body;

    let error;

    const productData = {
      name: name,
      description: description || null,
      category: category || null,
      price: Number(price),
      unit: unit || "1式", // 未入力なら「1式」をデフォルトに
      billing_type: billingType || "one-time" // 未入力なら「one-time(一括)」に
    };

    if (id) {
      // 既存商品の編集（更新）
      const { error: updateError } = await supabase
        .from("products")
        .update(productData)
        .eq("id", id);
      error = updateError;
    } else {
      // 新しい商品の追加（新規挿入）
      const { error: insertError } = await supabase
        .from("products")
        .insert([productData]);
      error = insertError;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, message: "商品マスターを更新しました！" });
  } catch (error: any) {
    console.error("商品情報保存エラー:", error);
    return NextResponse.json({ message: "保存に失敗しました。" }, { status: 500 });
  }
}