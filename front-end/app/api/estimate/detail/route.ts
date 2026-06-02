import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function GET(request: Request) {
  try {
    // URLから「どの見積もりIDの詳細がほしいか」を読み取る（例: /api/estimate/detail?id=xxx）
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "見積もりIDが指定されていません。" }, { status: 400 });
    }

    // 指定されたIDに紐づく見積明細（estimate_items）をすべて取得する
    const { data: items, error } = await supabase
      .from("estimate_items")
      .select("id, product_name, quantity, price")
      .eq("estimate_id", id); // IDが一致するものだけを狙い撃ち

    if (error) {
      throw new Error(`詳細データの取得に失敗: ${error.message}`);
    }

    return NextResponse.json(items);

  } catch (error: any) {
    console.error("詳細取得エラー:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}