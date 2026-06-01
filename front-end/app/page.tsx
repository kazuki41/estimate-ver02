"use client";

import React, { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "こんにちは！どのようなシステムをご希望ですか？実装したい機能や、追加・修正したい点などを教えてください。" }
  ]);
  const [inputText, setInputText] = useState("");
  const [quoteItems, setQuoteItems] = useState([
    { id: "1", name: "システム基本設計", quantity: 1, price: 150000 },
    { id: "2", name: "ユーザー認証・ログイン機能", quantity: 1, price: 80000 },
    { id: "3", name: "レスポンシブUI（スマホ対応）", quantity: 1, price: 50000 },
  ]);
  const [isTyping, setIsTyping] = useState(false); // AIが考えている最中かどうかのハタ

  const totalAmount = quoteItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    
    const userText = inputText;
    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text: userText }]);
    setInputText("");
    setIsTyping(true); // 「考えています」の状態にする

    try {
      // さっき作った裏方の部屋（/api/chat）にデータを送る
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      
      const data = await response.json();

      // 裏方から戻ってきたデータで画面を書き換える
      setMessages(prev => [...prev, { id: Date.now(), sender: "ai", text: data.message }]);
      setQuoteItems(data.items);
    } catch (error) {
      console.error("通信エラーが発生しました", error);
    } finally {
      setIsTyping(false); // 元に戻す
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans">
      {/* 左側：チャットエリア */}
      <div className="w-1/2 flex flex-col border-r border-slate-700">
        <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
          <div>
            <h1 className="text-lg font-bold">AI見積もり相談チャット</h1>
            <p className="text-xs text-slate-400">ログイン中: demo さん</p>
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
        </div>

        <div className="bg-slate-950 text-white p-6 rounded-xl mb-6 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">現在の合計金額（税別）</p>
          <p className="text-3xl font-black text-amber-400">¥{totalAmount.toLocaleString()}</p>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-700 mb-3">【お見積り内訳明細】</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
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
          </div>
        </div>
      </div>
    </div>
  );
}