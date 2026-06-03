import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

// 🏢 1. 現在の自社情報を取得する（画面を開いた時に呼び出される）
export async function GET() {
  try {
    const { data: company, error } = await supabase
      .from("company_info")
      .select("id, name, invoice_number")
      .limit(1) // とりあえず最初の1件を取得
      .single();

    if (error && error.code !== "PGRST116") { // 1件もない場合のエラー以外は弾く
      throw error;
    }

    return NextResponse.json(company || { name: "", invoice_number: "" });
  } catch (error: any) {
    console.error("自社情報取得エラー:", error);
    return NextResponse.json({ message: "データ取得に失敗しました。" }, { status: 500 });
  }
}

// 💾 2. 画面から届いた内容で自社情報を更新する（保存ボタンを押した時に呼び出される）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, invoiceNumber } = body;

    let error;

    if (id) {
      // すでにデータがある場合は「更新（既存の行を書き換え）」
      const { error: updateError } = await supabase
        .from("company_info")
        .update({ name, invoice_number: invoiceNumber })
        .eq("id", id);
      error = updateError;
    } else {
      // 1件もない場合は「新規登録」
      const { error: insertError } = await supabase
        .from("company_info")
        .insert([{ name, invoice_number: invoiceNumber }]);
      error = insertError;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, message: "自社情報を更新しました！" });
  } catch (error: any) {
    console.error("自社情報保存エラー:", error);
    return NextResponse.json({ message: "保存に失敗しました。" }, { status: 500 });
  }
}