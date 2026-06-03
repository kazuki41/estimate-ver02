"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function MasterPage() {
  const [activeTab, setActiveTab] = useState<"company" | "customer" | "product">("company");

  // 🏢 自社情報用の状態
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  
  // 👥 顧客マスター用の状態
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [custCompanyName, setCustCompanyName] = useState("");
  const [custCustomerName, setCustCustomerName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custTel, setCustTel] = useState("");

  // 📦 商品マスター用の状態（★フル項目へ拡張）
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodDescription, setProdDescription] = useState(""); // ★追加
  const [prodCategory, setProdCategory] = useState("");       // ★追加
  const [prodPrice, setProdPrice] = useState("");
  const [prodUnit, setProdUnit] = useState("");               // ★追加
  const [prodBillingType, setProdBillingType] = useState("one-time"); // ★追加

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 初期データの読み込み
  useEffect(() => {
    const loadAllMasters = async () => {
      try {
        const compRes = await fetch("/api/company");
        const compData = await compRes.json();
        if (compData) {
          setCompanyId(compData.id || "");
          setCompanyName(compData.name || "");
          setInvoiceNumber(compData.invoice_number || "");
        }

        const custRes = await fetch("/api/customers");
        const custData = await custRes.json();
        setCustomers(custData);

        const prodRes = await fetch("/api/products");
        const prodData = await prodRes.json();
        setProducts(prodData);
      } catch (error) {
        console.error("マスターデータの読み込みに失敗", error);
      } finally {
        setLoading(false);
      }
    };
    loadAllMasters();
  }, []);

  const refreshCustomers = async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(data);
  };

  const refreshProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  };

  // 🏢 保存
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: companyId, name: companyName, invoiceNumber }),
      });
      const data = await response.json();
      if (data.success) alert("💾 自社情報を更新しました！");
    } catch (error) {
      alert("通信エラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // 👥 保存
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCustomerId, companyName: custCompanyName, customerName: custCustomerName, address: custAddress, tel: custTel }),
      });
      const data = await response.json();
      if (data.success) {
        alert(selectedCustomerId ? "📝 顧客情報を編集しました！" : "✨ 新しい顧客を追加しました！");
        clearCustomerForm();
        await refreshCustomers();
      }
    } catch (error) {
      alert("顧客情報の保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // 📦 保存（★項目追加送信）
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedProductId,
          name: prodName,
          description: prodDescription,
          category: prodCategory,
          price: prodPrice,
          unit: prodUnit,
          billingType: prodBillingType
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(selectedProductId ? "📝 商品情報を編集しました！" : "✨ 新しい商品を追加しました！");
        clearProductForm();
        await refreshProducts();
      }
    } catch (error) {
      alert("商品情報の保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCustomerClick = (cust: any) => {
    setSelectedCustomerId(cust.id);
    setCustCompanyName(cust.company_name);
    setCustCustomerName(cust.customer_name);
    setCustAddress(cust.address || "");
    setCustTel(cust.tel || "");
  };

  // ★商品編集クリック時のフォームセット拡張
  const handleEditProductClick = (prod: any) => {
    setSelectedProductId(prod.id);
    setProdName(prod.name);
    setProdDescription(prod.description || "");
    setProdCategory(prod.category || "");
    setProdPrice(prod.price.toString());
    setProdUnit(prod.unit || "");
    setProdBillingType(prod.billing_type || "one-time");
  };

  const clearCustomerForm = () => {
    setSelectedCustomerId(null);
    setCustCompanyName("");
    setCustCustomerName("");
    setCustAddress("");
    setCustTel("");
  };

  // ★商品クリア拡張
  const clearProductForm = () => {
    setSelectedProductId(null);
    setProdName("");
    setProdDescription("");
    setProdCategory("");
    setProdPrice("");
    setProdUnit("");
    setProdBillingType("one-time");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">マスター管理画面</h1>
            <p className="text-sm text-slate-400 mt-1">システムの基礎データを一元管理します</p>
          </div>
          <Link href="/chat" className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium px-4 py-2 rounded-lg transition border border-slate-700">
            チャットに戻る
          </Link>
        </div>

        {/* タブ */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 pb-px">
          <button onClick={() => setActiveTab("company")} className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === "company" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}>🏢 自社情報設定</button>
          <button onClick={() => setActiveTab("customer")} className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === "customer" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}>👥 顧客マスター</button>
          <button onClick={() => setActiveTab("product")} className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === "product" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}>📦 商品マスター</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">データを読み込み中...</div>
        ) : (
          <div>
            {/* 🏢 自社情報設定 */}
            {activeTab === "company" && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl max-w-2xl">
                <form onSubmit={handleSaveCompany} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 tracking-wider mb-2">自社名 / 屋号</label>
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 tracking-wider mb-2">インボイス登録番号</label>
                    <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none" />
                  </div>
                  <div className="flex justify-end pt-4 border-t border-slate-700">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition">この内容で更新する</button>
                  </div>
                </form>
              </div>
            )}

            {/* 👥 顧客マスター */}
            {activeTab === "customer" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                  <h3 className="text-base font-bold mb-4 text-slate-300">登録済み顧客一覧（{customers.length}件）</h3>
                  <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                    {customers.map((cust) => (
                      <div key={cust.id} className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-4 flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-white">{cust.company_name}</h4>
                          <p className="text-xs text-slate-400 mt-1"> {cust.customer_name ? `担当: ${cust.customer_name} 様` : "担当者未登録"}</p>
                          {cust.tel && <p className="text-xs text-slate-400 font-mono mt-0.5">TEL: {cust.tel}</p>}
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">{cust.address || "住所未登録"}</p>
                        </div>
                        <button onClick={() => handleEditCustomerClick(cust)} className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-400 px-2.5 py-1 rounded border border-slate-600 transition">編集</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl h-fit">
                  <h3 className="text-sm font-bold text-blue-400 mb-4">{selectedCustomerId ? "📝 顧客情報を編集" : "✨ 新規顧客を追加"}</h3>
                  <form onSubmit={handleSaveCustomer} className="space-y-4">
                    <div><label className="block text-[11px] font-bold text-slate-400 mb-1">会社名 / 屋号</label><input type="text" value={custCompanyName} onChange={(e) => setCustCompanyName(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-400 mb-1">担当者名</label><input type="text" value={custCustomerName} onChange={(e) => setCustCustomerName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-400 mb-1">電話番号</label><input type="text" value={custTel} onChange={(e) => setCustTel(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-400 mb-1">住所</label><textarea value={custAddress} onChange={(e) => setCustAddress(e.target.value)} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white resize-none" /></div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-md transition shadow">保存</button>
                  </form>
                </div>
              </div>
            )}

            {/* 📦 タブ3：商品マスター管理（フル項目進化版） */}
            {activeTab === "product" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 左側：商品一覧カード */}
                <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                  <h3 className="text-base font-bold mb-4 text-slate-300">登録済み商品一覧（{products.length}件）</h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {products.map((prod) => (
                      <div key={prod.id} className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-4 flex justify-between items-start hover:border-slate-500 transition">
                        <div className="space-y-1 max-w-[80%]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-white">{prod.name}</h4>
                            {prod.category && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-medium">{prod.category}</span>}
                            <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded font-mono">{prod.billing_type === "recurring" ? "月額費用" : "一括費用"}</span>
                          </div>
                          {prod.description && <p className="text-xs text-slate-400 line-clamp-2">{prod.description}</p>}
                          <p className="text-sm text-amber-400 font-bold font-mono">
                            ¥{prod.price.toLocaleString()} <span className="text-xs text-slate-500 font-light">/ {prod.unit || "1式"}</span>
                          </p>
                        </div>
                        <button onClick={() => handleEditProductClick(prod)} className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-400 px-2.5 py-1 rounded border border-slate-600 transition">
                          編集
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 右側：商品フル項目登録フォーム */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl h-fit">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-blue-400">
                      {selectedProductId ? "📝 商品情報を編集" : "✨ 新規商品を追加"}
                    </h3>
                    {selectedProductId && (
                      <button onClick={clearProductForm} className="text-xs text-slate-400 hover:text-white">キャンセル</button>
                    )}
                  </div>

                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">商品名 / 品目名称</label>
                      <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} required placeholder="例：特急開発オプション" className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">カテゴリ</label>
                      <input type="text" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} placeholder="例：オプション機能、月額費用" className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">標準単価（税別）</label>
                        <input type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required placeholder="150000" className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">単位</label>
                        <input type="text" value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} placeholder="例：1式、1回、ヶ月" className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">課金タイプ</label>
                      <select value={prodBillingType} onChange={(e) => setProdBillingType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500">
                        <option value="one-time">one-time（一括費用）</option>
                        <option value="recurring">recurring（継続・月額費用）</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">商品説明 / 特記事項</label>
                      <textarea value={prodDescription} onChange={(e) => setProdDescription(e.target.value)} rows={3} placeholder="商品の詳しい仕様や説明を入力" className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none" />
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-md transition shadow mt-2">
                      {selectedProductId ? "変更を保存する" : "新規登録する"}
                    </button>
                  </form>
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}