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
  const [checkedCustomerIds, setCheckedCustomerIds] = useState<string[]>([]); // 👈 顧客チェックボックス用

  // 📦 商品マスター用の状態
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodUnit, setProdUnit] = useState("");
  const [prodBillingType, setProdBillingType] = useState("one-time");
  const [checkedProductIds, setCheckedProductIds] = useState<string[]>([]); // 👈 商品チェックボックス用

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAllMasters();
  }, []);

  const loadAllMasters = async () => {
    setLoading(true);
    try {
      const compRes = await fetch("/api/company");
      const compData = await compRes.json();
      if (compData) {
        setCompanyId(compData.id || "");
        setCompanyName(compData.name || "");
        setInvoiceNumber(compData.invoice_number || "");
      }
      await refreshCustomers();
      await refreshProducts();
    } catch (error) {
      console.error("マスターデータの読み込みに失敗", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomers = async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(data);
    setCheckedCustomerIds([]); // リフレッシュ時に選択をクリア
  };

  const refreshProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setCheckedProductIds([]); // リフレッシュ時に選択をクリア
  };

  // 🗑️ 顧客の複数同時削除処理
  const handleBulkDeleteCustomers = async () => {
    if (checkedCustomerIds.length === 0) return;
    const confirmDelete = window.confirm(`⚠️ 選択された ${checkedCustomerIds.length} 件の顧客データを完全に削除しますか？\nこの操作は取り消せません。`);
    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/customers/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: checkedCustomerIds })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🗑️ ${data.count} 件の顧客データを削除しました。`);
        await refreshCustomers();
      } else {
        alert("削除に失敗しました: " + data.message);
      }
    } catch (error) {
      alert("通信エラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // 🗑️ 商品の複数同時削除処理
  const handleBulkDeleteProducts = async () => {
    if (checkedProductIds.length === 0) return;
    const confirmDelete = window.confirm(`⚠️ 選択された ${checkedProductIds.length} 件の商品データを完全に削除しますか？\nこの操作は取り消せません。`);
    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/products/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: checkedProductIds })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🗑️ ${data.count} 件の商品データを削除しました。`);
        await refreshProducts();
      } else {
        alert("削除に失敗しました: " + data.message);
      }
    } catch (error) {
      alert("通信エラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // 顧客チェックボックス制御
  const handleCustomerCheck = (id: string) => {
    setCheckedCustomerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCustomerAllCheck = () => {
    if (checkedCustomerIds.length === customers.length) {
      setCheckedCustomerIds([]);
    } else {
      setCheckedCustomerIds(customers.map(c => c.id));
    }
  };

  // 商品チェックボックス制御
  const handleProductCheck = (id: string) => {
    setCheckedProductIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleProductAllCheck = () => {
    if (checkedProductIds.length === products.length) {
      setCheckedProductIds([]);
    } else {
      setCheckedProductIds(products.map(p => p.id));
    }
  };

  // CSVエクスポート・インポート
  const handleExportCustomerCSV = () => {
    if (customers.length === 0) return alert("エクスポートするデータがありません。");
    let csvContent = "会社名,担当者名,電話番号,住所\n";
    customers.forEach((c) => {
      const row = [`"${(c.company_name || "").replace(/"/g, '""')}"`,`"${(c.customer_name || "").replace(/"/g, '""')}"`,`"${(c.tel || "").replace(/"/g, '""')}"`,`"${(c.address || "").replace(/"/g, '""')}"`].join(",");
      csvContent += row + "\n";
    });
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `顧客マスター_${Date.now()}.csv`);
    link.click();
  };

  const handleImportCustomerCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        const parsedItems = [];
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, "").trim());
          if (columns.length >= 1 && columns[0]) {
            parsedItems.push({ companyName: columns[0], customerName: columns[1] || "", tel: columns[2] || "", address: columns[3] || "" });
          }
        }
        if (parsedItems.length === 0) return alert("有効なデータがCSV内に見つかりませんでした。");
        setIsSaving(true);
        const res = await fetch("/api/customers/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: parsedItems }) });
        const data = await res.json();
        if (data.success) { alert(`🎉 CSVから ${data.count} 件の顧客データを一括登録しました！`); await refreshCustomers(); }
      } catch (err) { alert("CSVのインポートに失敗しました。"); } finally { setIsSaving(false); e.target.value = ""; }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleExportProductCSV = () => {
    if (products.length === 0) return alert("エクスポートするデータがありません。");
    let csvContent = "商品名,カテゴリ,標準単価,単位,課金タイプ(one-timeまたはrecurring),商品説明\n";
    products.forEach((p) => {
      const row = [`"${(p.name || "").replace(/"/g, '""')}"`,`"${(p.category || "").replace(/"/g, '""')}"`,p.price,`"${(p.unit || "1式").replace(/"/g, '""')}"`,p.billing_type || "one-time",`"${(p.description || "").replace(/"/g, '""')}"`].join(",");
      csvContent += row + "\n";
    });
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `商品マスター_${Date.now()}.csv`);
    link.click();
  };

  const handleImportProductCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        const parsedItems = [];
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, "").trim());
          if (columns.length >= 1 && columns[0]) {
            parsedItems.push({ name: columns[0], category: columns[1] || "", price: Number(columns[2]) || 0, unit: columns[3] || "1式", billingType: columns[4] === "recurring" ? "recurring" : "one-time", description: columns[5] || "" });
          }
        }
        if (parsedItems.length === 0) return alert("有効なデータがCSV内に見つかりませんでした。");
        setIsSaving(true);
        const res = await fetch("/api/products/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: parsedItems }) });
        const data = await res.json();
        if (data.success) { alert(`🎉 CSVから ${data.count} 件の商品データを一括登録しました！`); await refreshProducts(); }
      } catch (err) { alert("CSVのインポートに失敗しました。"); } finally { setIsSaving(false); e.target.value = ""; }
    };
    reader.readAsText(file, "UTF-8");
  };

  // 個別保存処理（自社・顧客・商品）
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      await fetch("/api/company", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: companyId, name: companyName, invoiceNumber }) });
      alert("💾 自社情報を更新しました！");
    } catch { alert("通信エラーです。"); } finally { setIsSaving(false); }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const response = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedCustomerId, companyName: custCompanyName, customerName: custCustomerName || null, address: custAddress, tel: custTel }) });
      const data = await response.json();
      if (data.success) { alert(selectedCustomerId ? "📝 更新しました" : "✨ 追加しました"); clearCustomerForm(); await refreshCustomers(); }
    } catch { alert("失敗しました。"); } finally { setIsSaving(false); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedProductId, name: prodName, description: prodDescription, category: prodCategory, price: prodPrice, unit: prodUnit, billingType: prodBillingType }) });
      const data = await response.json();
      if (data.success) { alert(selectedProductId ? "📝 更新しました" : "✨ 追加しました"); clearProductForm(); await refreshProducts(); }
    } catch { alert("失敗しました。"); } finally { setIsSaving(false); }
  };

  const handleEditCustomerClick = (cust: any) => {
    setSelectedCustomerId(cust.id); setCustCompanyName(cust.company_name); setCustCustomerName(cust.customer_name || ""); setCustAddress(cust.address || ""); setCustTel(cust.tel || "");
  };

  const handleEditProductClick = (prod: any) => {
    setSelectedProductId(prod.id); setProdName(prod.name); setProdDescription(prod.description || ""); setProdCategory(prod.category || ""); setProdPrice(prod.price.toString()); setProdUnit(prod.unit || ""); setProdBillingType(prod.billing_type || "one-time");
  };

  const clearCustomerForm = () => { setSelectedCustomerId(null); setCustCompanyName(""); setCustCustomerName(""); setCustAddress(""); setCustTel(""); };
  const clearProductForm = () => { setSelectedProductId(null); setProdName(""); setProdDescription(""); setProdCategory(""); setProdPrice(""); setProdUnit(""); setProdBillingType("one-time"); };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">スマート見積システム マスター管理</h1>
            <p className="text-sm text-slate-400 mt-1">基礎データの管理・一括削除機能</p>
          </div>
          <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium px-4 py-2 rounded-lg transition border border-slate-700">
            ダッシュボードに戻る
          </Link>
        </div>

        {/* タブ */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 pb-px">
          <button onClick={() => { setActiveTab("company"); clearCustomerForm(); clearProductForm(); }} className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === "company" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}>🏢 自社情報設定</button>
          <button onClick={() => { setActiveTab("customer"); clearCustomerForm(); clearProductForm(); }} className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === "customer" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}>👥 顧客マスター</button>
          <button onClick={() => { setActiveTab("product"); clearCustomerForm(); clearProductForm(); }} className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === "product" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}>📦 商品マスター</button>
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
                    <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition disabled:bg-slate-700">{isSaving ? "保存中..." : "この内容で更新する"}</button>
                  </div>
                </form>
              </div>
            )}

            {/* 👥 顧客マスター */}
            {activeTab === "customer" && (
              <div className="space-y-6">
                {/* 操作パネル */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap justify-between items-center gap-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={customers.length > 0 && checkedCustomerIds.length === customers.length} onChange={handleCustomerAllCheck} className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                    <span className="text-xs font-bold text-slate-300">すべて選択 ({checkedCustomerIds.length}件選択中)</span>
                    {checkedCustomerIds.length > 0 && (
                      <button onClick={handleBulkDeleteCustomers} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-900/60 text-xs font-bold px-3 py-1.5 rounded-md transition animate-fade-in">
                        選択した項目をまとめて削除 🗑️
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow"><input type="file" accept=".csv" onChange={handleImportCustomerCSV} disabled={isSaving} className="hidden" />📥 CSVインポート</label>
                    <button onClick={handleExportCustomerCSV} className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold px-4 py-2 rounded-lg transition border border-slate-600">📤 CSVエクスポート</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                    <h3 className="text-base font-bold mb-4 text-slate-300">登録済み顧客一覧（{customers.length}件）</h3>
                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                      {customers.map((cust) => (
                        <div key={cust.id} className={`border rounded-lg p-4 flex justify-between items-start transition ${checkedCustomerIds.includes(cust.id) ? "bg-blue-950/20 border-blue-500/50" : "bg-slate-900/60 border-slate-700/60"}`}>
                          <div className="flex items-start gap-3">
                            <input type="checkbox" checked={checkedCustomerIds.includes(cust.id)} onChange={() => handleCustomerCheck(cust.id)} className="w-4 h-4 rounded accent-blue-500 mt-1 cursor-pointer" />
                            <div>
                              <h4 className="font-bold text-sm text-white">{cust.company_name}</h4>
                              <p className="text-xs text-slate-400 mt-1">{cust.customer_name ? `担当: ${cust.customer_name} 様` : "👤 担当者未設定"}</p>
                              {cust.tel && <p className="text-xs text-slate-400 font-mono mt-0.5">TEL: {cust.tel}</p>}
                              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">{cust.address || "住所未登録"}</p>
                            </div>
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
                      <div><label className="block text-[11px] font-bold text-slate-400 mb-1">担当者名 <span className="text-[10px] text-slate-500 font-normal">(任意)</span></label><input type="text" value={custCustomerName} onChange={(e) => setCustCustomerName(e.target.value)} placeholder="例：山田 太郎" className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white" /></div>
                      <div><label className="block text-[11px] font-bold text-slate-400 mb-1">電話番号</label><input type="text" value={custTel} onChange={(e) => setCustTel(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white" /></div>
                      <div><label className="block text-[11px] font-bold text-slate-400 mb-1">住所</label><textarea value={custAddress} onChange={(e) => setCustAddress(e.target.value)} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white resize-none" /></div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-md transition disabled:bg-slate-700">{isSaving ? "..." : selectedCustomerId ? "保存" : "登録"}</button>
                        {selectedCustomerId && <button type="button" onClick={clearCustomerForm} className="bg-slate-700 text-slate-300 text-xs px-3 rounded-md">取消</button>}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* 📦 商品マスター */}
            {activeTab === "product" && (
              <div className="space-y-6">
                {/* 操作パネル */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap justify-between items-center gap-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={products.length > 0 && checkedProductIds.length === products.length} onChange={handleProductAllCheck} className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                    <span className="text-xs font-bold text-slate-300">すべて選択 ({checkedProductIds.length}件選択中)</span>
                    {checkedProductIds.length > 0 && (
                      <button onClick={handleBulkDeleteProducts} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-900/60 text-xs font-bold px-3 py-1.5 rounded-md transition animate-fade-in">
                        選択した項目をまとめて削除 🗑️
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow"><input type="file" accept=".csv" onChange={handleImportProductCSV} disabled={isSaving} className="hidden" />📥 CSVインポート</label>
                    <button onClick={handleExportProductCSV} className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold px-4 py-2 rounded-lg transition border border-slate-600">📤 CSVエクスポート</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                    <h3 className="text-base font-bold mb-4 text-slate-300">登録済み商品一覧（{products.length}件）</h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {products.map((prod) => (
                        <div key={prod.id} className={`border rounded-lg p-4 flex justify-between items-start transition ${checkedProductIds.includes(prod.id) ? "bg-blue-950/20 border-blue-500/50" : "bg-slate-900/60 border-slate-700/60"}`}>
                          <div className="flex items-start gap-3">
                            <input type="checkbox" checked={checkedProductIds.includes(prod.id)} onChange={() => handleProductCheck(prod.id)} className="w-4 h-4 rounded accent-blue-500 mt-1 cursor-pointer" />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-white">{prod.name}</h4>
                                {prod.category && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-medium">{prod.category}</span>}
                                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded font-mono">{prod.billing_type === "recurring" ? "月額費用" : "一括費用"}</span>
                              </div>
                              {prod.description && <p className="text-xs text-slate-400 line-clamp-2">{prod.description}</p>}
                              <p className="text-sm text-amber-400 font-bold font-mono">¥{prod.price.toLocaleString()} <span className="text-xs text-slate-500 font-light">/ {prod.unit || "1式"}</span></p>
                            </div>
                          </div>
                          <button onClick={() => handleEditProductClick(prod)} className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-400 px-2.5 py-1 rounded border border-slate-600 transition">編集</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl h-fit">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-blue-400">{selectedProductId ? "📝 商品情報を編集" : "✨ 新規商品を追加"}</h3></div>
                    <form onSubmit={handleSaveProduct} className="space-y-4">
                      <div><label className="block text-[11px] font-bold text-slate-400 mb-1">商品名 / 品目名称</label><input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white" /></div>
                      <div><label className="block text-[11px] font-bold text-slate-400 mb-1">カテゴリ</label><input type="text" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="block text-[11px] font-bold text-slate-400 mb-1">標準単価（税別）</label><input type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white" /></div>
                        <div><label className="block text-[11px] font-bold text-slate-400 mb-1">単位</label><input type="text" value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white" /></div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">課金タイプ</label>
                        <select value={prodBillingType} onChange={(e) => setProdBillingType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 bg-slate-900 focus:outline-none">
                          <option value="one-time">one-time（一括費用）</option>
                          <option value="recurring">recurring（継続・月額費用）</option>
                        </select>
                      </div>
                      <div><label className="block text-[11px] font-bold text-slate-400 mb-1">商品説明 / 特記事項</label><textarea value={prodDescription} onChange={(e) => setProdDescription(e.target.value)} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white resize-none" /></div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-md transition shadow disabled:bg-slate-700">{isSaving ? "..." : selectedProductId ? "保存" : "登録"}</button>
                        {selectedProductId && <button type="button" onClick={clearProductForm} className="bg-slate-700 text-slate-300 text-xs px-3 rounded-md">取消</button>}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}