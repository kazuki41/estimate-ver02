export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "登録データが空です。" }, { status: 400 });
    }

    // 📦 商品テーブルのカラムに合わせてデータを整形
    const insertData = items.map((item: any) => ({
      name: item.name,
      description: item.description || null,
      category: item.category || null,
      price: Number(item.price) || 0,
      unit: item.unit || "1式",
      billing_type: item.billingType === "recurring" ? "recurring" : "one-time",
    }));

    // 🚀 大量の商品データを一発でSupabaseへ流し込む！
    const { error } = await supabase.from("products").insert(insertData);

    if (error) throw error;

    return NextResponse.json({ success: true, count: insertData.length });
  } catch (error: any) {
    console.error("商品一括登録エラー:", error);
    return NextResponse.json({ success: false, message: error.message || "一括登録に失敗しました。" }, { status: 500 });
  }
}