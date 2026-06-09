"use client";

import React, { useState } from "react";
import { supabase } from "@/app/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const convertToJapaneseError = (englishMessage: string) => {
    if (!englishMessage) return "処理に失敗しました。もう一度お試しください。";
    if (englishMessage.includes("Email not confirmed")) return "✉️ メールアドレスの確認が完了していません。";
    if (englishMessage.includes("Invalid login credentials")) return "🔒 メールアドレスまたはパスワードが正しくありません。";
    if (englishMessage.includes("User already registered")) return "👤 このメールアドレスは既に登録されています。";
    if (englishMessage.includes("Password should be at least 6 characters")) return "⚠️ パスワードは6文字以上で入力してください。";
    if (englishMessage.includes("Unable to validate email address")) return "📮 正しいメールアドレスの形式で入力してください。";
    if (englishMessage.includes("Error sending confirmation email") || englishMessage.includes("rate limit")) {
      return "⏳ セキュリティ制限がかかっています。少し時間を置くか、Supabaseの設定を確認してください。";
    }
    return englishMessage;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      if (isRegister) {
        // 新規アカウント登録
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("🎉 アカウントを作成しました！ログインモードに切り替えてログインしてください。");
      } else {
        // 既存ユーザーのログイン
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
         // ミドルウェア（検問）
        if (data.session) {
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=Lax; Secure`;
        }
        
        window.location.href = "/";
      }
    } catch (error: any) {
      console.error("認証エラー:", error);
      setMessage(`❌ ${convertToJapaneseError(error.message)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md p-8 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-black italic tracking-tighter text-blue-500">スマート見積システム</h1>
          <h2 className="text-2xl font-bold tracking-tight">{isRegister ? "新規アカウント作成" : "システムにログイン"}</h2>
          <p className="text-xs text-slate-400">{isRegister ? "必要情報を入力して営業アカウントを発行します" : "登録済みのメールアドレスとパスワードを入力してください"}</p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-xs leading-relaxed border ${message.startsWith("❌") ? "bg-red-950/40 text-red-400 border-red-900/50" : "bg-emerald-950/40 text-emerald-400 border-emerald-900/50"}`}>{message}</div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@company.com" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">パスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-blue-900/30 disabled:bg-slate-700">{loading ? "処理中..." : isRegister ? "✨ アカウントを作成する" : "🔐 ログインする"}</button>
        </form>

        <div className="text-center pt-2 border-t border-slate-700/60 text-xs">
          <button onClick={() => { setIsRegister(!isRegister); setMessage(""); }} className="text-blue-400 hover:text-blue-300 font-medium transition">{isRegister ? "既にアカウントをお持ちですか？ ログインはこちら" : "初めてのご利用ですか？ 新規アカウント登録はこちら"}</button>
        </div>
      </div>
    </div>
  );
}