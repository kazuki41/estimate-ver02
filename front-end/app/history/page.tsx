"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/estimate/list?_t=" + Date.now());
      const data = await res.json();
      setEstimates(data || []);
    } catch (error) {
      console.error("履歴の取得に失敗しました", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 ステータス切り替え処理（デバッグ強化版）
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "submitted" ? "draft" : "submitted";

    try {
      // 画面上の表示を先制してサッと切り替える
      setEstimates(prev =>
        prev.map(est => est.id === id ? { ...est, status: nextStatus } : est)
      );

      const res = await fetch("/api/estimate/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus })
      });
      const data = await res.json();

      // 💡 【ここが進化】もし失敗したら、Supabaseから届いた生のエラー文をポップアップに出します！
      if (!data.success) {
        alert(`❌ ステータスの更新に失敗しました。\n【エラー理由】: ${data.message || "原因不明のAPIエラー"}`);
        await loadHistory(); // 元の状態に戻す
      }
    } catch (error: any) {
      alert(`❌ 通信エラーが発生しました。\n【詳細】: ${error.message}`);
      await loadHistory();
    }
  };

  const handleBulkDelete = async () => {
    if (checkedIds.length === 0) return;
    const confirmDelete = window.confirm(`⚠️ 選択された ${checkedIds.length} 件の見積もり履歴を完全に削除しますか？`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/estimate/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: checkedIds })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🗑️ ${data.count} 件の見積もり履歴を削除しました。`);
        setCheckedIds([]);
        await loadHistory();
      }
    } catch (error) {
      alert("削除中にエラーが発生しました。");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCheck = (id: string) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleAllCheck = () => {
    if (checkedIds.length === estimates.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(estimates.map(e => e.id));
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/chat?edit=${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-8">
      <div className="max-w-5xl mx-auto">

        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight">保存済み見積もり履歴</h1>
            <p className="text-sm text-slate-400 mt-1">一覧から直接ステータスを切り替えることができます</p>
          </div>
          <div>
            <Link href="/chat" className="mr-[20px] bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition border border-slate-700/80 shadow">
              チャットに戻る
            </Link>
            <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition border border-slate-700/80 shadow">
              ダッシュボードに戻る
            </Link>
          </div>
        </div>

        {/* 操作パネル */}
        <div className="bg-slate-800 border border-slate-700/70 rounded-2xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={estimates.length > 0 && checkedIds.length === estimates.length} onChange={handleAllCheck} className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
            <span className="text-xs font-bold text-slate-300">すべて選択 ({checkedIds.length}件選択中)</span>
            {checkedIds.length > 0 && (
              <button onClick={handleBulkDelete} disabled={isDeleting} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-900/60 text-xs font-bold px-3 py-1.5 rounded-lg transition">
                {isDeleting ? "削除中..." : "選択した見積もりを削除 🗑️"}
              </button>
            )}
          </div>
          <div className="text-[11px] text-slate-400">計 <span className="font-mono font-bold text-white text-sm">{estimates.length}</span> 件の見積書</div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-slate-400 animate-pulse text-sm">履歴データを読み込み中...</div>
        ) : estimates.length === 0 ? (
          <div className="text-center py-24 bg-slate-800/40 border border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">見積もり履歴はまだありません。</p>
          </div>
        ) : (
          /* 📋 履歴カードリスト */
          <div className="space-y-3">
            {estimates.map((est) => {
              const total = est.estimate_items?.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) || 0;
              const isChecked = checkedIds.includes(est.id);
              const currentStatus = est.status === "submitted" ? "submitted" : "draft";

              return (
                <div key={est.id} className={`border rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 transition ${isChecked ? "bg-blue-950/20 border-blue-500/50 shadow-lg" : "bg-slate-800 border-slate-700/60 hover:border-slate-600"}`}>

                  {/* 左側：チェック + 顧客情報 */}
                  <div className="flex items-start gap-4 max-w-xl">
                    <input type="checkbox" checked={isChecked} onChange={() => handleCheck(est.id)} className="w-4 h-4 rounded accent-blue-500 mt-1 cursor-pointer flex-shrink-0" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ID: {est.id.substring(0, 8)}...</span>
                        <span className="text-[11px] text-slate-400 font-medium">📅 {new Date(est.created_at).toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                      <h3 className="font-bold text-base text-white">{est.customers?.company_name || "宛先未設定"}</h3>
                      <p className="text-xs text-slate-500 truncate max-w-md pt-0.5">📦 内訳: {est.estimate_items?.map((i: any) => `${i.product_name}×${i.quantity}`).join(", ") || "なし"}</p>
                    </div>
                  </div>

                  {/* 右側 */}
                  <div className="flex items-center gap-6 ml-auto sm:ml-0 flex-wrap">

                    {/* ステータス切り替えトグル */}
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ステータス</span>
                      <button
                        onClick={() => handleToggleStatus(est.id, currentStatus)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shadow-sm ${currentStatus === "submitted"
                            ? "bg-blue-600/20 text-blue-400 border-blue-900/60 hover:bg-blue-600/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-900/40 hover:bg-amber-500/20"
                          }`}
                      >
                        {currentStatus === "submitted" ? "🚀 提出済み (クリックで下書きへ)" : "📝 下書き (クリックで提出済みへ)"}
                      </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">見積合計(税別)</p>
                      <p className="text-xl font-black text-amber-400 font-mono mt-0.5">¥{total.toLocaleString()}</p>
                    </div>

                    <button onClick={() => handleEdit(est.id)} className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-blue-400 text-xs font-bold px-3.5 py-2 rounded-xl transition">
                      修正・再編集 ➔
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}