"use client";

import React, { useState } from "react";

export default function Home() {
  // チャットのメッセージ履歴を管理する状態（ダミーデータ）
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "こんにちは！どのようなシステムをご希望ですか？実装したい機能や、追加・修正したい点などを教えてください。" }
  ]);
  const [inputText, setInputText] = useState("");

  // 見積明細のダミーデータ
  const [quoteItems, setQuoteItems] = useState([
    { id: "1", name: "システム基本設計", quantity: 1, price: 150000 },
    { id: "2", name: "ユーザー認証・ログイン機能", quantity: 1, price: 80000 },
    { id: "3", name: "レスポンシブUI（スマホ対応）", quantity: 1, price: 50000 },
  ]);

  // 合計金額の計算
  const totalAmount = quoteItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    // ユーザーのメッセージを追加
    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text: inputText }]);
    setInputText("");

    // (※将来ここにAIの返答ロジックが入ります)
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans">
      
      {/* 左側：AI見積もり相談チャットエリア */}
      <div className="w-1/2 flex flex-col border-r border-slate-700">
        {/* ヘッダー */}
        <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
          <div>
            <h1 className="text-lg font-bold">AI見積もり相談チャット</h1>
            <p className="text-xs text-slate-400">ログイン中: demo さん</p>
          </div>
          <button className="bg-slate-700 hover:bg-slate-600 text-sm px-3 py-1.5 rounded-md transition">
            ログアウト
          </button>
        </div>

        {/* チャットタイムライン */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-800/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-700 text-slate-100 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* 入力フォーム */}
        <form onSubmit={handleSend} className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="例：会員登録機能を追加して / 金額を少し抑えて..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
          >
            送信
          </button>
        </form>
      </div>

      {/* 右側：概算見積プレビューエリア */}
      <div className="w-1/2 flex flex-col bg-white text-slate-800 p-6 overflow-y-auto">
        {/* 上部アクションバー */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">概算見積プレビュー</h2>
            <p className="text-xs text-slate-400 mt-1">チャットの要望に合わせてリアルタイムに更新されます</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-400 text-xs font-medium px-3 py-2 rounded border border-slate-200 cursor-not-allowed">
              見積もりを保存
            </button>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-400 text-xs font-medium px-3 py-2 rounded border border-slate-200 cursor-not-allowed">
              PDF出力
            </button>
          </div>
        </div>

        {/* 総額表示カード */}
        <div className="bg-slate-950 text-white p-6 rounded-xl mb-6 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">現在の合計金額（税別）</p>
          <p className="text-3xl font-black text-amber-400">
            ¥{totalAmount.toLocaleString()} <span className="text-sm font-normal text-white"></span>
          </p>
        </div>

        {/* 見積内細明細 */}
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
                    <td className="p-3 text-right text-slate-900 font-semibold">
                      ¥{(item.price * item.quantity).toLocaleString()}
                    </td>
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