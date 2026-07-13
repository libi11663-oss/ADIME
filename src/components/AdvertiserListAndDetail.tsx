import { useState } from "react";
import { AdvertiserSubmission } from "../types";
import {
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
  DollarSign,
  MapPin,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Clock,
  Search,
  Sparkles,
  Award,
  Globe,
  MessageCircle
} from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

interface AdvertiserListAndDetailProps {
  advertisers: AdvertiserSubmission[];
  onDeleteAdvertiser?: (id: string) => void;
}

export default function AdvertiserListAndDetail({ advertisers }: AdvertiserListAndDetailProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    advertisers.length > 0 ? advertisers[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLine, setCopiedLine] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auto-select first advertiser if selectedId is not set but list is not empty
  const activeId = selectedId || (advertisers.length > 0 ? advertisers[0].id : null);
  const selectedAdvertiser = advertisers.find((adv) => adv.id === activeId) || null;

  // Filter advertisers
  const filteredAdvertisers = advertisers.filter((adv) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      adv.name.toLowerCase().includes(query) ||
      adv.companyName.toLowerCase().includes(query) ||
      adv.email.toLowerCase().includes(query) ||
      adv.phone.includes(query) ||
      (adv.city && adv.city.toLowerCase().includes(query)) ||
      (adv.budget && adv.budget.toLowerCase().includes(query))
    );
  });

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyLine = (lineId: string) => {
    navigator.clipboard.writeText(lineId);
    setCopiedLine(true);
    setTimeout(() => setCopiedLine(false), 2000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`確定要刪除廣告主「${name}」的這筆申請資料嗎？此動作將無法還原。`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "advertiser_submissions", id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (err) {
      console.error("Failed to delete advertiser:", err);
      alert("刪除失敗，請檢查網路連線。");
    } finally {
      setDeletingId(null);
    }
  };

  const getBudgetLabel = (budget: string) => {
    switch (budget) {
      case "under-5w":
        return "5萬以下";
      case "5w-10w":
        return "5萬 - 10萬";
      case "10w-20w":
        return "10萬 - 20萬";
      case "above-20w":
        return "20萬以上";
      default:
        return budget || "未評估";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
        date.getDate()
      ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes()
      ).padStart(2, "0")}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: List & Filter */}
      <div className="lg:col-span-5 space-y-4">
        {/* Search bar card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="搜尋公司名、姓名、信箱、電話或地區..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden transition-all"
            />
          </div>
          {searchQuery && (
            <p className="text-[10px] text-indigo-500 font-bold mt-2">
              ✓ 已為您篩選出 {filteredAdvertisers.length} 筆符合關鍵字的廣告主
            </p>
          )}
        </div>

        {/* List card */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3.5 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              廣告主諮詢名單 ({filteredAdvertisers.length})
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded border border-indigo-100">
              即時同步
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {filteredAdvertisers.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400">
                <Mail className="mx-auto text-slate-300 mb-2.5" size={28} />
                <p className="text-xs font-bold">沒有找到符合條件的廣告主資料</p>
                <p className="text-[10px] text-slate-400 mt-1">請嘗試更換其他搜尋關鍵字</p>
              </div>
            ) : (
              filteredAdvertisers.map((adv) => {
                const isSelected = adv.id === activeId;
                return (
                  <div
                    key={adv.id}
                    onClick={() => setSelectedId(adv.id)}
                    className={`p-4 transition-all cursor-pointer border-l-4 ${
                      isSelected
                        ? "bg-indigo-50/30 border-indigo-500"
                        : "border-transparent hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="font-extrabold text-slate-800 text-sm">
                            {adv.companyName || "未填寫公司名稱"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-600">{adv.name}</span>
                          <span className="text-slate-300">|</span>
                          <span className="font-mono">{adv.phone}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded border border-slate-200">
                        {getBudgetLabel(adv.budget)}
                      </span>
                    </div>

                    {/* Email display - Prominent */}
                    <div className="mt-2.5 bg-slate-50 border border-slate-200/60 rounded-lg p-2 flex justify-between items-center">
                      <div className="flex items-center space-x-1.5 overflow-hidden">
                        <Mail size={12} className="text-indigo-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 truncate font-mono select-all">
                          {adv.email}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyEmail(adv.email);
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold bg-white hover:bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded flex items-center space-x-1 transition-colors shrink-0 cursor-pointer"
                        title="複製信箱"
                      >
                        <Copy size={10} />
                        <span>複製</span>
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400 font-semibold">
                      <div className="flex items-center space-x-1">
                        <MapPin size={11} className="text-slate-400" />
                        <span>{adv.city || "未指定地區"}</span>
                      </div>
                      <div className="flex items-center space-x-1 font-mono">
                        <Clock size={11} className="text-slate-400" />
                        <span>{formatDate(adv.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Detailed View */}
      <div className="lg:col-span-7">
        {selectedAdvertiser ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-6">
            {/* Header Card */}
            <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black tracking-widest uppercase border border-indigo-400/20 flex items-center gap-1">
                    <Sparkles size={11} />
                    企業廣告主諮詢
                  </span>
                  
                  <button
                    onClick={() => handleDelete(selectedAdvertiser.id, selectedAdvertiser.companyName)}
                    disabled={deletingId === selectedAdvertiser.id}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    title="刪除此筆資料"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight text-white">
                    {selectedAdvertiser.companyName || "未提供公司名稱"}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    申請流水號: <span className="font-mono text-slate-300">{selectedAdvertiser.id}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Core Body */}
            <div className="px-6 pb-6 space-y-6">
              {/* PRIMARY COPRORATE ADVERTISER EMAIL BOX (Super Prominent) */}
              <div className="border-2 border-indigo-100 bg-indigo-50/20 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-indigo-700 flex items-center space-x-1 uppercase tracking-wider">
                    <Mail size={14} className="text-indigo-600 animate-pulse" />
                    <span>企業廣告主聯絡信箱</span>
                  </h3>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200">
                    聯絡首選
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <span className="text-base md:text-lg font-black text-slate-800 break-all select-all font-mono tracking-tight">
                    {selectedAdvertiser.email}
                  </span>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyEmail(selectedAdvertiser.email)}
                      className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
                        copiedEmail
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                      }`}
                    >
                      {copiedEmail ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedEmail ? "已複製信箱！" : "複製信箱"}</span>
                    </button>

                    <a
                      href={`mailto:${selectedAdvertiser.email}?subject=【穿巷外送廣告】品牌廣告合作洽詢`}
                      className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-sm shadow-indigo-100"
                    >
                      <ExternalLink size={14} />
                      <span>傳送郵件</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Grid 2-cols info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 flex items-center space-x-1 uppercase tracking-wider">
                    <User size={13} className="text-indigo-500" />
                    <span>聯絡窗口資訊</span>
                  </h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">聯絡人姓名</span>
                      <span className="font-extrabold text-slate-800">{selectedAdvertiser.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">聯絡電話</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedAdvertiser.phone}</span>
                    </div>
                    {selectedAdvertiser.lineId && (
                      <div>
                        <span className="text-xs text-slate-400 block font-bold">Line ID</span>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="font-bold text-slate-800 font-mono">{selectedAdvertiser.lineId}</span>
                          <button
                            onClick={() => handleCopyLine(selectedAdvertiser.lineId!)}
                            className="text-[10px] text-slate-500 hover:text-indigo-600 font-bold border border-slate-200 bg-white px-1.5 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedLine ? <Check size={10} /> : <Copy size={10} />}
                            <span>{copiedLine ? "已複製" : "複製"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 flex items-center space-x-1 uppercase tracking-wider">
                    <DollarSign size={13} className="text-indigo-500" />
                    <span>廣告投放規劃</span>
                  </h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">投放預算</span>
                      <span className="font-extrabold text-indigo-600 bg-indigo-50/60 border border-indigo-100 px-2 py-0.5 rounded text-xs mt-0.5 inline-block">
                        {getBudgetLabel(selectedAdvertiser.budget)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">指定投放地區/城市</span>
                      <span className="font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{selectedAdvertiser.city || "全台投放 / 未限定"}</span>
                      </span>
                    </div>
                    {selectedAdvertiser.primaryRegion && (
                      <div>
                        <span className="text-xs text-slate-400 block font-bold">主要投放區域細部</span>
                        <span className="font-bold text-slate-800">{selectedAdvertiser.primaryRegion}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirement details if there are any extra custom form fields */}
              {(selectedAdvertiser.dailyHours || selectedAdvertiser.weeklyDays || selectedAdvertiser.deliveryPlatform) && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 flex items-center space-x-1 uppercase tracking-wider">
                    <Award size={13} className="text-indigo-500" />
                    <span>外送指定細節 / 預計偏好</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                    {selectedAdvertiser.deliveryPlatform && (
                      <div>
                        <span className="text-xs text-slate-400 block font-bold">指定外送平台</span>
                        <span className="font-bold text-slate-800">{selectedAdvertiser.deliveryPlatform}</span>
                      </div>
                    )}
                    {selectedAdvertiser.dailyHours && (
                      <div>
                        <span className="text-xs text-slate-400 block font-bold">希望外送員每日上線</span>
                        <span className="font-bold text-slate-800">{selectedAdvertiser.dailyHours} 小時以上</span>
                      </div>
                    )}
                    {selectedAdvertiser.weeklyDays && (
                      <div>
                        <span className="text-xs text-slate-400 block font-bold">希望外送員每週上線</span>
                        <span className="font-bold text-slate-800">{selectedAdvertiser.weeklyDays} 天以上</span>
                      </div>
                    )}
                    {selectedAdvertiser.scooterModel && (
                      <div>
                        <span className="text-xs text-slate-400 block font-bold">希望機車型號</span>
                        <span className="font-bold text-slate-800">{selectedAdvertiser.scooterModel}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message Block */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 flex items-center space-x-1 uppercase tracking-wider">
                  <MessageSquare size={13} className="text-indigo-500" />
                  <span>廣告主需求留言 / 備註</span>
                </h3>
                <p className="text-slate-700 text-sm font-medium leading-relaxed bg-white border border-slate-200 rounded-lg p-3.5 select-text">
                  {selectedAdvertiser.message || "「未填寫具體留言內容。」"}
                </p>
              </div>

              {/* Date Timeline details */}
              <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4 flex flex-col space-y-1">
                <div className="flex items-center space-x-1.5">
                  <Calendar size={12} />
                  <span>諮詢送出時間：{formatDate(selectedAdvertiser.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock size={12} />
                  <span>資料更新狀態：已建立且同步至雲端資料庫</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4">
            <Mail className="mx-auto text-slate-300" size={48} />
            <div>
              <h3 className="font-bold text-slate-800 text-base">請從左側選擇一位企業廣告主</h3>
              <p className="text-xs text-slate-400 mt-1">選取後即可檢視完整視窗聯絡信箱、電話、預算、特定地區及合作留言細節。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
