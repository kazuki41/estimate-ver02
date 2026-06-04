"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/supabase";

function ChatHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [messages, setMessages] = useState<any[]>([
    { id: 1, sender: "ai", text: "こんにちは! どのようなシステムをご希望ですか？実装したい機能や、追加・修正したい点などを教えてください。" }
  ]);
  const [inputText, setInputText] = useState("");
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const [aiStatus, setAiStatus] = useState<"hearing" | "final">("hearing");
  const [isSaving, setIsSaving] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  // 👥 顧客選択用の状態
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // 📄 内部的な管理用のステータス（UIからは見えなくなります）
  const [estimateStatus, setEstimateStatus] = useState<"draft" | "submitted">("draft");
  const [isOpenPDFModal, setIsOpenPDFModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("user");

  // 🛡️ 復元処理の重複防止ロック
  const hasRestored = useRef(false);

  // 画面起動時に顧客マスター一覧を読み込む
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        const data = await response.json();
        setCustomers(data);
        if (data && data.length > 0 && !editId) {
          setSelectedCustomerId(data[0].id);
        }
      } catch (error) {
        console.error("顧客マスターの読み込みに失敗しました", error);
      }
    };
    loadCustomers();
  }, [editId]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // 💡 データベースの profiles からこのユーザーの権限（role）を取得する
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserRole(profile.role); // 'admin' または 'user' が入る
        }
      }
    };
    fetchUser();
  }, []);

  // 過去データ復元ロジック
  useEffect(() => {
    if (editId && !hasRestored.current) {
      hasRestored.current = true;

      const loadPastEstimate = async () => {
        try {
          const response = await fetch(`/api/estimate/detail?id=${editId}`);
          const data = await response.json();

          if (data && data.estimate_items) {
            const restoredItems = data.estimate_items.map((item: any, idx: number) => ({
              id: Date.now() + idx,
              name: item.product_name,
              price: item.price,
              quantity: item.quantity
            }));

            setQuoteItems(restoredItems);
            setAiStatus("final");
            setIsChanged(false);

            if (data.customers?.id) {
              setSelectedCustomerId(data.customers.id);
            }
            if (data.status) {
              setEstimateStatus(data.status === "submitted" ? "submitted" : "draft");
            }

            setMessages(prev => [
              ...prev,
              {
                id: Date.now(),
                sender: "ai",
                text: `過去の見積もり（番号: ${editId.substring(0, 8)}...）の明細と顧客情報を復元しました！宛先を変更したい場合は、右側のプルダウンから再選択できます。内容を修正する場合はAIに続けてご指示ください。`
              }
            ]);

            router.replace("/chat");
          }
        } catch (error) {
          console.error("過去データの復元に失敗しました", error);
          alert("データの復元に失敗しました。");
          hasRestored.current = false;
        }
      };
      loadPastEstimate();
    }
  }, [editId, router]);

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
        body: JSON.stringify({
          message: userText,
          messages: [...messages.map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text
          })), { role: "user", content: userText }],
          currentItems: quoteItems,
        }),
      });

      const data = await response.json();

      setMessages(prev => [...prev, { id: Date.now(), sender: "ai", text: data.message }]);
      setQuoteItems(data.items || []);
      setAiStatus(data.status);
      setIsChanged(true);
    } catch (error) {
      console.error("通信エラーが発生しました", error);
    } finally {
      setIsTyping(false);
    }
  };

  // 見積もり保存処理
  const handleSaveEstimate = async () => {
    if (quoteItems.length === 0 || !isChanged || isSaving) return;
    if (!selectedCustomerId) {
      alert("顧客を選択してください。");
      return;
    }

    setIsSaving(true);
    try {
      const finalItems = quoteItems.map((item) => ({
        name: item.name,
        product_name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity)
      }));

      const response = await fetch("/api/estimate/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: finalItems,
          customerId: selectedCustomerId,
          companyInfoId: "60b94a95-140c-4a7f-a2c1-8d0d77001c1c",
          status: estimateStatus,
          userId: currentUserId
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("🎉 選択した顧客宛てに見積もりを正常に保存しました！");
        setIsChanged(false);
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

  const handleTriggerPrint = () => {
    window.print();
  };

  const currentCustomerName = customers.find(c => c.id === selectedCustomerId)?.company_name || "御中";

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans print:bg-white print:text-black">

      {/* 左側：チャットエリア */}
      <div className="w-1/2 flex flex-col border-r border-slate-700 print:hidden">
        <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
          <div>
            <h1 className="text-lg font-bold">AI見積もり相談チャット</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-400">ログイン中: demo さん</p>
              <Link href="/history" className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded transition">履歴一覧 ➔</Link>
              {/* 💡 管理者の時だけ「マスター管理」ボタンを出現させる！ */}
              {userRole === "admin" && (
                <Link href="/master" className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded transition">マスター管理 ⚙️</Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-800/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-700 text-slate-100 rounded-tl-none"}`}>{msg.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-700 text-slate-400 p-3 rounded-2xl rounded-tl-none text-xs animate-pulse">AIが自動見積もりを計算中...</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="例：管理画面を追加して / 金額を少し抑えて..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition">送信</button>
        </form>
      </div>

      {/* 右側：見積プレビューエリア */}
      <div className="w-1/2 flex flex-col bg-white text-slate-800 p-6 overflow-y-auto print:hidden">

        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">概算見積プレビュー</h2>
            <p className="text-xs text-slate-400 mt-1">チャットの要望に合わせてリアルタイムに更新されます</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsOpenPDFModal(true)}
              disabled={quoteItems.length === 0}
              className={`text-xs font-bold px-3 py-2 rounded border transition ${quoteItems.length > 0
                ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500 cursor-pointer shadow-sm"
                : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                }`}
            >
              📄 PDFプレビュー
            </button>

            <button
              onClick={handleSaveEstimate}
              disabled={quoteItems.length === 0 || !isChanged || isSaving}
              className={`text-xs font-medium px-3 py-2 rounded border transition ${quoteItems.length > 0 && isChanged && !isSaving
                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-500 cursor-pointer shadow-sm"
                : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                }`}
            >
              {isSaving ? "保存中..." : "見積もりを保存"}
            </button>
          </div>
        </div>

        {/* お見積り先選択 */}
        <div className="mb-4 bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            👥 お見積り先（宛先）の選択
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => {
              setSelectedCustomerId(e.target.value);
              setIsChanged(true);
            }}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 shadow-sm"
          >
            {customers.length === 0 ? (
              <option value="">顧客マスターが登録されていません</option>
            ) : (
              customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.company_name} {cust.customer_name ? `担当: ${cust.customer_name} 様` : ""}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="bg-slate-950 text-white p-6 rounded-xl mb-6 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">現在の合計金額（税別）</p>
          <p className="text-3xl font-black text-amber-400">¥{totalAmount.toLocaleString()}</p>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-700 mb-3">【お見積り内訳明細】</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {quoteItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 bg-slate-50">チャットで要望を伝えると、ここに見積内訳が表示されます</div>
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

      {/* 🖥️ 全画面PDFプレビューモーダル（ステータス表示を徹底排除） */}
      {isOpenPDFModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-start overflow-y-auto p-6 print:p-0 print:bg-white print:backdrop-blur-none print:static">

          {/* コントロールヘッダー（左側のトグルを削除してスッキリ化！） */}
          <div className="w-full max-w-3xl bg-slate-800 border border-slate-700 rounded-2xl p-4 flex justify-between items-center mb-6 shadow-2xl print:hidden">
            <div className="text-xs font-bold text-slate-300">
              📄 見積書レイアウト確認プレビュー
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleTriggerPrint} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow shadow-emerald-950/50">🖨️ 本番印刷 / PDF保存</button>
              <button onClick={() => setIsOpenPDFModal(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition">閉じる</button>
            </div>
          </div>

          {/* 📄 A4サイズ見積書（右上のバッジも完全削除！） */}
          <div className="w-full max-w-3xl bg-white text-black p-12 shadow-2xl rounded-none border border-slate-200 flex flex-col justify-between min-h-[1000px] font-sans print:shadow-none print:border-none print:p-0 print:max-w-full print:w-full">
            <div>
              {/* 見積書ヘッダー */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-widest text-slate-900">御 見 積 書</h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">見積番号: {editId ? editId.substring(0, 8) : "新規発行"}</p>
                </div>
              </div>

              {/* 宛先 & 発行元 */}
              <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
                <div className="space-y-2">
                  <p className="text-lg font-bold border-b border-slate-400 pb-1 text-slate-900">{currentCustomerName} 御中</p>
                  <p className="text-slate-600">下記の通り、概算の御見積申し上げます。</p>
                  <div className="pt-4">
                    <p className="text-xs text-slate-500">御見積合計金額（税別）</p>
                    <p className="text-2xl font-black text-slate-900 border-b-2 border-slate-800 pb-1 mt-1">¥{totalAmount.toLocaleString()}-</p>
                  </div>
                </div>
                <div className="text-right space-y-1 text-xs text-slate-700">
                  <p className="text-sm font-bold text-slate-900">スマート見積システム株式会社</p>
                  <p>〒100-0005 東京都千代田区丸の内1-1-1</p>
                  <p>TEL: 03-1234-5678</p>
                  <p className="pt-2 font-mono text-[10px] text-slate-500">インボイス番号: T1234567890123</p>
                  <p className="pt-2 text-slate-400">発行日: {new Date().toLocaleDateString("ja-JP")}</p>
                </div>
              </div>

              {/* 明細テーブル */}
              <table className="w-full text-left border-collapse text-xs mb-8">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800">
                    <th className="p-3 border border-slate-300">品名 / 項目</th>
                    <th className="p-3 text-center w-16 border border-slate-300">数量</th>
                    <th className="p-3 text-right w-28 border border-slate-300">単価</th>
                    <th className="p-3 text-right w-28 border border-slate-300">金額</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quoteItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 border border-slate-200 font-medium text-slate-900">{item.name}</td>
                      <td className="p-3 text-center border border-slate-200 text-slate-700">{item.quantity}</td>
                      <td className="p-3 text-right border border-slate-200 text-slate-700">¥{item.price.toLocaleString()}</td>
                      <td className="p-3 text-right border border-slate-200 font-bold text-slate-900">¥{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 備考・フッター */}
            <div className="border-t border-slate-300 pt-4 text-[10px] text-slate-400 flex justify-between items-center">
              <p>※本御見積書はAIによる概算算定ロジックを元に生成されたものです。</p>
              <p className="font-mono">Page 1 / 1</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen bg-slate-900 text-white font-sans items-center justify-center">Loading...</div>}>
      <ChatHome />
    </Suspense>
  );
}