export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "登録データが空です。" }, { status: 400 });
    }

    // 👥 Supabaseのテーブル定義に合わせてデータを整形
    const insertData = items.map((item: any) => ({
      company_name: item.companyName,
      customer_name: item.customerName || null,
      address: item.address || null,
      tel: item.tel || null,
    }));

    // 🚀 Supabaseのinsertに配列をそのまま渡すことで「一撃（バルクインサート）」で高速登録！
    const { error } = await supabase.from("customers").insert(insertData);

    if (error) throw error;

    return NextResponse.json({ success: true, count: insertData.length });
  } catch (error: any) {
    console.error("顧客一括登録エラー:", error);
    return NextResponse.json({ success: false, message: error.message || "一括登録に失敗しました。" }, { status: 500 });
  }
}