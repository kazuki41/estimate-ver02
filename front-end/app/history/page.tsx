"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function HistoryPage() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 選択中の見積もりの作成日時や合計金額を一時保存する状態
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);

  // 最初の一覧取得
  useEffect(() => {
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
    fetchHistory();
  }, []);

  // 行がクリックされたとき
  const handleOpenDetail = async (est: any) => {
    setSelectedEstimateId(est.id);
    setSelectedEstimate(est);
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/estimate/detail?id=${est.id}`);
      const data = await response.json();
      setDetailItems(data);
    } catch (error) {
      console.error("詳細の取得に失敗しました", error);
      alert("詳細データの取得に失敗しました。");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedEstimateId(null);
    setSelectedEstimate(null);
    setDetailItems([]);
  };

  // ★追加：PDF出力を実行する関数
  const handlePrintPDF = () => {
    // ブラウザ標準の印刷画面（PDF保存画面）を呼び出すだけ！
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-8 relative print:bg-white print:p-0">
      
      {/* 💻 通常の画面（印刷時は print:hidden で丸ごと消し去ります） */}
      <div className="max-w-4xl mx-auto print:hidden">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">保存済み見積もり履歴</h1>
            <p className="text-sm text-slate-400 mt-1">一覧の行をクリックすると、詳しい内訳を確認・PDFダウンロードできます</p>
          </div>
          <Link href="/" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            ← チャットに戻る
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">履歴を読み込み中...</div>
        ) : estimates.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-400">
            保存された見積もりはまだありません。
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-700/50 border-b border-slate-700 text-slate-300 font-medium">
                  <th className="p-4">作成日時</th>
                  <th className="p-4">見積もりID (頭文字)</th>
                  <th className="p-4 text-center">内訳品目数</th>
                  <th className="p-4 text-right">合計金額（税別）</th>
                  <th className="p-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {estimates.map((est) => (
                  <tr 
                    key={est.id} 
                    onClick={() => handleOpenDetail(est)}
                    className="hover:bg-slate-700/50 transition cursor-pointer"
                  >
                    <td className="p-4 text-slate-300 font-mono">
                      {new Date(est.createdAt).toLocaleString("ja-JP", {
                        month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-xs">{est.id.substring(0, 8)}...</td>
                    <td className="p-4 text-center text-slate-300">{est.itemCount} 件</td>
                    <td className="p-4 text-right text-amber-400 font-bold text-base">¥{est.totalAmount.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <button className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded border border-slate-600">
                        内訳・PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 📄 詳細＆PDF印刷用のポップアップ（モーダル） */}
      {/* ========================================== */}
      {selectedEstimateId && (
        // 印刷時は背景の黒透過を消し、画面の一番上に固定する
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          {/* 印刷時は影を消し、文字を黒、幅をA4いっぱいに広げる */}
          <div className="bg-white text-slate-800 rounded-xl w-full max-w-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 print:shadow-none print:p-0 print:max-w-none print:text-black">
            
            {/* 見積書のヘッダー */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 print:text-2xl">御見積書（概算）</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">見積番号: {selectedEstimateId}</p>
                {selectedEstimate && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    発効日: {new Date(selectedEstimate.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                )}
              </div>
              {/* ✕ボタンは印刷時は消す */}
              <button onClick={handleCloseDetail} className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2 print:hidden">✕</button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-sm text-slate-400 animate-pulse">詳細データを読み込み中...</div>
            ) : (
              <div>
                {/* 印刷用に綺麗に整えた合計金額欄 */}
                <div className="bg-slate-900 text-white p-4 rounded-lg mb-6 flex justify-between items-center print:bg-slate-100 print:text-black print:border print:border-slate-300">
                  <span className="text-xs text-slate-400 print:text-slate-600 font-medium">御見積合計金額（税別）</span>
                  <span className="text-2xl font-black text-amber-400 print:text-slate-900">
                    ¥{selectedEstimate?.totalAmount.toLocaleString()}-
                  </span>
                </div>

                {/* 明細テーブル */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-6 print:border-slate-300">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium print:bg-slate-100 print:border-slate-300">
                        <th className="p-3">品名 / 項目</th>
                        <th className="p-3 text-center w-16">数量</th>
                        <th className="p-3 text-right w-24">単価</th>
                        <th className="p-3 text-right w-24">金額</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                      {detailItems.map((item) => (
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

                {/* 下部のボタンエリア（印刷時は完全に print:hidden で非表示にする） */}
                <div className="flex justify-between items-center mt-6 pt-3 border-t border-slate-100 print:hidden">
                  {/* ★主役のPDF出力ボタン */}
                  <button 
                    onClick={handlePrintPDF}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1 shadow-sm"
                  >
                    🖨️ PDFとして保存 / 印刷
                  </button>
                  
                  <button 
                    onClick={handleCloseDetail}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}