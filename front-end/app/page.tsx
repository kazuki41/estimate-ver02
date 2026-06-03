"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase"; // 👈 Supabaseをインポート

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("ユーザー"); // 👈 ログインした人のメールを覚える
  const [summary, setSummary] = useState({
    totalCount: 0,
    draftCount: 0,
    sentCount: 0,
    totalSentAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  // ログイン中のユーザー情報と集計データを読み込む
  useEffect(() => {
    const initDashboard = async () => {
      try {
        // 👤 1. 現在ログインしているユーザー情報をSupabaseから取得
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          setUserEmail(user.email);
        }

        // 📊 2. ダッシュボードの集計データを取得
        const res = await fetch("/api/dashboard?_t=" + Date.now());
        const data = await res.json();
        setSummary(data);
      } catch (error) {
        console.error("ダッシュボードの初期化に失敗", error);
      } finally {
        setLoading(false);
      }
    };
    initDashboard();
  }, []);

 // 🏃‍♂️ ログアウト処理（超確実版）
 const handleLogout = async () => {
  const confirmLogout = window.confirm("🔐 システムからログアウトしますか？");
  if (!confirmLogout) return;

  await supabase.auth.signOut(); // Supabaseからサインアウト
  
  // 🧹 クッキーの抜け殻も残さないように、有効期限切れ（max-age=0）を叩き込んで完全消滅させます
  document.cookie = "sb-access-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
  
  // ログイン画面へ強制送還
  window.location.href = "/login";
};

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* 上部ヘッダー */}
        <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              見積管理DX ダッシュボード
            </h1>
            <p className="text-sm text-slate-400 mt-1">現在の営業状況と見積もり作成状況のサマリー</p>
          </div>
          {/* 👥 ここが進化！メールアドレスの表示と、クリックできるログアウトボタン */}
          <div className="flex items-center gap-3">
            <div className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-mono">
              👤 {userEmail}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/60 px-3 py-1.5 rounded-lg font-bold transition"
            >
              🚪 ログアウト
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-slate-400 animate-pulse text-sm">データを集計中...</div>
        ) : (
          <div className="space-y-8">
            
            {/* 📈 統計カード（4列レイアウト） */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800 border border-slate-700/70 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 text-4xl text-emerald-500/10 font-black select-none group-hover:scale-110 transition-transform">¥</div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">提出済 合計金額(税別)</p>
                <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">¥{summary.totalSentAmount.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 mt-1">顧客へ提示中の売上見込み総額</p>
              </div>
              <div className="bg-slate-800 border border-slate-700/70 p-6 rounded-2xl shadow-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">総見積作成件数</p>
                <p className="text-3xl font-black text-white mt-2 font-mono">{summary.totalCount} <span className="text-xs font-normal text-slate-400">件</span></p>
                <p className="text-[10px] text-slate-500 mt-2">システムで起票された全履歴</p>
              </div>
              <div className="bg-slate-800 border border-slate-700/70 p-6 rounded-2xl shadow-xl border-l-4 border-l-emerald-500">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">提出済み (sent)</p>
                <p className="text-3xl font-black text-white mt-2 font-mono">{summary.sentCount} <span className="text-xs font-normal text-slate-400">件</span></p>
                <p className="text-[10px] text-slate-500 mt-2">クライアントへアプローチ中の案件</p>
              </div>
              <div className="bg-slate-800 border border-slate-700/70 p-6 rounded-2xl shadow-xl border-l-4 border-l-amber-500">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">下書き (draft)</p>
                <p className="text-3xl font-black text-white mt-2 font-mono">{summary.draftCount} <span className="text-xs font-normal text-slate-400">件</span></p>
                <p className="text-[10px] text-slate-500 mt-2">チャットから保存された調整中の案件</p>
              </div>
            </div>

            {/* 🚀 メインアクション */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">主要機能へのアクセス</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/chat" className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-6 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 group flex flex-col justify-between min-h-[140px]">
                  <div>
                    <h3 className="font-black text-lg text-white flex items-center gap-2">AI自動見積チャット 🚀</h3>
                    <p className="text-xs text-blue-100/80 mt-1.5 leading-relaxed">対話形式で要件を伝えるだけで、AIがマスターから適正単価を引いて自動で見積明細を組み立てます。</p>
                  </div>
                  <span className="text-[11px] font-bold text-white bg-blue-800/60 px-2 py-1 rounded w-fit mt-4 group-hover:bg-blue-900/60 transition">チャットを始める →</span>
                </Link>
                <Link href="/history" className="bg-slate-800 hover:bg-slate-750 border border-slate-700 p-6 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 group flex flex-col justify-between min-h-[140px]">
                  <div>
                    <h3 className="font-bold text-base text-slate-200">保存済み見積もり履歴 📄</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">これまでに作成した見積もりの一括検索、ステータスの切り替え（下書き/提出済）、プロ仕様のPDF出力・印刷が行えます。</p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 bg-slate-700 px-2 py-1 rounded w-fit mt-4 group-hover:bg-slate-600 transition">履歴一覧を見る →</span>
                </Link>
                <Link href="/master" className="bg-slate-800 hover:bg-slate-750 border border-slate-700 p-6 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 group flex flex-col justify-between min-h-[140px]">
                  <div>
                    <h3 className="font-bold text-base text-slate-200">各種マスター管理 ⚙️</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">自社情報（インボイス番号等）、顧客情報、商品単価・課金タイプを管理。AIの知識ベースとも連動します。</p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 bg-slate-700 px-2 py-1 rounded w-fit mt-4 group-hover:bg-slate-600 transition">設定画面を開く →</span>
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}