import { useState, useMemo } from "react";
import { Submission } from "../types";
import { getFormattedRegion } from "./SubmissionList";
import { 
  Search, 
  MapPin, 
  Bike, 
  Smartphone, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  X, 
  Clock, 
  ArrowRight, 
  User, 
  FileText, 
  ShieldAlert,
  Send,
  RotateCcw,
  Play,
  Edit2
} from "lucide-react";

interface DispatchManagementProps {
  submissions: Submission[];
  onDispatch: (
    id: string, 
    days: number, 
    target: string, 
    startDate?: string, 
    endDate?: string, 
    status?: "dispatched" | "email_sent"
  ) => Promise<void>;
  onCancelDispatch: (id: string) => Promise<void>;
}

export function DispatchManagement({ submissions, onDispatch, onCancelDispatch }: DispatchManagementProps) {
  const [search, setSearch] = useState("");
  const [selectedRider, setSelectedRider] = useState<Submission | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dispatchDays, setDispatchDays] = useState<number | string>(30);
  const [dispatchStartDate, setDispatchStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dispatchEndDate, setDispatchEndDate] = useState<string>(() => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return future.toISOString().split("T")[0];
  });
  const [dispatchTarget, setDispatchTarget] = useState<string>("每月 1000 公里 / 80 小時");
  const [isSending, setIsSending] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(true);

  // States for direct Start Dispatch (開始派發) button and modal
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [startModalRider, setStartModalRider] = useState<Submission | null>(null);
  const [directStartDate, setDirectStartDate] = useState<string>("");
  const [directEndDate, setDirectEndDate] = useState<string>("");
  const [directDays, setDirectDays] = useState<number | string>(30);

  // States for Edit Dispatch (編輯派發)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalRider, setEditModalRider] = useState<Submission | null>(null);
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");
  const [editTarget, setEditTarget] = useState<string>("");
  const [editDays, setEditDays] = useState<number | string>(30);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // States for Batch Dispatch (一鍵批次派發)
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedRiderIds, setSelectedRiderIds] = useState<string[]>([]);
  const [batchDays, setBatchDays] = useState<number | string>(30);
  const [batchStartDate, setBatchStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [batchEndDate, setBatchEndDate] = useState<string>(() => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return future.toISOString().split("T")[0];
  });
  const [batchTarget, setBatchTarget] = useState<string>("每月 1000 公里 / 80 小時");
  const [cityFilter, setCityFilter] = useState<string>("all");
  
  // Batch Success Modal
  const [isBatchSuccessModalOpen, setIsBatchSuccessModalOpen] = useState(false);
  const [batchSuccessEmails, setBatchSuccessEmails] = useState<string[]>([]);
  const [batchSuccessCount, setBatchSuccessCount] = useState(0);

  // Helper to calculate days between two dates
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 30;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Two-way date/days synchronization
  const handleStartDateChange = (val: string) => {
    setDispatchStartDate(val);
    if (val && dispatchEndDate) {
      const days = calculateDays(val, dispatchEndDate);
      setDispatchDays(days);
    }
  };

  const handleEndDateChange = (val: string) => {
    setDispatchEndDate(val);
    if (dispatchStartDate && val) {
      const days = calculateDays(dispatchStartDate, val);
      setDispatchDays(days);
    }
  };

  const handleDaysChange = (daysVal: number | string) => {
    setDispatchDays(daysVal);
    const d = Number(daysVal);
    if (!isNaN(d) && d > 0) {
      const startStr = dispatchStartDate || new Date().toISOString().split("T")[0];
      if (!dispatchStartDate) {
        setDispatchStartDate(startStr);
      }
      const start = new Date(startStr);
      start.setDate(start.getDate() + d);
      setDispatchEndDate(start.toISOString().split("T")[0]);
    }
  };

  // Two-way synchronization for Batch dates
  const handleBatchStartDateChange = (val: string) => {
    setBatchStartDate(val);
    if (val && batchEndDate) {
      const days = calculateDays(val, batchEndDate);
      setBatchDays(days);
    }
  };

  const handleBatchEndDateChange = (val: string) => {
    setBatchEndDate(val);
    if (batchStartDate && val) {
      const days = calculateDays(batchStartDate, val);
      setBatchDays(days);
    }
  };

  const handleBatchDaysChange = (daysVal: number | string) => {
    setBatchDays(daysVal);
    const d = Number(daysVal);
    if (!isNaN(d) && d > 0) {
      const startStr = batchStartDate || new Date().toISOString().split("T")[0];
      if (!batchStartDate) {
        setBatchStartDate(startStr);
      }
      const start = new Date(startStr);
      start.setDate(start.getDate() + d);
      setBatchEndDate(start.toISOString().split("T")[0]);
    }
  };

  // Two-way synchronization for Direct start dispatch dates
  const handleDirectStartDateChange = (val: string) => {
    setDirectStartDate(val);
    if (val && directEndDate) {
      const days = calculateDays(val, directEndDate);
      setDirectDays(days);
    }
  };

  const handleDirectEndDateChange = (val: string) => {
    setDirectEndDate(val);
    if (directStartDate && val) {
      const days = calculateDays(directStartDate, val);
      setDirectDays(days);
    }
  };

  const handleDirectDaysChange = (daysVal: number | string) => {
    setDirectDays(daysVal);
    const d = Number(daysVal);
    if (!isNaN(d) && d > 0) {
      const startStr = directStartDate || new Date().toISOString().split("T")[0];
      if (!directStartDate) {
        setDirectStartDate(startStr);
      }
      const start = new Date(startStr);
      start.setDate(start.getDate() + d);
      setDirectEndDate(start.toISOString().split("T")[0]);
    }
  };

  // Two-way synchronization for Edit dispatch dates
  const handleEditStartDateChange = (val: string) => {
    setEditStartDate(val);
    if (val && editEndDate) {
      const days = calculateDays(val, editEndDate);
      setEditDays(days);
    }
  };

  const handleEditEndDateChange = (val: string) => {
    setEditEndDate(val);
    if (editStartDate && val) {
      const days = calculateDays(editStartDate, val);
      setEditDays(days);
    }
  };

  const handleEditDaysChange = (daysVal: number | string) => {
    setEditDays(daysVal);
    const d = Number(daysVal);
    if (!isNaN(d) && d > 0) {
      const startStr = editStartDate || new Date().toISOString().split("T")[0];
      if (!editStartDate) {
        setEditStartDate(startStr);
      }
      const start = new Date(startStr);
      start.setDate(start.getDate() + d);
      setEditEndDate(start.toISOString().split("T")[0]);
    }
  };

  // Filter only approved/active riders for dispatch
  const approvedRiders = submissions.filter(sub => sub.status === "approved");

  // Categorize into undispatched and dispatched
  const undispatched = approvedRiders.filter(
    sub => !sub.dispatchStatus || sub.dispatchStatus === "undispatched" || sub.dispatchStatus === "email_sent"
  );
  
  const dispatched = approvedRiders.filter(
    sub => sub.dispatchStatus === "dispatched"
  );

  // Apply search query
  const filterBySearch = (list: Submission[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(sub => 
      sub.name.toLowerCase().includes(q) ||
      sub.phone.toLowerCase().includes(q) ||
      sub.email.toLowerCase().includes(q) ||
      (sub.plateNumber && sub.plateNumber.toLowerCase().includes(q)) ||
      (sub.memberId && sub.memberId.toLowerCase().includes(q)) ||
      getFormattedRegion(sub).toLowerCase().includes(q)
    );
  };

  const filteredUndispatched = filterBySearch(undispatched);
  const filteredDispatched = filterBySearch(dispatched);

  // Extract unique cities from undispatched list for selection
  const undispatchedCities = useMemo(() => {
    const cities = new Set<string>();
    undispatched.forEach(rider => {
      const formatted = getFormattedRegion(rider);
      if (formatted.length >= 3) {
        const city = formatted.slice(0, 3);
        if (city.endsWith("市") || city.endsWith("縣")) {
          cities.add(city);
        }
      }
    });
    return Array.from(cities).sort();
  }, [undispatched]);

  // Combined Undispatched list with search AND city filters
  const filteredUndispatchedWithCity = useMemo(() => {
    let result = filteredUndispatched;
    if (cityFilter !== "all") {
      result = result.filter(rider => {
        const formatted = getFormattedRegion(rider);
        return formatted.startsWith(cityFilter);
      });
    }
    return result;
  }, [filteredUndispatched, cityFilter]);

  // Handle open modal
  const openDispatchModal = (rider: Submission) => {
    setSelectedRider(rider);
    // Set default target based on delivery platform or vehicle
    if (rider.vehicleType === "自行車") {
      setDispatchTarget("每月 300 公里 / 60 小時");
    } else {
      setDispatchTarget("每月 1000 公里 / 80 小時");
    }
    
    // Set default dates
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const futureStr = future.toISOString().split("T")[0];

    setDispatchDays(30);
    setDispatchStartDate(todayStr);
    setDispatchEndDate(futureStr);
    setIsModalOpen(true);
  };

  // Handle submit dispatch
  const handleConfirmDispatch = async () => {
    if (!selectedRider) return;
    setIsSending(true);
    try {
      const finalDays = Number(dispatchDays) || 30;
      // 1. Perform database state update with dates (set as email_sent so they remain in undispatched list)
      await onDispatch(selectedRider.id, finalDays, dispatchTarget, dispatchStartDate, dispatchEndDate, "email_sent");
      
      // 2. Prepare Email parameters for Gmail Compose
      const subject = `【穿巷】恭喜您！您的廣告箱體任務已成功派發通知信`;
      const plateNo = selectedRider.plateNumber || "未提供車牌";
      
      const body = `親愛的穿巷夥伴 ${selectedRider.name} 您好：

感謝您對「穿巷外送廣告平台」的支持。經專員評估，您的外送箱（車牌：${plateNo} / 外送平台：${selectedRider.deliveryPlatform}）已正式通過審核，並為您成功指派了全新一期的廣告版位任務！

📊 廣告投放任務明細：
📌 合約投放天數：${finalDays} 天
📌 廣告執行起訖：${dispatchStartDate} ~ ${dispatchEndDate} (請於廣告執行日前安裝完成並回傳安裝照片至官方賴)
📌 指標里程與時數目標：${dispatchTarget || "未設定"}
📌 專屬會員號碼：${selectedRider.memberId || "待配發"}

* 貼心提醒：請您在每日出車前確認外送箱上的廣告貼膜保持清潔與平整。任務期間，系統將依據您回傳的每日跑單與里程照片進行數據稽核。若您有任何疑問，請透過 LINE ID: @alleyway_ad 聯絡客服。

穿巷移動媒體團隊 敬上`;

      // Construct Gmail URL
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedRider.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open in a new tab
      window.open(gmailUrl, "_blank");
      
      setIsModalOpen(false);
      setSelectedRider(null);
    } catch (error) {
      console.error("Dispatch failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Open direct start dispatch modal
  const openStartDispatchModal = (rider: Submission) => {
    setStartModalRider(rider);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const futureStr = future.toISOString().split("T")[0];
    setDirectStartDate(todayStr);
    setDirectEndDate(futureStr);
    setDirectDays(30);
    setIsStartModalOpen(true);
  };

  // Handle direct start dispatch confirmation
  const handleConfirmStartDispatch = async () => {
    if (!startModalRider) return;
    setIsSending(true);
    try {
      const days = Number(directDays) || 30;
      const defaultTarget = "每月 1000 公里 / 80 小時";
      // Perform database state update
      await onDispatch(startModalRider.id, days, defaultTarget, directStartDate, directEndDate, "dispatched");
      
      setIsStartModalOpen(false);
      setStartModalRider(null);
    } catch (error) {
      console.error("Direct start dispatch failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Open edit dispatch modal with existing values
  const openEditDispatchModal = (rider: Submission) => {
    setEditModalRider(rider);
    const start = rider.dispatchStartDate || new Date().toISOString().split("T")[0];
    const end = rider.dispatchExpiry || (() => {
      const future = new Date();
      future.setDate(future.getDate() + (rider.dispatchDays || 30));
      return future.toISOString().split("T")[0];
    })();
    setEditStartDate(start);
    setEditEndDate(end);
    setEditTarget(rider.dispatchTarget || "每月 1000 公里 / 80 小時");
    setEditDays(rider.dispatchDays || calculateDays(start, end));
    setShowCancelConfirm(false);
    setIsEditModalOpen(true);
  };

  // Handle edit dispatch confirmation
  const handleSaveEditDispatch = async () => {
    if (!editModalRider) return;
    setIsSending(true);
    try {
      const days = Number(editDays) || 30;
      await onDispatch(editModalRider.id, days, editTarget, editStartDate, editEndDate, editModalRider.dispatchStatus || "dispatched");
      setIsEditModalOpen(false);
      setEditModalRider(null);
    } catch (error) {
      console.error("Save edit dispatch failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle cancel dispatch from edit modal
  const handleCancelDispatchFromEdit = async () => {
    if (!editModalRider) return;
    setIsSending(true);
    try {
      await onCancelDispatch(editModalRider.id);
      setIsEditModalOpen(false);
      setEditModalRider(null);
    } catch (error) {
      console.error("Cancel dispatch from edit failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle selection for a single rider
  const handleToggleRiderSelection = (riderId: string) => {
    setSelectedRiderIds(prev => 
      prev.includes(riderId) 
        ? prev.filter(id => id !== riderId) 
        : [...prev, riderId]
    );
  };

  // Select/Deselect all visible filtered riders
  const handleToggleSelectAllVisible = () => {
    const visibleIds = filteredUndispatchedWithCity.map(r => r.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedRiderIds.includes(id));
    
    if (allSelected) {
      // Unselect all visible
      setSelectedRiderIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible
      setSelectedRiderIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  // Handle Batch Dispatch Execution
  const handleBatchDispatchExecute = async () => {
    if (selectedRiderIds.length === 0) return;
    setIsSending(true);
    try {
      const finalDays = Number(batchDays) || 30;
      
      // Get selected submissions to extract emails & names
      const selectedSubmissions = undispatched.filter(r => selectedRiderIds.includes(r.id));
      const emails = selectedSubmissions.map(r => r.email).filter(Boolean);
      
      // Update each selected submission sequentially or parallelly in Firestore
      // (setting them as email_sent so they remain in the undispatched list as per user's directive,
      // and only transition to dispatched list when start dispatch is pressed)
      await Promise.all(
        selectedSubmissions.map(rider => 
          onDispatch(rider.id, finalDays, batchTarget, batchStartDate, batchEndDate, "email_sent")
        )
      );

      // Prepare batch success metrics
      setBatchSuccessEmails(emails);
      setBatchSuccessCount(selectedSubmissions.length);
      setIsBatchSuccessModalOpen(true);
      
      // Clear selection and turn off batch mode
      setSelectedRiderIds([]);
      setIsBatchMode(false);
    } catch (error) {
      console.error("Batch dispatch execution failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (expiryStr?: string) => {
    if (!expiryStr) return 0;
    const expiry = new Date(expiryStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Search and stats bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜尋外送夥伴姓名、手機、車牌、服務地區..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder-slate-400 text-slate-700"
          />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              清除
            </button>
          )}
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-500 font-bold shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>核准外送夥伴：{approvedRiders.length} 人</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>未派發廣告：{undispatched.length} 人</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>已派發廣告：{dispatched.length} 人</span>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Column 1: Undispatched List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-amber-50/25 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <h2 className="font-extrabold text-slate-800 text-sm">
                未派發廣告外送員 ({cityFilter === "all" ? filteredUndispatched.length : filteredUndispatchedWithCity.length})
              </h2>
            </div>
            <span className="text-[10px] bg-amber-150 text-amber-800 font-bold px-2 py-0.5 rounded">
              可指派任務
            </span>
          </div>

          {/* Batch Mode Trigger and Quick Filter controls */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                setSelectedRiderIds([]);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                isBatchMode 
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100 hover:bg-indigo-700" 
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Send size={12} />
              <span>{isBatchMode ? "關閉一鍵批次派發" : "開啟一鍵批次派發"}</span>
            </button>

            {isBatchMode && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* City Filter Dropdown */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">常跑地區篩選：</span>
                  <select
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      setSelectedRiderIds([]); // Reset selection on filter change for safety
                    }}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  >
                    <option value="all">全部地區縣市</option>
                    {undispatchedCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Select All Visible toggle */}
                <button
                  onClick={handleToggleSelectAllVisible}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  {filteredUndispatchedWithCity.length > 0 && filteredUndispatchedWithCity.every(r => selectedRiderIds.includes(r.id)) 
                    ? "取消全選" 
                    : "全選此區域"}
                </button>
              </div>
            )}
          </div>

          {/* Batch Parameters Form */}
          {isBatchMode && (
            <div className="p-5 bg-indigo-50/20 border-b border-indigo-100/40 space-y-4 animate-in slide-in-from-top duration-250">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  已選取 {selectedRiderIds.length} 位外送夥伴
                </span>
                {selectedRiderIds.length > 0 && (
                  <button
                    onClick={() => setSelectedRiderIds([])}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold"
                  >
                    清除選取
                  </button>
                )}
              </div>

              {selectedRiderIds.length === 0 ? (
                <div className="py-6 text-center text-slate-400 font-bold text-xs bg-white rounded-2xl border border-dashed border-slate-200 px-4">
                  請勾選下方外送夥伴旁邊的選取框，或點擊上方「全選此區域」按鈕以進行批次設定
                </div>
              ) : (
                <div className="space-y-4 bg-white p-4 rounded-2xl border border-indigo-100/80 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Contract days */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block">廣告投放合約天數 (天)</label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={batchDays}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setBatchDays("");
                          } else {
                            const parsed = parseInt(val);
                            handleBatchDaysChange(isNaN(parsed) ? "" : parsed);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850"
                      />
                    </div>

                    {/* Mileage target */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block">每月里程 / 時數目標</label>
                      <input
                        type="text"
                        value={batchTarget}
                        onChange={(e) => setBatchTarget(e.target.value)}
                        placeholder="例如：每月 1000 公里 / 80 小時"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850"
                      />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block">廣告執行開始日期</label>
                      <input
                        type="date"
                        value={batchStartDate}
                        onChange={(e) => handleBatchStartDateChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850"
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block">廣告執行結束日期</label>
                      <input
                        type="date"
                        value={batchEndDate}
                        onChange={(e) => handleBatchEndDateChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850"
                      />
                    </div>
                  </div>

                  {/* Calculated days for batch */}
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span>計算投放合約天數</span>
                    <span className="text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                      {calculateDays(batchStartDate, batchEndDate)} 天
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleBatchDispatchExecute}
                    disabled={isSending || selectedRiderIds.length === 0}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSending ? (
                      <span>正在批次派發更新中...</span>
                    ) : (
                      <>
                        <Send size={12} />
                        <span>確認一鍵指派廣告並生成群發信件 ({selectedRiderIds.length} 人)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {filteredUndispatchedWithCity.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium space-y-2">
                <p className="text-sm">沒有符合條件的未派發外送員</p>
                <p className="text-xs text-slate-300">
                  {approvedRiders.length === 0 ? "請先至審核頁面核准外送員申請" : "所有審核通過的外送員皆已派發廣告！"}
                </p>
              </div>
            ) : (
              filteredUndispatchedWithCity.map((rider) => (
                <div key={rider.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {isBatchMode && (
                      <div className="pt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedRiderIds.includes(rider.id)}
                          onChange={() => handleToggleRiderSelection(rider.id)}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500/30 focus:ring-2 cursor-pointer transition-all"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-800 text-sm truncate">{rider.name}</span>
                        {rider.memberId && (
                          <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                            {rider.memberId}
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                          {rider.deliveryPlatform}
                        </span>
                        {rider.workType && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            rider.workType === "正職"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-100"
                          }`}>
                            {rider.workType}
                          </span>
                        )}
                        {rider.dispatchStatus === "email_sent" && (
                          <span className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/60 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 shrink-0">
                            <Send size={8} />
                            <span>已寄送通知信</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <Smartphone size={12} className="text-slate-400" />
                          {rider.phone}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={12} className="text-indigo-500 shrink-0" />
                          <span className="truncate">{getFormattedRegion(rider)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Bike size={12} className="text-slate-400" />
                          {rider.vehicleType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start sm:self-center">
                    <button
                      onClick={() => openDispatchModal(rider)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-indigo-100 flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Send size={11} />
                      <span>派發廣告任務</span>
                    </button>
                    <button
                      onClick={() => openStartDispatchModal(rider)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-emerald-100 flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Play size={11} />
                      <span>開始派發</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Dispatched List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-emerald-50/25 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <h2 className="font-extrabold text-slate-800 text-sm">已派發廣告外送員 ({filteredDispatched.length})</h2>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              宣傳執行中
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {filteredDispatched.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium space-y-1">
                <p className="text-sm">目前沒有已被派發廣告的外送員</p>
                <p className="text-xs text-slate-300">
                  請在左側選擇審核通過的外送員並進行廣告派發
                </p>
              </div>
            ) : (
              filteredDispatched.map((rider) => {
                const daysLeft = getDaysRemaining(rider.dispatchExpiry);
                const isExpired = daysLeft <= 0;

                return (
                  <div key={rider.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      
                      {/* Rider high level info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-800 text-sm truncate">{rider.name}</span>
                          {rider.memberId && (
                            <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                              {rider.memberId}
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                            {rider.deliveryPlatform}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 text-xs font-semibold">
                          <span className="flex items-center gap-1">
                            <Smartphone size={12} className="text-slate-400" />
                            {rider.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-indigo-500" />
                            <span>{getFormattedRegion(rider)}</span>
                          </span>
                        </div>

                        {/* Dispatch specifics */}
                        <div className="mt-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-150 space-y-1">
                          <div className="flex justify-between text-xs text-slate-600">
                            <span className="font-bold">里程/時數目標：</span>
                            <span className="font-semibold text-slate-800">{rider.dispatchTarget || "未設定"}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-600">
                            <span className="font-bold">合約天數：</span>
                            <span className="font-semibold text-slate-800">{rider.dispatchDays} 天</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-600 items-center pt-1 border-t border-slate-100">
                            <span className="font-bold text-slate-500 flex items-center gap-1">
                              <Calendar size={11} />
                              廣告效期：
                            </span>
                            <span className="font-sans text-[11px] font-bold text-slate-700">
                              {rider.dispatchStartDate && rider.dispatchExpiry ? (
                                <span className="text-indigo-600 font-extrabold">{rider.dispatchStartDate} ~ {rider.dispatchExpiry} ({rider.dispatchDays} 天)</span>
                              ) : (
                                <span>自裝上擋泥板並回傳拍照起算 {rider.dispatchDays} 天</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side status and cancel action */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          {isExpired ? (
                            <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <ShieldAlert size={10} />
                              合約已屆期
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                              <CheckCircle2 size={10} />
                              等待拍照回傳 / 執行中
                            </span>
                          )}

                          {rider.dispatchEmailSent && (
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                              <Mail size={10} className="text-emerald-500" />
                              派發信件已寄出
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => openEditDispatchModal(rider)}
                          className="px-2.5 py-1 text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-150 hover:border-indigo-600 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="重新編輯派發日期及狀態"
                          id={`edit-dispatch-btn-${rider.id}`}
                        >
                          <Edit2 size={10} />
                          <span>編輯派發</span>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Dispatch Modal Dialog */}
      {isModalOpen && selectedRider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/20">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">派發廣告投放任務</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assign Advertisement to Rider</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Target Rider Quick Bio */}
              <div className="bg-indigo-50/40 border border-indigo-100/30 p-4 rounded-2xl flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white font-black text-lg rounded-xl flex items-center justify-center shrink-0">
                  {selectedRider.name[0]}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800 text-sm">{selectedRider.name}</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                      {selectedRider.deliveryPlatform}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                      {selectedRider.vehicleType}
                    </span>
                    {selectedRider.workType && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        selectedRider.workType === "正職"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}>
                        {selectedRider.workType}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-bold space-y-0.5">
                    <p>會員號碼：{selectedRider.memberId || "無"}</p>
                    <p>服務區域：{getFormattedRegion(selectedRider)}</p>
                    <p>聯絡信箱：{selectedRider.email}</p>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input 1: Ad days */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600 block">廣告投放合約天數 (天)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={dispatchDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setDispatchDays("");
                      } else {
                        const parsed = parseInt(val);
                        handleDaysChange(isNaN(parsed) ? "" : parsed);
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  />
                  {/* Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[14, 30, 60, 90].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleDaysChange(days)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                          Number(dispatchDays) === days
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {days} 天
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input 2: Mileage / Hours Target */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600 block">每月里程 / 時數目標</label>
                  <input
                    type="text"
                    value={dispatchTarget}
                    onChange={(e) => setDispatchTarget(e.target.value)}
                    placeholder="例如：每月 1000 公里 / 80 小時"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  />
                  {/* Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "每月 500 公里 / 50 小時",
                      "每月 1000 公里 / 80 小時",
                      "每月 1500 公里 / 120 小時"
                    ].map((targetOption) => (
                      <button
                        key={targetOption}
                        type="button"
                        onClick={() => setDispatchTarget(targetOption)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer truncate max-w-full ${
                          dispatchTarget === targetOption
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={targetOption}
                      >
                        {targetOption.split(" ")[1]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input 3: Start Date */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600 block">廣告執行開始日期</label>
                  <input
                    type="date"
                    value={dispatchStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  />
                </div>

                {/* Input 4: End Date */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600 block">廣告執行結束日期</label>
                  <input
                    type="date"
                    value={dispatchEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Show Email Preview Toggle */}
              <div className="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Mail size={13} />
                  <span>{showEmailPreview ? "隱藏" : "預覽"} 系統即將發送給外送夥伴的通知信件</span>
                </button>

                {showEmailPreview && (
                  <div className="mt-3 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 shadow-inner overflow-hidden font-mono text-[11px] leading-relaxed">
                    <div className="bg-slate-950 p-3 border-b border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      </div>
                      <span className="font-bold uppercase tracking-wider">自動信件預覽 (郵件系統代理)</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-slate-400 font-bold">收件人：</span>
                        <span className="text-indigo-300 font-bold">{selectedRider.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">主旨：</span>
                        <span className="text-emerald-400 font-black">【穿巷】恭喜您！您的廣告箱體任務已成功派發通知信</span>
                      </div>
                      <div className="border-t border-slate-800 my-2"></div>
                      <div className="text-slate-300 space-y-2 pt-1 font-sans">
                        <p>親愛的穿巷夥伴 <span className="text-white font-bold">{selectedRider.name}</span> 您好：</p>
                        <p>
                          感謝您對「穿巷外送廣告平台」的支持。經專員評估，您的外送箱（車牌：<span className="text-white font-bold">{selectedRider.plateNumber || "未提供車牌"}</span> / 外送平台：<span className="text-white font-bold">{selectedRider.deliveryPlatform}</span>）已正式通過審核，並為您成功指派了全新一期的廣告版位任務！
                        </p>
                        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1 font-mono text-xs">
                          <p className="text-indigo-300">📊 廣告投放任務明細：</p>
                          <p>📌 合約投放天數：<span className="text-white font-bold">{dispatchDays || 0} 天</span></p>
                          <p>📌 廣告執行起訖：<span className="text-emerald-400 font-bold">{dispatchStartDate} ~ {dispatchEndDate} (請於廣告執行日前安裝完成並回傳安裝照片至官方賴)</span></p>
                          <p>📌 指標里程與時數目標：<span className="text-white font-bold">{dispatchTarget || "未設定"}</span></p>
                          <p>📌 專屬會員號碼：<span className="text-white font-bold">{selectedRider.memberId || "待配發"}</span></p>
                        </div>
                        <p className="text-slate-400 text-[10px]">
                          * 貼心提醒：請您在每日出車前確認外送箱上的廣告貼膜保持清潔與平整。任務期間，系統將依據您回傳的每日跑單與里程照片進行數據稽核。若您有任何疑問，請透過 LINE ID: <span className="text-white font-bold">@alleyway_ad</span> 聯絡客服。
                        </p>
                        <p className="pt-2 text-right text-slate-400">穿巷移動媒體團隊 敬上</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDispatch}
                disabled={isSending}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <span>正在處理派發與寄信...</span>
                ) : (
                  <>
                    <Send size={13} />
                    <span>確認指派並發送通知信</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Dispatch Modal Dialog */}
      {isStartModalOpen && startModalRider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/20">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Play size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">開始派發廣告</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Start Ad Campaign</p>
                </div>
              </div>
              <button
                onClick={() => setIsStartModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Rider Summary Box */}
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-600 text-white font-black text-sm rounded-lg flex items-center justify-center shrink-0">
                  {startModalRider.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-800 text-xs truncate">{startModalRider.name}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{startModalRider.deliveryPlatform} • {startModalRider.phone}</p>
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block">廣告執行開始日期</label>
                <input
                  type="date"
                  value={directStartDate}
                  onChange={(e) => handleDirectStartDateChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block">廣告執行結束日期</label>
                <input
                  type="date"
                  value={directEndDate}
                  onChange={(e) => handleDirectEndDateChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>

              {/* Calculated Days Display / Input */}
              <div className="space-y-1.5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-800">合約投放天數 (天)</label>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    目前：{calculateDays(directStartDate, directEndDate)} 天
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={directDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setDirectDays("");
                      setDirectEndDate("");
                    } else {
                      const parsed = parseInt(val);
                      handleDirectDaysChange(isNaN(parsed) ? "" : parsed);
                    }
                  }}
                  placeholder="請輸入天數，將自動推算結束日期"
                  className="w-full px-3.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-mono"
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[14, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        handleDirectDaysChange(days);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        Number(directDays) === days
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {days} 天
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2 shrink-0">
              <button
                onClick={() => setIsStartModalOpen(false)}
                type="button"
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmStartDispatch}
                disabled={isSending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-100 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <span>處理中...</span>
                ) : (
                  <>
                    <Play size={12} />
                    <span>確認開始派發</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dispatch Modal Dialog */}
      {isEditModalOpen && editModalRider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/20">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">編輯派發廣告任務</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Edit Ad Campaign</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Rider Summary Box */}
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 text-white font-black text-sm rounded-lg flex items-center justify-center shrink-0">
                  {editModalRider.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-800 text-xs truncate">{editModalRider.name}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{editModalRider.deliveryPlatform} • {editModalRider.phone}</p>
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block">廣告執行開始日期</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => handleEditStartDateChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block">廣告執行結束日期</label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => handleEditEndDateChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                />
              </div>

              {/* Target */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block">指標里程與時數目標</label>
                <input
                  type="text"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  placeholder="例如：每月 1000 公里 / 80 小時"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                />
              </div>

              {/* Calculated Days Display / Input */}
              <div className="space-y-1.5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-850">合約投放天數 (天)</label>
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    目前：{calculateDays(editStartDate, editEndDate)} 天
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={editDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setEditDays("");
                      setEditEndDate("");
                    } else {
                      const parsed = parseInt(val);
                      handleEditDaysChange(isNaN(parsed) ? "" : parsed);
                    }
                  }}
                  placeholder="請輸入天數，將自動推算結束日期"
                  className="w-full px-3.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-mono"
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[14, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        handleEditDaysChange(days);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        Number(editDays) === days
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {days} 天
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer with dual groups (Cancel dispatch left, actions right) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
              {/* Cancel dispatch action with direct safety check */}
              <div>
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    type="button"
                    className="px-3 py-1.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    取消派發
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 bg-rose-50 border border-rose-100 p-1 rounded-lg">
                    <span className="text-[10px] text-rose-700 font-extrabold pl-1">確定取消？</span>
                    <button
                      onClick={handleCancelDispatchFromEdit}
                      disabled={isSending}
                      type="button"
                      className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-black hover:bg-rose-700 transition-all cursor-pointer"
                    >
                      是
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      type="button"
                      className="px-2 py-1 bg-white text-slate-600 border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      否
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  type="button"
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  關閉
                </button>
                <button
                  onClick={handleSaveEditDispatch}
                  disabled={isSending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <span>處理中...</span>
                  ) : (
                    <>
                      <Edit2 size={12} />
                      <span>儲存修改</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Success Modal Dialog */}
      {isBatchSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/25">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                  🎉
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">廣告任務批次派發成功！</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Batch Dispatch Completed</p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchSuccessModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
              <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                <p>已成功將 <strong>{batchSuccessCount}</strong> 位外送夥伴的狀態更新為「已寄送通知信」。</p>
                <p className="text-slate-500">此時，他們依舊保留在左側「未派發」名單中。當外送員正式確認或您收到回覆後，可點選各別外送夥伴旁的「<strong>開始派發</strong>」以正式將其移至「已派發廣告外送員」名單，使合約生效。</p>
              </div>

              {/* Email list box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <span>受指派者電子信箱 ({batchSuccessEmails.length})</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(batchSuccessEmails.join(", "));
                    }}
                    className="text-indigo-600 hover:text-indigo-800 cursor-pointer text-[10px]"
                  >
                    複製全部信箱
                  </button>
                </div>
                <textarea
                  readOnly
                  value={batchSuccessEmails.join(", ")}
                  className="w-full h-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none text-slate-600 resize-none"
                />
              </div>

              {/* Direct Gmail compose integration */}
              <div className="p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <Mail size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-800">一鍵群發通知郵件</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      點擊下方按鈕將自動開啟 Gmail 撰寫視窗，並已自動將此 {batchSuccessEmails.length} 位外送夥伴的信箱代入密件抄送 (BCC) 欄位，保護隱私不洩漏。
                    </p>
                  </div>
                </div>

                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(batchSuccessEmails.join(","))}&su=${encodeURIComponent("【外送廣告合約】恭喜您獲得廣告投放任務！")}&body=${encodeURIComponent(
                    `親愛的外送夥伴您好：\n\n感謝您參與我們的廣告投放計畫。您的申請已被審核通過！\n\n【合約投放詳情】\n• 廣告走期天數：${batchDays || 30} 天\n• 廣告指定指標目標：${batchTarget || "每月 1000 公里 / 80 小時"}\n• 預定執行區間：${batchStartDate || "即日起"} ~ ${batchEndDate || "合約天數期滿"}\n\n【後續執行流程說明】\n我們將於近期將廣告擋泥板與安裝說明郵寄給您。\n請於之後，根據指示將在三天內收到擋泥板、膠條正確安裝於您的外送車輛與外送箱上。\n安裝完成後，請於後台或回傳照片至此信箱、官方地址（須拍到車牌與完整擋泥板外觀）。\n確認回傳照片無誤後，我們將正式「開始發放」，合約即算正式生效！\n\n若有任何疑問，歡迎隨時與我們聯繫。預祝合作愉快！\n\n廣告運營團隊 敬上`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 transition-all cursor-pointer no-underline"
                >
                  <Send size={12} />
                  <span>開啟 Gmail 密件群發 (BCC)</span>
                </a>
              </div>

              {/* Email Content Copy Area */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <span>通知信範本預覽（供複製至其他收發信軟體）</span>
                  <button
                    onClick={() => {
                      const text = `親愛的外送夥伴您好：\n\n感謝您參與我們的廣告投放計畫。您的申請已被審核通過！\n\n【合約投放詳情】\n• 廣告走期天數：${batchDays || 30} 天\n• 廣告指定指標目標：${batchTarget || "每月 1000 公里 / 80 小時"}\n• 預定執行區間：${batchStartDate || "即日起"} ~ ${batchEndDate || "合約天數期滿"}\n\n【後續執行流程說明】\n我們將於近期將廣告擋泥板與安裝說明郵寄給您。\n請於之後，根據指示將在三天內收到擋泥板、膠條正確安裝於您的外送車輛與外送箱上。\n安裝完成後，請於後台或回傳照片至此信箱、官方地址（須拍到車牌與完整擋泥板外觀）。\n確認回傳照片無誤後，我們將正式「開始發放」，合約即算正式生效！\n\n若有任何疑問，歡迎隨時與我們聯繫。預祝合作愉快！\n\n廣告運營團隊 敬上`;
                      navigator.clipboard.writeText(text);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 cursor-pointer text-[10px]"
                  >
                    複製範本內容
                  </button>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed font-semibold whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {`親愛的外送夥伴您好：\n\n感謝您參與我們的廣告投放計畫。您的申請已被審核通過！\n\n【合約投放詳情】\n• 廣告走期天數：${batchDays || 30} 天\n• 廣告指定指標目標：${batchTarget || "每月 1000 公里 / 80 小時"}\n• 預定執行區間：${batchStartDate || "即日起"} ~ ${batchEndDate || "合約天數期滿"}\n\n【後續執行流程說明】\n我們將於近期將廣告擋泥板與安裝說明郵寄給您。\n請於之後，根據指示將在三天內收到擋泥板、膠條正確安裝於您的外送車輛與外送箱上。\n安裝完成後，請於後台或回傳照片至此信箱、官方地址（須拍到車牌與完整擋泥板外觀）。\n確認回傳照片無誤後，我們將正式「開始發放」，合約即算正式生效！`}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2 shrink-0">
              <button
                onClick={() => setIsBatchSuccessModalOpen(false)}
                type="button"
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer"
              >
                關閉並返回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
