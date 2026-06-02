"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "こんにちは！どのようなシステムをご希望ですか？実装したい機能や、追加・修正したい点などを教えてください。" }
  ]);
  const [inputText, setInputText] = useState("");
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // ★追加：AIが「ヒアリング中(hearing)」か「確定(final)」かを覚える状態
  const [aiStatus, setAiStatus] = useState<"hearing" | "final">("hearing");
  const [isSaving, setIsSaving] = useState(false); // 保存中のクルクル管理

  const totalAmount = quoteItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userText = inputText;
    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text: userText }]);
    setInputText("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();

      setMessages(prev => [...prev, { id: Date.now(), sender: "ai", text: data.message }]);
      setQuoteItems(data.items);
      setAiStatus(data.status); // ★AIのステータス（hearingかfinal）を画面に反映
    } catch (error) {
      console.error("通信エラーが発生しました", error);
    } finally {
      setIsTyping(false);
    }
  };

  // ★追加：見積もりを保存するボタンが押された時の処理
  const handleSaveEstimate = async () => {
    if (quoteItems.length === 0 || aiStatus !== "final" || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/estimate/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: quoteItems }),
      });

      const data = await response.json();
      if (data.success) {
        alert("🎉 見積もりの保存に成功しました！Supabaseを確認してみてください！");
      } else {
        alert("保存に失敗しました: " + data.message);
      }
    } catch (error) {
      alert("通信エラーが発生しました。");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans">
      {/* 左側：チャットエリア */}
      <div className="w-1/2 flex flex-col border-r border-slate-700">
        <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
          <div>
            <h1 className="text-lg font-bold">AI見積もり相談チャット</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-400">ログイン中: demo さん</p>
              <Link href="/history" className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded transition">
                履歴一覧 ➔
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-800/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-700 text-slate-100 rounded-tl-none"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-700 text-slate-400 p-3 rounded-2xl rounded-tl-none text-xs animate-pulse">
                AIが自動見積もりを計算中...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="例：管理画面を追加して / 金額を少し抑えて..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition">
            送信
          </button>
        </form>
      </div>

      {/* 右側：見積プレビューエリア */}
      <div className="w-1/2 flex flex-col bg-white text-slate-800 p-6 overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">概算見積プレビュー</h2>
            <p className="text-xs text-slate-400 mt-1">チャットの要望に合わせてリアルタイムに更新されます</p>
          </div>
          <div className="flex gap-2">
            {/* ★改造：「final」状態の時だけ青く光って押せるボタンに変身 */}
            <button
              onClick={handleSaveEstimate}
              disabled={aiStatus !== "final" || isSaving}
              className={`text-xs font-medium px-3 py-2 rounded border transition ${aiStatus === "final"
                  ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-500 cursor-pointer shadow-sm"
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                }`}
            >
              {isSaving ? "保存中..." : "見積もりを保存"}
            </button>
          </div>
        </div>

        <div className="bg-slate-950 text-white p-6 rounded-xl mb-6 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">現在の合計金額（税別）</p>
          <p className="text-3xl font-black text-amber-400">¥{totalAmount.toLocaleString()}</p>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-700 mb-3">【お見積り内訳明細】</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {quoteItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 bg-slate-50">
                チャットで要望を伝えると、ここに見積内訳が表示されます
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <th className="p-3">品名 / 項目</th>
                    <th className="p-3 text-center w-16">数量</th>
                    <th className="p-3 text-right w-28">単価</th>
                    <th className="p-3 text-right w-28">金額</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quoteItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-900 font-medium">{item.name}</td>
                      <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="p-3 text-right text-slate-600">¥{item.price.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-900 font-semibold">¥{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}