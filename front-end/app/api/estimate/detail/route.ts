import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "見積もりIDが指定されていません。" }, { status: 400 });
    }
    
    const { data: estimate, error } = await supabase
      .from("estimates")
      .select(`
        id,
        created_at,
        tax_rate,
        customers (
          company_name,
          customer_name,
          address
        ),
        company_info (
          name,
          invoice_number
        ),
        estimate_items (
          id,
          product_name,
          quantity,
          price
        )
      `)
      .eq("id", id)
      .single(); // 1件だけを取得

    if (error) {
      throw new Error(`詳細データの取得に失敗: ${error.message}`);
    }

    return NextResponse.json(estimate);

  } catch (error: any) {
    console.error("詳細取得エラー:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}