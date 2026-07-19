import React, { useState, useMemo, ChangeEvent } from "react";
import { Submission, SubmissionFilter } from "../types";
import { Search, MapPin, Bike, Smartphone, Calendar, ArrowUpDown, Filter, X } from "lucide-react";

export function getFormattedRegion(sub: Submission): string {
  const area = (sub.area || "").trim();
  const address = (sub.address || "").trim();
  const primary = (sub.primaryRegion || "").trim();

  // Parse selectedDistricts
  let dists: string[] = [];
  if (sub.selectedDistricts) {
    const sd = sub.selectedDistricts;
    if (Array.isArray(sd)) {
      dists = sd;
    } else if (typeof sd === "string") {
      const trimmed = sd.trim();
      if (trimmed.startsWith("[")) {
        try {
          dists = JSON.parse(trimmed);
        } catch {
          dists = trimmed.split(/[,，、\s]+/).filter(Boolean);
        }
      } else {
        dists = trimmed.split(/[,，、\s]+/).filter(Boolean);
      }
    }
  }

  const mainCities = [
    "台北市", "新北市", "基隆市", "桃園市", "新竹縣", "新竹市", 
    "苗栗縣", "台中市", "彰化縣", "南投縣", "雲林縣", "嘉義縣", 
    "嘉義市", "台南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", 
    "台東縣", "澎湖縣", "金門縣", "連江縣"
  ];

  // Detect city
  let detectedCity = "";
  for (const cand of [area, primary, address]) {
    for (const city of mainCities) {
      if (cand.includes(city)) {
        detectedCity = city;
        break;
      }
    }
    if (detectedCity) break;
  }

  if (dists.length > 0) {
    const cleanDists = dists.map(d => {
      let clean = d.trim();
      if (detectedCity && clean.startsWith(detectedCity)) {
        clean = clean.slice(detectedCity.length);
      }
      return clean;
    }).filter(Boolean);
    
    if (detectedCity) {
      return detectedCity + cleanDists.join("、");
    }
    return cleanDists.join("、");
  }

  // Candidates for extraction
  const candidates = [area, address, primary].filter(Boolean);

  for (const cand of candidates) {
    for (const city of mainCities) {
      if (cand.includes(city)) {
        const idx = cand.indexOf(city);
        const afterCity = cand.slice(idx + city.length).trim();
        const distMatch = afterCity.match(/^([^區鄉鎮市\s]{1,5}[區鄉鎮市])/);
        if (distMatch && distMatch[1]) {
          return city + distMatch[1];
        }
      }
    }
  }

  for (const cand of candidates) {
    const distMatch = cand.match(/([^區鄉鎮市\s]{1,5}[區鄉鎮])/);
    if (distMatch && distMatch[1]) {
      let cityPrefix = "";
      for (const city of mainCities) {
        if (candidates.some(c => c.includes(city))) {
          cityPrefix = city;
          break;
        }
      }
      return cityPrefix + distMatch[1];
    }
  }

  // Common district names search
  const commonDistricts = ["新莊", "板橋", "中和", "永和", "三重", "新店", "大安", "信義", "中山", "內湖", "士林"];
  for (const cand of candidates) {
    for (const dist of commonDistricts) {
      if (cand.includes(dist)) {
        let cityPrefix = "";
        for (const city of mainCities) {
          if (candidates.some(c => c.includes(city))) {
            cityPrefix = city;
            break;
          }
        }
        return cityPrefix + dist + (dist.endsWith("區") ? "" : "區");
      }
    }
  }

  // If we have any of the candidates, return the first non-empty one
  const longest = candidates.sort((a, b) => b.length - a.length)[0];
  if (longest) {
    return longest;
  }

  return "未設定地區";
}

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
        const formattedRegion = getFormattedRegion(sub).toLowerCase();
        const districtsStr = Array.isArray(sub.selectedDistricts)
          ? sub.selectedDistricts.join(",")
          : typeof sub.selectedDistricts === "string"
          ? sub.selectedDistricts
          : "";
        const matchesSearch =
          !query ||
          sub.name.toLowerCase().includes(query) ||
          sub.phone.includes(query) ||
          sub.email.toLowerCase().includes(query) ||
          (sub.plateNumber && sub.plateNumber.toLowerCase().includes(query)) ||
          (sub.memberId && sub.memberId.toLowerCase().includes(query)) ||
          formattedRegion.includes(query) ||
          (sub.area && sub.area.toLowerCase().includes(query)) ||
          (sub.primaryRegion && sub.primaryRegion.toLowerCase().includes(query)) ||
          (sub.address && sub.address.toLowerCase().includes(query)) ||
          (sub.notes && sub.notes.toLowerCase().includes(query)) ||
          districtsStr.toLowerCase().includes(query);

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
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-bold text-slate-800 text-sm">{sub.name}</span>
                    <span className="text-xs text-slate-500 font-medium font-mono">{sub.phone}</span>
                    {sub.workType && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        sub.workType === "正職"
                          ? "bg-purple-50 text-purple-700 border-purple-200 animate-pulse"
                          : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}>
                        {sub.workType}
                      </span>
                    )}
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

                <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-xs text-slate-500 mt-2">
                  {/* Vehicle Type & Model */}
                  <div className="flex items-center space-x-1">
                    <Bike size={12} className="text-indigo-500" />
                    <span className="font-semibold text-slate-700">
                      {sub.vehicleType}
                      {(sub.motorcycleModel || sub.adLocation) && (
                        <span className="text-slate-400 font-normal ml-1">
                          ({sub.motorcycleModel || sub.adLocation})
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Delivery Platform */}
                  <div className="flex items-center space-x-1">
                    <Smartphone size={12} className="text-slate-400" />
                    {(() => {
                      const platform = sub.deliveryPlatform;
                      let badgeStyle = "bg-slate-50 text-slate-600 border-slate-200";
                      if (platform.includes("Foodpanda") || platform.toLowerCase().includes("panda") || platform.includes("熊貓")) {
                        badgeStyle = "bg-pink-50 text-pink-600 border-pink-100";
                      } else if (platform.includes("UberEats") || platform.toLowerCase().includes("uber") || platform.includes("優食")) {
                        badgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
                      } else if (platform.includes("Lalamove")) {
                        badgeStyle = "bg-orange-50 text-orange-600 border-orange-100";
                      }
                      return (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeStyle}`}>
                          {platform}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Plate Number License Plate representation */}
                  {sub.plateNumber && sub.plateNumber !== "無" && (
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] bg-white border border-slate-300 font-mono text-slate-800 px-1.5 py-0.5 rounded font-black shadow-2xs select-none uppercase">
                        {sub.plateNumber}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-3 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1 font-medium w-[65%] overflow-hidden">
                    <MapPin size={11} className="text-indigo-500 shrink-0" />
                    <span className="truncate text-slate-700 font-bold" title={`登記服務區域: ${sub.area || "無"} | 常跑地區: ${sub.primaryRegion || "無"} | 聯絡地址: ${sub.address || "無"}`}>
                      {getFormattedRegion(sub)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-0.5 font-mono text-[10px] w-[35%] justify-end shrink-0">
                    <Calendar size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{formatDate(sub.appliedAt)}</span>
                  </div>
                </div>

                {/* Sub row: member ID or Note icon */}
                <div className="flex justify-between items-center mt-2">
                  {sub.memberId ? (
                    <div className="inline-flex items-center bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 font-mono">
                      會員號: {sub.memberId}
                    </div>
                  ) : <div />}

                  {sub.notes && (
                    <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50/50 px-1.5 py-0.5 rounded flex items-center space-x-0.5 border border-indigo-100/50">
                      <span>💬 有備註留言</span>
                    </span>
                  )}
                </div>
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
