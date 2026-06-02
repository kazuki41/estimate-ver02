import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = body.message;

    // 1. Supabaseから商品マスターをすべて取得
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("id, name, description, price");

    if (dbError) {
      throw new Error(`DBエラー: ${dbError.message}`);
    }

    const productListString = dbProducts
      .map(p => `ID: ${p.id} | 商品名: ${p.name} | 説明: ${p.description} | 単価: ¥${p.price}`)
      .join("\n");

    // 2. OpenAIを呼び出す
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `あなたは爆速で概算見積もりを出す、話の早いAIアシスタントです。

ユーザーからざっくりした要望が届いたら、質問で返さず、現在の【商品マスター】の中から「これとこれが大体必要になりそうだな」とあなたが先回りして推測し、その場で概算見積もりを完成させてください。

絶対に質問をして会話を長引かせないでください。
ステータス（status）は、今回必ず「"final"」にしてください。

必ず以下の指定フォーマットのJSONで返答してください。

【返却するJSONフォーマット】
{
  "status": "final", 
  "aiResponseText": "ユーザーへのメッセージ（例：ご要望から、ひとまずこちらの概算見積もりを作成しました！〇〇の機能も含めています。）",
  "selectedItems": [
    { "id": "選んだ商品のID", "quantity": 1 }
  ]
}

【商品マスター】
${productListString}

【重要なルール】
1. 質問は一切禁止です。
2. ユーザーの言葉が「アプリ作りたい」の1言だけでも、基本パッケージと、必要そうなオプション（管理画面など）をあなたの判断で勝手に選んで、すぐに金額を出してください。
3. status は常に "final" に固定してください。`,
        },
        { role: "user", content: userMessage },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return NextResponse.json({ message: "AIからの返答が空でした。" }, { status: 500 });
    }

    const aiParsedData = JSON.parse(content);

    // 3. 見積明細データの組み立て
    const finalItems = aiParsedData.selectedItems.map((selected: { id: string; quantity: number }) => {
      const matchingProduct = dbProducts.find(p => p.id === selected.id);
      return {
        id: selected.id,
        name: matchingProduct ? matchingProduct.name : "不明な商品",
        quantity: selected.quantity,
        price: matchingProduct ? matchingProduct.price : 0,
      };
    });

    return NextResponse.json({
      status: "final", // 常に確定状態としてフロントに返す
      message: aiParsedData.aiResponseText,
      items: finalItems,
    });

  } catch (error: any) {
    console.error("AI見積もり処理でエラーが発生しました:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}