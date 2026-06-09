export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const chatMessages = body.messages || []; 
    const currentItems = body.currentItems || []; 

    // 1. Supabaseから商品マスターをすべて取得
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("id, name, description, price");

    if (dbError) {
      throw new Error(`DBエラー: ${dbError.message}`);
    }

    const productListString = dbProducts
      .map(p => `商品ID: ${p.id} | 商品名: ${p.name} | 説明: ${p.description} | 標準単価: ¥${p.price}`)
      .join("\n");

    const currentItemsString = currentItems.length > 0
      ? currentItems.map((item: any) => `- 商品ID: ${item.id} | 商品名: ${item.name} | 数量: ${item.quantity} | 単価: ¥${item.price}`).join("\n")
      : "現在、選択されている明細はありません（空っぽです）。";

    // 2. OpenAIを呼び出す（Structured Outputs で構造を完全固定）
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "estimate_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              status: { 
                type: "string", 
                enum: ["hearing", "final"],
                description: "要件定義に基くモード。まだ質問やヒアリングを続ける場合は 'hearing'、見積明細が完全に確定しこれ以上質問がない場合は 'final' にしてください。"
              },
              aiResponseText: { 
                type: "string", 
                description: "ユーザーへのチャット返答メッセージ。" 
              },
              selectedItems: {
                type: "array",
                description: "右側の見積プレビューに表示させるべき【すべての明細】の最新リスト。追加や変更の指示があったものだけでなく、既存の残すべき項目もすべて含めた最終的な配列を組み立ててください。",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "選んだ商品の商品ID" },
                    quantity: { type: "number", description: "その商品の数量（例：下層12ページなら 12）" }
                  },
                  required: ["id", "quantity"],
                  additionalProperties: false
                }
              }
            },
            required: ["status", "aiResponseText", "selectedItems"],
            additionalProperties: false
          }
        }
      },
      messages: [
        {
          role: "system",
          content: `
あなたはスマート見積システムの優秀なAI営業アシスタントです。
ユーザーとのチャットログ（会話履歴）をすべて読み込み、【商品マスター】のデータを基に、正確かつスピーディに見積明細を組み立ててください。

以下の【絶対厳守のルール】に従って思考し、データを生成してください。

---
【絶対厳守のルール】

1. 会話履歴（文脈）の完全把握・オウム返しの禁止：
   あなたには、最初から現在に至るまでの「すべての会話履歴」が渡されています。
   ユーザーがすでに過去のターンで答えた内容（例：「下層12ページ」「管理画面が必要」など）を、何度も繰り返し質問（オウム返し）することは絶対に厳禁です。
   ユーザーの回答をしっかりと記憶し、すでに判明した要件は確定情報として扱い、次のステップの質問に進んでください。

2. 右側の見積プレビューを絶対に「0円」のまま放置するな（暫定見積もりの即時提示）：
   「機能や要件が100%完璧に決まるまで、selectedItemsを空（0円）にして質問攻めにする」という最悪のUXを絶対に回避してください。
   ユーザーから1つでも具体的なキーワード（例：「12ページ」「WordPress」など）が出たら、たとえまだヒアリング中（status: "hearing"）であっても、あなたが先回りして該当する商品を selectedItems に放り込み、右側のプレビュー金額を即座に動かしてください。
   「ひとまず現時点で分かっている〇〇の条件で概算を出してみました！管理画面については〜〜」というように、金額を見せながらヒアリングを進めるのがプロの営業です。

3. データの差分更新：
   ユーザーからの新しい指示（追加・変更・削除）があった場合、これまでに積み上げてきた既存の見積明細を勝手に消去してはなりません。
   過去の明細をベースに、指示された部分だけを足し引き、あるいは数量を変更した「最終的な最新の全明細リスト」を selectedItems に詰め込んでください。

4. 数量（quantity）の厳格なマッピング：
   ユーザーが「下層ページ12ページ」のように具体的な数値を指定した場合、該当する項目の quantity には必ずその指定された数値（例：12）を入れてください。すべてを「1」にしてはなりません。
---

【登録されている商品マスター】
${productListString}

【現在の画面上の見積明細】
${currentItemsString}
`,
        },
        // 過去のすべてのラリー（履歴）をOpenAIに丸ごと流し込み
        ...chatMessages 
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return NextResponse.json({ message: "AIからの返答が空でした。" }, { status: 500 });
    }

    const aiParsedData = JSON.parse(content);

    // 見積明細データのマッピング（安全に商品名と単価をDBから再結合）
    const finalItems = aiParsedData.selectedItems.map((selected: { id: string; quantity: number }) => {
      const matchingProduct = dbProducts.find(p => p.id === selected.id);
      return {
        id: selected.id,
        name: matchingProduct ? matchingProduct.name : "不明な商品",
        quantity: Number(selected.quantity) || 1,
        price: matchingProduct ? matchingProduct.price : 0,
      };
    });

    return NextResponse.json({
      status: aiParsedData.status, 
      message: aiParsedData.aiResponseText,
      items: finalItems,
    });

  } catch (error: any) {
    console.error("AI見積もり処理でエラーが発生しました:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}