import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

// 👥 1. 登録されているお客様の一覧をすべて取得する
export async function GET() {
  try {
    // ★ `tel` を取得対象に追加
    const { data: customers, error } = await supabase
      .from("customers")
      .select("id, company_name, customer_name, address, tel")
      .order("company_name", { ascending: true });

    if (error) throw error;

    return NextResponse.json(customers || []);
  } catch (error: any) {
    console.error("顧客一覧取得エラー:", error);
    return NextResponse.json({ message: "データ取得に失敗しました。" }, { status: 500 });
  }
}

// 💾 2. お客様情報を「新規追加」または「更新」する
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ★ `tel` も画面から受け取る
    const { id, companyName, customerName, address, tel } = body;

    let error;

    if (id) {
      // 既存顧客の編集（更新） ★ `tel` を追加
      const { error: updateError } = await supabase
        .from("customers")
        .update({
          company_name: companyName,
          customer_name: customerName,
          address: address,
          tel: tel
        })
        .eq("id", id);
      error = updateError;
    } else {
      // 新しい顧客の追加（新規挿入） ★ `tel` を追加
      const { error: insertError } = await supabase
        .from("customers")
        .insert([
          {
            company_name: companyName,
            customer_name: customerName,
            address: address,
            tel: tel
          }
        ]);
      error = insertError;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, message: "顧客マスターを更新しました！" });
  } catch (error: any) {
    console.error("顧客情報保存エラー:", error);
    return NextResponse.json({ message: "保存に失敗しました。" }, { status: 500 });
  }
}