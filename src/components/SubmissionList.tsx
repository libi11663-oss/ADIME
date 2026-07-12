import React, { useState, useMemo, ChangeEvent } from "react";
import { Submission, SubmissionFilter } from "../types";
import { Search, MapPin, Bike, Smartphone, Calendar, ArrowUpDown, Filter, X } from "lucide-react";

interface SubmissionListProps {
  submissions: Submission[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filters: SubmissionFilter;
  onFiltersChange: (filters: SubmissionFilter) => void;
}

export default function SubmissionList({
  submissions,
  selectedId,
  onSelect,
  filters,
  onFiltersChange,
}: SubmissionListProps) {
  const [sortByDate, setSortByDate] = useState<"desc" | "asc">("desc");

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (status: "all" | "pending" | "approved" | "rejected") => {
    onFiltersChange({ ...filters, status });
  };

  const handleFilterSelect = (key: keyof SubmissionFilter, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      vehicleType: "all",
      deliveryPlatform: "all",
    });
  };

  const hasActiveExtraFilters = filters.vehicleType !== "all" || filters.deliveryPlatform !== "all";

  // Filtered & Sorted submissions
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((sub) => {
        // Keyword Search (Name, Phone, Email, PlateNumber, MemberID, Area)
        const query = filters.search.toLowerCase().trim();
        const matchesSearch =
          !query ||
          sub.name.toLowerCase().includes(query) ||
          sub.phone.includes(query) ||
          sub.email.toLowerCase().includes(query) ||
          (sub.plateNumber && sub.plateNumber.toLowerCase().includes(query)) ||
          (sub.memberId && sub.memberId.toLowerCase().includes(query)) ||
          sub.area.toLowerCase().includes(query);

        // Status Filter
        const matchesStatus = filters.status === "all" || sub.status === filters.status;

        // Vehicle Type Filter
        const matchesVehicle = filters.vehicleType === "all" || sub.vehicleType === filters.vehicleType;

        // Delivery Platform Filter
        const matchesPlatform = filters.deliveryPlatform === "all" || sub.deliveryPlatform === filters.deliveryPlatform;

        return matchesSearch && matchesStatus && matchesVehicle && matchesPlatform;
      })
      .sort((a, b) => {
        const dateA = new Date(a.appliedAt).getTime();
        const dateB = new Date(b.appliedAt).getTime();
        return sortByDate === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [submissions, filters, sortByDate]);

  // Unique lists for quick filters
  const vehicleTypes = ["all", ...new Set(submissions.map((s) => s.vehicleType))];
  const platforms = ["all", ...new Set(submissions.map((s) => s.deliveryPlatform))];

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
      {/* Search & Tabs */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜尋姓名、電話、車牌、會員號碼、區域..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 text-slate-900 font-medium"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Status Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(["all", "pending", "approved", "rejected"] as const).map((st) => {
            const count = submissions.filter((s) => st === "all" || s.status === st).length;
            const labels = {
              all: "全部",
              pending: "待審核",
              approved: "已同意",
              rejected: "已拒絕",
            };
            const activeStyles = {
              all: "bg-slate-900 text-white shadow-sm font-bold",
              pending: "bg-amber-500 text-white shadow-sm font-bold shadow-amber-100",
              approved: "bg-emerald-600 text-white shadow-sm font-bold shadow-emerald-100",
              rejected: "bg-rose-600 text-white shadow-sm font-bold shadow-rose-100",
            };
            const inactiveStyles = "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50";

            const isActive = filters.status === st;

            return (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`flex-1 py-1.5 text-xs rounded-md text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  isActive ? activeStyles[st] : inactiveStyles
                }`}
              >
                <span>{labels[st]}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.25 rounded-full ${
                    isActive
                      ? st === "all"
                        ? "bg-slate-800 text-slate-300"
                        : "bg-black/15 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dropdown Filters & Sorting */}
        <div className="flex flex-wrap gap-2 pt-1 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {/* Vehicle Type select */}
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">載具:</span>
              <select
                className="text-xs bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-slate-700 focus:outline-hidden focus:border-indigo-500 font-medium"
                value={filters.vehicleType}
                onChange={(e) => handleFilterSelect("vehicleType", e.target.value)}
              >
                <option value="all">全部載具</option>
                {vehicleTypes.filter(v => v !== "all").map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform select */}
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">平台:</span>
              <select
                className="text-xs bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-slate-700 focus:outline-hidden focus:border-indigo-500 font-medium"
                value={filters.deliveryPlatform}
                onChange={(e) => handleFilterSelect("deliveryPlatform", e.target.value)}
              >
                <option value="all">全部平台</option>
                {platforms.filter(p => p !== "all").map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sorting Toggle */}
            <button
              onClick={() => setSortByDate(sortByDate === "desc" ? "asc" : "desc")}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors text-xs flex items-center space-x-1 cursor-pointer font-medium"
              title="按申請時間排序"
            >
              <ArrowUpDown size={14} />
              <span>{sortByDate === "desc" ? "最新優先" : "最舊優先"}</span>
            </button>

            {/* Clear filter */}
            {(hasActiveExtraFilters || filters.search || filters.status !== "all") && (
              <button
                onClick={clearFilters}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-0.5"
              >
                <X size={10} />
                <span>清除篩選</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Geometric Design column header */}
      <div className="bg-slate-50 border-b border-slate-200 flex py-2.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <div className="w-1/2">申請人與聯絡資訊</div>
        <div className="w-1/2 text-right">載具地區狀態</div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-64 space-y-2">
            <Filter size={32} className="text-slate-300 stroke-1" />
            <p className="text-sm font-semibold">找不到符合條件的申請名單</p>
            <p className="text-xs text-slate-400">試著修改搜尋關鍵字或清除篩選條件</p>
          </div>
        ) : (
          filteredSubmissions.map((sub) => {
            const isSelected = selectedId === sub.id;
            const statusColors = {
              pending: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
              approved: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
              rejected: { bg: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
            };
            const currentStatus = statusColors[sub.status] || statusColors.pending;

            return (
              <div
                key={sub.id}
                onClick={() => onSelect(sub.id)}
                className={`p-4 cursor-pointer hover:bg-slate-50/70 transition-all duration-150 relative ${
                  isSelected ? "bg-indigo-50/30 border-l-4 border-indigo-500" : "border-l-4 border-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">{sub.name}</span>
                    <span className="text-xs text-slate-500 font-medium">{sub.phone}</span>
                  </div>
                  {/* Status badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center space-x-1 ${currentStatus.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
                    <span>
                      {sub.status === "pending" && "待審核"}
                      {sub.status === "approved" && "已同意"}
                      {sub.status === "rejected" && "已拒絕"}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <div className="flex items-center space-x-0.5">
                    <Bike size={12} className="text-slate-400" />
                    <span className="font-medium">
                      {sub.vehicleType}
                      {sub.plateNumber && sub.plateNumber !== "無" && ` (${sub.plateNumber})`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-0.5">
                    <Smartphone size={12} className="text-slate-400" />
                    <span className="bg-slate-100 text-slate-600 px-1.5 rounded text-[10px] font-bold">
                      {sub.deliveryPlatform}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2.5 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-0.5 font-medium">
                    <MapPin size={11} className="text-slate-400" />
                    <span>{sub.area}</span>
                  </div>
                  <div className="flex items-center space-x-0.5 font-mono text-[10px]">
                    <Calendar size={11} className="text-slate-400" />
                    <span>{formatDate(sub.appliedAt)}</span>
                  </div>
                </div>

                {sub.memberId && (
                  <div className="mt-2 inline-flex items-center bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 font-mono">
                    會員號: {sub.memberId}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-slate-50 text-[10px] font-bold text-slate-400 border-t border-slate-200 text-center rounded-b-xl uppercase tracking-wider">
        顯示 {filteredSubmissions.length} 筆資料 (共 {submissions.length} 筆)
      </div>
    </div>
  );
}
