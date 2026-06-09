export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("estimates")
      .select(`
        id,
        created_at,
        customer_id,
        status, 
        created_by,
        customers (
          id,
          company_name,
          customer_name
        ),
        estimate_items (
          id,
          product_name,
          price,
          quantity
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("見積もり一覧取得エラー:", error);
    return NextResponse.json({ message: "一覧の取得に失敗しました。" }, { status: 500 });
  }
}