import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";
import OpenAI from "openai";

// OpenAIの準備
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = body.message;

    // 1. Supabaseから現在の「最新の商品マスター」をすべて取得する
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("id, name, description, price");

    if (dbError) {
      throw new Error(`DBエラー: ${dbError.message}`);
    }

    // AIに分かりやすいように商品リストをテキスト化
    const productListString = dbProducts
      .map(p => `ID: ${p.id} | 商品名: ${p.name} | 説明: ${p.description} | 単価: ¥${p.price}`)
      .join("\n");

    // 2. OpenAIを呼び出す（標準のJSONオブジェクトモードを使用）
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }, // ★必ずJSON形式で返答させるプロパティ
      messages: [
        {
          role: "system",
          content: `あなたは優秀なIT開発システムの見積もりアシスタントです。
ユーザーの要望に合う商品を【商品マスター】から選び、必ず以下の指定フォーマットのJSONで返答してください。キー名（aiResponseText, selectedItems等）を絶対に間違えないでください。

【返却するJSONフォーマット】
{
  "aiResponseText": "ユーザーへの丁寧な日本語メッセージ（例：ログイン機能ですね、かしこまりました！）",
  "selectedItems": [
    { "id": "選んだ商品のID", "quantity": 1 }
  ]
}

【商品マスター】
${productListString}

【ルール】
・ユーザーの要望に関係のない商品は絶対に選ばないでください。
・もし要望に合う商品がマスターに一つもない場合は、selectedItemsを空の配列「[]」にしてください。`,
        },
        { role: "user", content: userMessage },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return NextResponse.json({ message: "AIからの返答が空でした。" }, { status: 500 });
    }

    // AIから届いた文字列（テキスト）を、プログラムで扱えるJSON（オブジェクト）に変換
    const aiParsedData = JSON.parse(content);

    // 3. AIが選んだ「商品ID」を元に、右側の画面に渡す「見積明細データ」を完成させる
    const finalItems = aiParsedData.selectedItems.map((selected: { id: string; quantity: number }) => {
      const matchingProduct = dbProducts.find(p => p.id === selected.id);
      return {
        id: selected.id,
        name: matchingProduct ? matchingProduct.name : "不明な商品",
        quantity: selected.quantity,
        price: matchingProduct ? matchingProduct.price : 0,
      };
    });

    // 画面（フロントエンド）に返り値を戻す
    return NextResponse.json({
      message: aiParsedData.aiResponseText,
      items: finalItems,
    });

  } catch (error: any) {
    console.error("AI見積もり処理でエラーが発生しました:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}