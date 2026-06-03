"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "sent">("all");

  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [estimateDetail, setEstimateDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 一覧取得
  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/estimate/list");
      const data = await response.json();
      setEstimates(data);
    } catch (error) {
      console.error("履歴の取得に失敗しました", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenDetail = async (id: string, currentStatus: string) => {
    setSelectedEstimateId(id);
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/estimate/detail?id=${id}&_t=${Date.now()}`);
      const data = await response.json();
      const synchronizedData = {
        ...data,
        status: data.status || currentStatus
      };
      setEstimateDetail(synchronizedData);
    } catch (error) {
      console.error("詳細の取得に失敗しました", error);
      alert("詳細データの取得に失敗しました。");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedEstimateId(null);
    setEstimateDetail(null);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleUpdateStatus = async (newStatus: "draft" | "sent") => {
    if (!selectedEstimateId) return;
    try {
      const res = await fetch("/api/estimate/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedEstimateId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setEstimateDetail((prev: any) => ({ ...prev, status: newStatus }));
        await fetchHistory();
      }
    } catch (error) {
      alert("ステータスの更新に失敗しました。");
    }
  };

  // ★追加：見積もり削除の処理関数
  const handleDeleteEstimate = async () => {
    if (!selectedEstimateId) return;
    
    // 誤クリック防止用の確認ダイアログ
    const confirmDelete = window.confirm("⚠️ この見積もりデータを完全に削除しますか？\n（この操作は取り消せません）");
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/estimate/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedEstimateId })
      });
      const data = await res.json();
      if (data.success) {
        alert("🗑️ 見積もりを削除しました。");
        handleCloseDetail(); // ポップアップを閉じる
        await fetchHistory(); // 一覧リストを最新にする
      } else {
        alert("削除に失敗しました: " + data.message);
      }
    } catch (error) {
      alert("削除通信中にエラーが発生しました。");
    }
  };

  const handleGoToEdit = () => {
    if (!selectedEstimateId) return;
    router.push(`/chat?edit=${selectedEstimateId}`);
  };

  const filteredEstimates = estimates.filter((est: any) => {
    const matchesSearch = est.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || est.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-8 relative print:bg-white print:p-0">
      
      {/* 一覧画面 */}
      <div className="max-w-4xl mx-auto print:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">保存済み見積もり履歴</h1>
            <p className="text-sm text-slate-400 mt-1">作成した概算見積もりの検索・管理・PDF出力ができます</p>
          </div>
          <Link href="/chat" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            ← チャットに戻る
          </Link>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
          <div className="w-full md:w-72">
            <input type="text" placeholder="🔍 顧客名・会社名で検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex bg-slate-900 p-1 border border-slate-700 rounded-lg w-full md:w-auto">
            <button onClick={() => setStatusFilter("all")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === "all" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>すべて</button>
            <button onClick={() => setStatusFilter("draft")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === "draft" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>下書き (draft)</button>
            <button onClick={() => setStatusFilter("sent")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === "sent" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>提出済 (sent)</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">履歴を読み込み中...</div>
        ) : filteredEstimates.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-400">該当する見積もりが見つかりません。</div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-700/50 border-b border-slate-700 text-slate-300 font-medium">
                  <th className="p-4">作成日時</th>
                  <th className="p-4">顧客名 / 会社名</th>
                  <th className="p-4 text-center">ステータス</th>
                  <th className="p-4 text-center">内訳品目</th>
                  <th className="p-4 text-right">合計金額（税別）</th>
                  <th className="p-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredEstimates.map((est: any) => (
                  <tr key={est.id} onClick={() => handleOpenDetail(est.id, est.status)} className="hover:bg-slate-700/50 transition cursor-pointer">
                    <td className="p-4 text-slate-400 font-mono text-xs">{new Date(est.createdAt).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="p-4 text-slate-200 font-bold max-w-[180px] truncate">{est.companyName}</td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${est.status === "sent" ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60" : "bg-amber-950/40 text-amber-400 border-amber-800/60"}`}>{est.status}</span>
                    </td>
                    <td className="p-4 text-center text-slate-400 text-xs">{est.itemCount} 件</td>
                    <td className="p-4 text-right text-amber-400 font-bold text-base">¥{est.totalAmount.toLocaleString()}</td>
                    <td className="p-4 text-center"><button className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded border border-slate-600">内訳・PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ポップアップ */}
      {selectedEstimateId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          <div className="bg-white text-slate-800 rounded-xl w-full max-w-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150 print:shadow-none print:p-0 print:max-w-none print:text-black">
            
            {loadingDetail || !estimateDetail ? (
              <div className="py-12 text-center text-sm text-slate-400 animate-pulse">詳細データを読み込み中...</div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-6 border-b-2 border-slate-900 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-slate-900 tracking-wider print:text-3xl">御 見 積 書</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono border print:hidden ${estimateDetail.status === "sent" ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-amber-100 text-amber-700 border-amber-300"}`}>{estimateDetail.status === "sent" ? "提出済" : "下書き"}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-1">見積番号: {estimateDetail.id}</p>
                    <p className="text-xs text-slate-500 mt-0.5">発効日: {new Date(estimateDetail.created_at).toLocaleDateString("ja-JP")}</p>
                  </div>
                  <button onClick={handleCloseDetail} className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2 print:hidden">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-900 border-b border-slate-300 pb-1">{estimateDetail.customers?.company_name || "〇〇株式会社"} 御中</p>
                    <p className="text-xs text-slate-600">担当: {estimateDetail.customers?.customer_name || "ご担当者"} 様</p>
                    <p className="text-xs text-slate-500 font-light whitespace-pre-wrap">{estimateDetail.customers?.address}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-slate-900">{estimateDetail.company_info?.name || "自社名未設定"}</p>
                    <p className="text-xs text-slate-600">登録番号: {estimateDetail.company_info?.invoice_number || "T-------------"}</p>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-lg mb-6 flex justify-between items-center print:bg-slate-100 print:text-black print:border print:border-slate-300">
                  <span className="text-xs text-slate-400 print:text-slate-600 font-medium">御見積合計金額（税込）</span>
                  <span className="text-2xl font-black text-amber-400 print:text-slate-900">
                    ¥{((estimateDetail.estimate_items || []).reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) * (1 + (estimateDetail.tax_rate || 0))).toLocaleString()}-
                  </span>
                </div>

                <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                        <th className="p-3">品名 / 項目</th>
                        <th className="p-3 text-center w-16">数量</th>
                        <th className="p-3 text-right w-24">単価</th>
                        <th className="p-3 text-right w-24">金額</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(estimateDetail.estimate_items || []).map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-900 font-medium">{item.product_name}</td>
                          <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                          <td className="p-3 text-right text-slate-600">¥{item.price.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-900 font-semibold">¥{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mb-6">
                  <div className="w-48 text-xs space-y-1.5 border-t-2 border-slate-300 pt-2 font-medium">
                    <div className="flex justify-between text-slate-600"><span>税抜小計:</span><span>¥{(estimateDetail.estimate_items || []).reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toLocaleString()}</span></div>
                    <div className="flex justify-between text-slate-600"><span>消費税 (10%対象):</span><span>¥{((estimateDetail.estimate_items || []).reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) * (estimateDetail.tax_rate || 0)).toLocaleString()}</span></div>
                  </div>
                </div>

                {/* ボタンエリア */}
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-200 print:hidden flex-wrap gap-2">
                  <div className="flex gap-2">
                    <button onClick={handlePrintPDF} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm">🖨️ PDF保存 / 印刷</button>
                    <button onClick={handleGoToEdit} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1">✏️ この見積もりを編集する</button>
                  </div>

                  <div className="flex gap-2 items-center">
                    {/* ★追加：ゴミ箱マークの削除ボタン */}
                    <button onClick={handleDeleteEstimate} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg border border-red-200 font-medium transition">
                      🗑️ 削除
                    </button>

                    {estimateDetail.status === "sent" ? (
                      <button onClick={() => handleUpdateStatus("draft")} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg border border-slate-300 font-medium">↩️ 下書きに戻す</button>
                    ) : (
                      <button onClick={() => handleUpdateStatus("sent")} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg border border-slate-300 font-medium">💼 提出済みに変更</button>
                    )}
                    <button onClick={handleCloseDetail} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition">閉じる</button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}