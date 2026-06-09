"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/supabase";

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState("kazuki441141@gmail.com");
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("user");

  // ログインユーザーのメールアドレスを安全に取得
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
    loadDashboardStats();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // データベースの profiles からこのユーザーの権限（role）を取得する
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

  // リアルタイム集計のために最新の全見積もりデータを取得
  const loadDashboardStats = async () => {
    try {
      const res = await fetch("/api/estimate/list?_t=" + Date.now());
      const data = await res.json();
      setEstimates(data || []);
    } catch (error) {
      console.error("ダッシュボードデータの取得に失敗しました", error);
    } finally {
      setLoading(false);
    }
  };

  //  ログアウト処理
  const handleLogout = async () => {
    const confirmLogout = window.confirm("🔐 システムからログアウトしますか？");
    if (!confirmLogout) return;

    await supabase.auth.signOut();
    document.cookie = "sb-access-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
    window.location.href = "/login";
  };

  // 1. 総作成件数
  const totalCreatedCount = estimates.length;

  // 2. 提出済み(submitted)のデータだけを抽出
  const submittedEstimates = estimates.filter(e => e.status === "submitted");
  const totalSubmittedCount = submittedEstimates.length;

  // 3. 下書き(draft)のデータだけを抽出
  const draftEstimates = estimates.filter(e => e.status !== "submitted"); // statusが未設定、またはdraftのもの
  const totalDraftCount = draftEstimates.length;

  // 4. 提出済みの見積もりだけの「売上見込み総額」を計算
  const totalSubmittedAmount = submittedEstimates.reduce((sum, est) => {
    const estimateTotal = est.estimate_items?.reduce((s: number, item: any) => s + (item.price * item.quantity), 0) || 0;
    return sum + estimateTotal;
  }, 0);


  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ヘッダーセクション */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-black text-cyan-400 tracking-tight">見積管理DX ダッシュボード</h1>
            <p className="text-sm text-slate-400 mt-1">現在の営業状況と見積もり作成状況のサマリー</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono text-slate-300 shadow">
              👤 {userEmail}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow"
            >
              🚪 ログアウト
            </button>
          </div>
        </div>

        {/* 4つのアナリティクスカード*/}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

          {/* カード1: 提出済 合計金額 */}
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-400 tracking-wider">提出済 合計金額(税別)</p>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-3">
              ¥{loading ? "..." : totalSubmittedAmount.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-2">顧客へ提示中の売上見込み総額</p>
            <span className="absolute right-4 bottom-4 text-slate-700/20 font-black text-4xl pointer-events-none select-none">¥</span>
          </div>

          {/* カード2: 総見積作成件数 */}
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
            <p className="text-xs font-bold text-slate-400 tracking-wider">総見積作成件数</p>
            <p className="text-2xl font-black text-white font-mono mt-3">
              {loading ? "..." : totalCreatedCount} <span className="text-xs text-slate-500 font-normal">件</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-2">システムで起票された全履歴</p>
          </div>

          {/* カード3: 提出済み(SENT)件数 */}
          <div className="bg-slate-800 border border-slate-700/60 border-l-4 border-l-emerald-500 rounded-2xl p-6 shadow-xl">
            <p className="text-xs font-bold text-emerald-400 tracking-wider">提出済み (SENT)</p>
            <p className="text-2xl font-black text-white font-mono mt-3">
              {loading ? "..." : totalSubmittedCount} <span className="text-xs text-slate-500 font-normal">件</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-2">クライアントへアプローチ中の案件</p>
          </div>

          {/* カード4: 下書き(DRAFT)件数 */}
          <div className="bg-slate-800 border border-slate-700/60 border-l-4 border-l-amber-500 rounded-2xl p-6 shadow-xl">
            <p className="text-xs font-bold text-amber-400 tracking-wider">下書き (DRAFT)</p>
            <p className="text-2xl font-black text-white font-mono mt-3">
              {loading ? "..." : totalDraftCount} <span className="text-xs text-slate-500 font-normal">件</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-2">チャットから保存された調整中の案件</p>
          </div>

        </div>

        {/* 主要機能へのアクセス（メニュータイル） */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 shadow-inner space-y-4">
          <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase pl-1">主要機能へのアクセス</h2>

          <div className="flex flex-col md:flex-row gap-6 mx-auto max-w-6xl w-full">

            {/* タイル1: AI自動見積チャット */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500 rounded-2xl p-6 shadow-xl flex flex-col flex-1 justify-between h-48 group hover:from-blue-500 hover:to-blue-600 transition duration-300">
              <div className="space-y-2">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">AI自動見積チャット 🚀</h3>
                <p className="text-xs text-blue-100 leading-relaxed">対話形式で要件を伝えるだけで、AIがマスターから適正単価を引いて自動で見積明細を組み立てます。</p>
              </div>
              <Link href="/chat" className="inline-block text-center bg-slate-950/40 hover:bg-slate-950/60 text-white text-xs font-bold py-2.5 rounded-xl transition border border-white/10">
                チャットを始める ➔
              </Link>
            </div>

            {/* タイル2: 保存済み見積もり履歴 */}
            <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col flex-1 justify-between h-48 hover:border-slate-600 transition duration-300">
              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight text-slate-200">保存済み見積もり履歴 📄</h3>
                <p className="text-xs text-slate-400 leading-relaxed">これまでに作成した見積もりの一括検索、ステータスの切り替え（下書き/提出済）、プロ仕様のPDF出力・印刷が行えます。</p>
              </div>
              <Link href="/history" className="inline-block text-center bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold py-2.5 rounded-xl transition border border-slate-600">
                履歴一覧を見る ➔
              </Link>
            </div>

            {/* タイル3: 各種マスター管理 */}
            {userRole === "admin" && (
              <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col flex-1 justify-between h-48 hover:border-slate-600 transition duration-300">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold tracking-tight text-slate-200">各種マスター管理 ⚙️</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">自社情報（インボイス番号等）、顧客情報、商品単価・課金タイプを管理。AIの知識ベースとも連動します。</p>
                </div>
                <Link href="/master" className="inline-block text-center bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold py-2.5 rounded-xl transition border border-slate-600">
                  設定画面を開く ➔
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}