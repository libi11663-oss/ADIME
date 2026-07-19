import { useState, useEffect } from "react";
import { Submission } from "../types";
import { getFormattedRegion } from "./SubmissionList";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Bike,
  Smartphone,
  Eye,
  Check,
  X,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Clipboard,
  ExternalLink,
  Edit2,
  Save,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  Clock,
  Map,
  TrendingUp
} from "lucide-react";

// Pre-defined quick rejection reasons
const QUICK_REJECTIONS = [
  "外送載具與登載不符（照片中為自行車，登載為機車）。",
  "廣告黏貼面積不符合規範，可視度太低。",
  "無有效車牌或登載車牌資訊錯誤。",
  "外送箱損壞或過於髒污，無法提供良好廣告觀瞻。",
  "目前該行政區名額已額滿，列入候補名單。"
];

interface SubmissionDetailProps {
  submission: Submission | null;
  submissions: Submission[];
  onApprove: (id: string, memberId: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
}

// Helper to get Taiwan ID Card County/City Letter
function getTaiwanCountyLetter(area: string): string {
  if (!area) return "A";
  const str = area.trim();
  if (str.includes("台北") || str.includes("臺北")) return "A";
  if (str.includes("台中") || str.includes("臺中")) return "B";
  if (str.includes("基隆")) return "C";
  if (str.includes("台南") || str.includes("臺南")) return "D";
  if (str.includes("高雄")) return "E";
  if (str.includes("新北")) return "F";
  if (str.includes("宜蘭")) return "G";
  if (str.includes("桃園")) return "H";
  if (str.includes("嘉義市")) return "I";
  if (str.includes("新竹縣")) return "J";
  if (str.includes("苗栗")) return "K";
  if (str.includes("南投")) return "M";
  if (str.includes("彰化")) return "N";
  if (str.includes("新竹市")) return "O";
  if (str.includes("新竹")) return "O"; // general fallback for Hsinchu
  if (str.includes("雲林")) return "P";
  if (str.includes("嘉義縣") || (str.includes("嘉義") && !str.includes("市"))) return "Q";
  if (str.includes("屏東")) return "T";
  if (str.includes("花蓮")) return "U";
  if (str.includes("台東") || str.includes("臺東")) return "V";
  if (str.includes("金門")) return "W";
  if (str.includes("澎湖")) return "X";
  if (str.includes("連江")) return "Z";
  return "A"; // default to A
}

// Generate the specific Taiwan county + workType prefix + year/month sequential ID
function generateMemberId(sub: Submission, allSubmissions: Submission[]): string {
  const combinedLocation = `${sub.primaryRegion || ""} ${sub.area || ""} ${sub.address || ""}`;
  const firstLetter = getTaiwanCountyLetter(combinedLocation);
  
  const workTypeNormalized = (sub.workType || "").trim();
  const secondLetter = workTypeNormalized === "正職" ? "F" : "P";
  
  const now = new Date();
  const yearPart = String(now.getFullYear()).slice(-2); // e.g. "26"
  const monthPart = String(now.getMonth() + 1); // e.g. "7"
  
  // Find current maximum serial for this month and year
  const regex = new RegExp(`^[A-Z]{2}${yearPart}${monthPart}(\\d{3})$`);
  let maxSerial = 0;
  
  allSubmissions.forEach(s => {
    if (s.memberId) {
      const match = s.memberId.match(regex);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSerial) {
          maxSerial = seq;
        }
      }
    }
  });
  
  const nextSerial = maxSerial + 1;
  const serialPart = String(nextSerial).padStart(3, "0"); // e.g. "001"
  
  return `${firstLetter}${secondLetter}${yearPart}${monthPart}${serialPart}`;
}

export default function SubmissionDetail({
  submission,
  submissions = [],
  onApprove,
  onReject,
  onSaveNotes,
}: SubmissionDetailProps) {
  // Action states
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [memberIdInput, setMemberIdInput] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  
  // Notes state
  const [notesText, setNotesText] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
 
  // Status updates
  const [submitting, setSubmitting] = useState(false);
 
  // Email Notification States
  const [sendEmailNotify, setSendEmailNotify] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
 
  // Update states when selected submission changes
  useEffect(() => {
    if (submission) {
      setNotesText(submission.notes || "");
      setIsEditingNotes(false);
      setIsApproving(false);
      setIsRejecting(false);
      
      const hasEmail = submission.email && submission.email.trim() !== "" && submission.email.trim() !== "無";
      setSendEmailNotify(!!hasEmail);
      
      // Pre-fill member code suggestion
      if (submission.memberId) {
        setMemberIdInput(submission.memberId);
      } else {
        setMemberIdInput(generateMemberId(submission, submissions));
      }
 
      const reasonStr = submission.rejectionReason || "";
      setRejectionReason(reasonStr);
      
      // Sync checkboxes
      const matched = QUICK_REJECTIONS.filter(r => reasonStr.includes(r));
      setSelectedReasons(matched);
    }
  }, [submission, submissions]);
 
  if (!submission) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center h-[calc(100vh-180px)] min-h-[500px] p-8 text-center text-slate-400">
        <div className="p-4 bg-indigo-50 rounded-full text-indigo-500 mb-4 animate-pulse">
          <Layers size={36} className="stroke-1.5" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">未選擇審核項目</h3>
        <p className="text-xs max-w-xs text-slate-500 font-medium leading-relaxed">
          請點選左側名單中的外送員申請，以在此查看詳細申請文件、車身與外送箱相片、並進行同意或拒絕審核。
        </p>
      </div>
    );
  }
 
  // Toggle quick rejection reason
  const handleToggleReason = (reason: string) => {
    let nextReasons: string[];
    if (selectedReasons.includes(reason)) {
      nextReasons = selectedReasons.filter((r) => r !== reason);
    } else {
      nextReasons = [...selectedReasons, reason];
    }
    setSelectedReasons(nextReasons);
    setRejectionReason(nextReasons.join("\n"));
  };
 
  // Auto generate new member ID
  const handleRegenerateId = () => {
    setMemberIdInput(generateMemberId(submission, submissions));
  };

  // Notes save handler
  const handleSaveNotesClick = async () => {
    setIsSavingNotes(true);
    try {
      await onSaveNotes(submission.id, notesText);
      setIsEditingNotes(false);
    } catch (e) {
      alert("儲存備註失敗，請稍後再試。");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Submit Approval
  const handleSubmitApprove = async () => {
    if (!memberIdInput.trim()) {
      alert("請輸入或產生會員號碼！");
      return;
    }
    setSubmitting(true);
    try {
      await onApprove(submission.id, memberIdInput.trim());
      setIsApproving(false);
      
      // Auto-trigger email modal if enabled and recipient has email
      if (sendEmailNotify && submission.email && submission.email.trim() !== "" && submission.email.trim() !== "無") {
        const subject = `【穿巷外送廣告】您的外送員廣告合作夥伴申請已審核通過！`;
        const body = `親愛的 ${submission.name} 您好：

感謝您申請加入「穿巷外送廣告」合作夥伴！

您的外送員廣告申請檔案已審核通過。
以下是您的穿巷合作夥伴資訊：

■ 會員編號：${memberIdInput.trim()}
■ 外送平台：${submission.deliveryPlatform}
■ 外送員屬性：${submission.workType || "兼職"}
■ 服務區域：${submission.area}
■ 載具類型：${submission.vehicleType} (車牌：${submission.plateNumber || "無"})

請於廣告合作生效日前安裝並回報照片完成。

我們後續將會有專員與您聯繫，協助進行廣告看板的安裝事宜。
若有任何疑問，歡迎隨時回覆本信。

穿巷外送廣告 團隊 敬上`;
        
        setEmailTarget(submission.email.trim());
        setEmailSubject(subject);
        setEmailBody(body);
        setCopiedEmail(false);
        setShowEmailModal(true);
      }
    } catch (e) {
      alert("審核失敗，請確認網路與資料庫狀態。");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Rejection
  const handleSubmitReject = async () => {
    if (!rejectionReason.trim()) {
      alert("請填寫拒絕原因！");
      return;
    }
    setSubmitting(true);
    try {
      await onReject(submission.id, rejectionReason.trim());
      setIsRejecting(false);

      // Auto-trigger email modal if enabled and recipient has email
      if (sendEmailNotify && submission.email && submission.email.trim() !== "" && submission.email.trim() !== "無") {
        const subject = `【穿巷外送廣告】您的外送員廣告合作夥伴申請審核退件通知`;
        const body = `親愛的 ${submission.name} 您好：

感謝您對「穿巷外送廣告」合作夥伴計劃的關注與申請。

很抱歉通知您，您的外送員廣告申請檔案經審核後暫未通過。
主要原因如下：

■ 審核退件原因：
${rejectionReason.trim()}

您可以根據上述審核意見調整後，重新提交您的申請檔案。
若有任何疑問，歡迎隨時回覆本信。

穿巷外送廣告 團隊 敬上`;

        setEmailTarget(submission.email.trim());
        setEmailSubject(subject);
        setEmailBody(body);
        setCopiedEmail(false);
        setShowEmailModal(true);
      }
    } catch (e) {
      alert("審核失敗，請確認網路與資料庫狀態。");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper formats
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-180px)] min-h-[500px] overflow-hidden">
      {/* Detail Header */}
      <div className="p-4.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{submission.name}</h2>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                submission.status === "pending"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : submission.status === "approved"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {submission.status === "pending" && "待審核"}
              {submission.status === "approved" && "已同意"}
              {submission.status === "rejected" && "已拒絕"}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5 font-semibold">GUID: {submission.id}</p>
        </div>

        {submission.status === "approved" && submission.memberId && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">穿巷會員號碼</span>
            <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 inline-block font-mono">
              {submission.memberId}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Row 1: Contact Card & Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Base Info Cards */}
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 flex items-center space-x-1 uppercase tracking-wider">
                <User size={13} className="text-indigo-500" />
                <span>聯絡資訊 & 帳戶</span>
              </h3>

              <div className="space-y-2 text-sm text-slate-700 font-medium">
                <div className="flex items-center space-x-2">
                  <Phone size={14} className="text-slate-400" />
                  <span className="font-mono">{submission.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail size={14} className="text-slate-400" />
                  <span className="break-all">{submission.email || "無"}</span>
                </div>
                {submission.lineId && (
                  <div className="flex items-center space-x-2">
                    <MessageSquare size={14} className="text-emerald-500" />
                    <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded border border-emerald-100 font-mono">
                      LINE ID: {submission.lineId}
                    </span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <MapPin size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 text-xs block font-bold leading-none mb-0.5">登記區域 / 服務行政區</span>
                    <span className="text-sm font-bold text-slate-800">{getFormattedRegion(submission)}</span>
                  </div>
                </div>
                {submission.address && (
                  <div className="flex items-start space-x-2 pt-1 border-t border-slate-100">
                    <MapPin size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-xs block font-bold leading-none mb-0.5">聯絡地址</span>
                      <span className="text-xs">{submission.address}</span>
                    </div>
                  </div>
                )}
                {submission.selectedDistricts && (
                  <div className="flex items-start space-x-2 pt-1.5 border-t border-slate-100">
                    <MapPin size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-xs block font-bold leading-none mb-1">常跑區域 (selectedDistricts)</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(() => {
                          const sd = submission.selectedDistricts;
                          let arr: string[] = [];
                          if (Array.isArray(sd)) {
                            arr = sd;
                          } else if (typeof sd === "string") {
                            const trimmed = sd.trim();
                            if (trimmed.startsWith("[")) {
                              try {
                                arr = JSON.parse(trimmed);
                              } catch {
                                arr = trimmed.split(/[,，、\s]+/).filter(Boolean);
                              }
                            } else {
                              arr = trimmed.split(/[,，、\s]+/).filter(Boolean);
                            }
                          }
                          if (arr.length === 0) {
                            return <span className="text-xs text-slate-400">無</span>;
                          }
                          return arr.map((dist, idx) => (
                            <span
                              key={idx}
                              className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-100"
                            >
                              {dist}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                )}
                {submission.bankAccount && (
                  <div className="flex items-start space-x-2 pt-1.5 border-t border-slate-100">
                    <CreditCard size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-xs block font-bold leading-none mb-0.5">銀行帳號</span>
                      <span className="font-mono text-xs font-bold text-slate-800">{submission.bankAccount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 flex items-center space-x-1 uppercase tracking-wider">
                <Bike size={13} className="text-indigo-500" />
                <span>外送載具、跑單與區域</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                <div>
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">載具類型</span>
                  <span className="font-bold flex items-center space-x-1 mt-0.5 text-slate-800">
                    <Bike size={14} className="text-indigo-600" />
                    <span>{submission.vehicleType}</span>
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">車牌號碼</span>
                  {submission.plateNumber && submission.plateNumber !== "無" ? (
                    <div className="inline-block mt-1 px-3 py-1 bg-white border border-slate-400 rounded shadow-xs text-center min-w-[100px]">
                      <div className="text-[8px] font-black text-slate-400 border-b border-slate-100 leading-none pb-0.5 tracking-widest uppercase">Taiwan</div>
                      <div className="font-mono text-sm font-black text-slate-800 tracking-wider pt-0.5 leading-none">
                        {submission.plateNumber}
                      </div>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-500 mt-0.5 block text-xs">
                      無車牌
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">外送平台</span>
                  <span className="font-bold flex items-center space-x-1 mt-1">
                    <Smartphone size={13} className="text-indigo-600" />
                    {(() => {
                      const platform = submission.deliveryPlatform;
                      let badgeStyle = "bg-slate-50 text-slate-700 border-slate-200";
                      if (platform.includes("Foodpanda") || platform.toLowerCase().includes("panda") || platform.includes("熊貓")) {
                        badgeStyle = "bg-pink-50 text-pink-700 border-pink-100";
                      } else if (platform.includes("UberEats") || platform.toLowerCase().includes("uber") || platform.includes("優食")) {
                        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                      } else if (platform.includes("Lalamove")) {
                        badgeStyle = "bg-orange-50 text-orange-700 border-orange-100";
                      }
                      return (
                        <span className={`px-2 py-0.5 rounded text-xs font-black border ${badgeStyle}`}>
                          {platform}
                        </span>
                      );
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">機車車型</span>
                  <span className="font-bold text-xs mt-1 block text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block font-mono">
                    {submission.motorcycleModel || submission.adLocation || "無"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">外送員屬性</span>
                  <span className="font-bold flex items-center space-x-1 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-black border ${
                      submission.workType === "正職"
                        ? "bg-purple-50 text-purple-700 border-purple-100"
                        : "bg-indigo-50 text-indigo-700 border-indigo-100"
                    }`}>
                      {submission.workType || "兼職"}
                    </span>
                  </span>
                </div>
                
                {/* Custom fields row */}
                <div className="col-span-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider flex items-center gap-1">
                      <Map size={11} className="text-indigo-500" />
                      <span>常跑縣市</span>
                    </span>
                    <span className="font-extrabold text-xs text-slate-800 mt-0.5 block">
                      {submission.primaryRegion || submission.area || "未填寫"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp size={11} className="text-indigo-500" />
                      <span>平均跑單數</span>
                    </span>
                    <span className="font-extrabold text-xs text-slate-800 mt-0.5 block font-mono">
                      {submission.weeklyOrders ? `${submission.weeklyOrders}` : "未填寫"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={11} className="text-indigo-500" />
                      <span>每周天數</span>
                    </span>
                    <span className="font-extrabold text-xs text-slate-800 mt-0.5 block font-mono">
                      {submission.weeklyDays ? `${submission.weeklyDays}` : "未填寫"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider flex items-center gap-1">
                      <Clock size={11} className="text-indigo-500" />
                      <span>每天時數</span>
                    </span>
                    <span className="font-extrabold text-xs text-slate-800 mt-0.5 block font-mono">
                      {submission.dailyHours ? `${submission.dailyHours}` : "未填寫"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Preview Container */}
          <div className="border border-slate-200 bg-slate-50/30 rounded-xl p-4.5 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-400 flex items-center space-x-1 uppercase tracking-wider">
                  <Eye size={13} className="text-indigo-500" />
                  <span>申請照片 (車身/外送箱)</span>
                </h3>
                <a
                  href={submission.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center space-x-0.5"
                >
                  <ExternalLink size={11} />
                  <span>開新分頁</span>
                </a>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-slate-200 h-36 bg-slate-100 group shadow-inner">
                <img
                  src={submission.photoUrl}
                  alt="外送箱照片"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent p-2">
                  <p className="text-[10px] text-white/90 font-medium">
                    外送員上傳之車身及廣告安裝箱實拍圖
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-bold text-slate-400 flex flex-wrap gap-x-2 gap-y-1 items-center pt-2 border-t border-slate-100 uppercase tracking-wider">
              <Calendar size={12} className="text-slate-400" />
              <span>申請：{formatDate(submission.appliedAt)}</span>
              {submission.reviewedAt && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>審核：{formatDate(submission.reviewedAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes Editor Card */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-400 flex items-center space-x-1 uppercase tracking-wider">
              <FileText size={13} className="text-indigo-500" />
              <span>內部管理備註 (僅管理員可見)</span>
            </h3>
            {!isEditingNotes ? (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center space-x-0.5 cursor-pointer"
              >
                <Edit2 size={11} />
                <span>編輯備註</span>
              </button>
            ) : (
              <button
                onClick={handleSaveNotesClick}
                disabled={isSavingNotes}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-0.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={11} />
                <span>{isSavingNotes ? "儲存中..." : "儲存"}</span>
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <textarea
              className="w-full text-xs p-2.5 border border-indigo-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              rows={3}
              placeholder="輸入外送員上線時間、偏好地區、廣告物資配送紀錄等內部資訊..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
            />
          ) : (
            <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-dashed border-slate-200 font-medium">
              {submission.notes ? submission.notes : "暫無內部備註，可點選編輯新增。"}
            </div>
          )}
        </div>

        {/* If Rejected, display rejection reason */}
        {submission.status === "rejected" && submission.rejectionReason && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start space-x-2">
            <AlertTriangle className="text-rose-500 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <h4 className="text-xs font-bold">拒絕退件原因</h4>
              <p className="text-xs mt-1 text-rose-700 font-medium leading-relaxed">{submission.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Workflow actions for PENDING submissions */}
        {submission.status === "pending" && !isApproving && !isRejecting && (
          <div className="flex space-x-3 pt-2">
            {/* APPROVE button */}
            <button
              onClick={() => setIsApproving(true)}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-50 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Check size={16} />
              <span>審核通過 (同意)</span>
            </button>

            {/* REJECT button */}
            <button
              onClick={() => setIsRejecting(true)}
              className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-md shadow-rose-50 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <X size={16} />
              <span>審核拒絕 (退件)</span>
            </button>
          </div>
        )}

        {/* APPROVE FORM ACTION */}
        {isApproving && (
          <div className="p-4 bg-emerald-50/30 border border-emerald-200 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>審核通過手續</span>
              </h4>
              <button
                onClick={() => setIsApproving(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                取消
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                會員編號號碼 (請產生或手動輸入)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={memberIdInput}
                  onChange={(e) => setMemberIdInput(e.target.value)}
                  placeholder="會員號碼 (e.g., CX-10204)"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
                />
                <button
                  type="button"
                  onClick={handleRegenerateId}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>自動產生</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                系統已為您推薦了一組最新不重複的會員號碼格式。確認無誤後點選送出更新。
              </p>
            </div>

            {/* Email Notification Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-start space-x-2">
              <input
                type="checkbox"
                id="approveEmailNotify"
                checked={sendEmailNotify}
                disabled={!submission.email || submission.email.trim() === "" || submission.email.trim() === "無"}
                onChange={(e) => setSendEmailNotify(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="approveEmailNotify" className="text-xs font-semibold text-slate-700 cursor-pointer select-none leading-relaxed">
                同時開啟 Email 通知小幫手 (寄送：<span className="font-mono text-emerald-700 font-bold">{submission.email || "無"}</span>)
                {(!submission.email || submission.email.trim() === "" || submission.email.trim() === "無") && (
                  <span className="block text-[10px] text-slate-400 font-bold mt-0.5">※ 此申請人未填寫有效的電子信箱</span>
                )}
              </label>
            </div>

            <button
              onClick={handleSubmitApprove}
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-50 flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "處理中..." : "確定通過並寫回資料庫"}
            </button>
          </div>
        )}

        {/* REJECT FORM ACTION */}
        {isRejecting && (
          <div className="p-4 bg-rose-50/30 border border-rose-200 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-rose-800 flex items-center space-x-1">
                <AlertTriangle size={14} className="text-rose-600" />
                <span>拒絕申請手續</span>
              </h4>
              <button
                onClick={() => setIsRejecting(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                取消
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  請點選常用快速原因 (可複選 / 勾選自動帶入下方)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {QUICK_REJECTIONS.map((reason, idx) => {
                    const isChecked = selectedReasons.includes(reason);
                    return (
                      <label
                        key={idx}
                        className={`flex items-start space-x-2.5 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                          isChecked
                            ? "bg-rose-50/60 border-rose-300 text-rose-900 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleReason(reason)}
                          className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer h-4 w-4 shrink-0"
                        />
                        <span className="font-semibold leading-relaxed">{reason}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  詳細拒絕原因描述 (必填，可自由編輯)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRejectionReason(val);
                    // Update checkboxes dynamically based on which pre-defined reasons are in the typed text
                    const matched = QUICK_REJECTIONS.filter(r => val.includes(r));
                    setSelectedReasons(matched);
                  }}
                  placeholder="請在此輸入，或點選上方快速原因（可多選）進行勾選..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white leading-relaxed"
                />
              </div>
            </div>

            {/* Email Notification Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-start space-x-2">
              <input
                type="checkbox"
                id="rejectEmailNotify"
                checked={sendEmailNotify}
                disabled={!submission.email || submission.email.trim() === "" || submission.email.trim() === "無"}
                onChange={(e) => setSendEmailNotify(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer h-4 w-4 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="rejectEmailNotify" className="text-xs font-semibold text-slate-700 cursor-pointer select-none leading-relaxed">
                同時開啟 Email 通知小幫手 (寄送：<span className="font-mono text-rose-700 font-bold">{submission.email || "無"}</span>)
                {(!submission.email || submission.email.trim() === "" || submission.email.trim() === "無") && (
                  <span className="block text-[10px] text-slate-400 font-bold mt-0.5">※ 此申請人未填寫有效的電子信箱</span>
                )}
              </label>
            </div>

            <button
              onClick={handleSubmitReject}
              disabled={submitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-50 flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "處理中..." : "確定拒絕申請"}
            </button>
          </div>
        )}
      </div>

      {/* Footer metadata */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider">
        穿巷外送廣告 CRM 管理控制台 • Firebase Firestore 安全連接中
      </div>

      {/* Email Notification Helper Modal Overlay */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-indigo-900 p-4.5 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Mail size={18} className="text-indigo-300" />
                <h3 className="font-extrabold text-sm tracking-wide">Email 寄送通知小幫手</h3>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-indigo-200 hover:text-white font-extrabold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                審核結果已成功儲存至 Firebase！系統已為您草擬了對應的外送夥伴通知信，您可以自由修改內容：
              </p>

              {/* To field */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  收件者 (外送夥伴信箱)
                </label>
                <input
                  type="email"
                  value={emailTarget}
                  onChange={(e) => setEmailTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:outline-hidden focus:border-indigo-500 bg-slate-50 text-slate-700"
                />
              </div>

              {/* Subject field */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  信件主旨
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-extrabold focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
                />
              </div>

              {/* Body field */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  信件內文
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
              <button
                onClick={() => {
                  const mailtoUrl = `mailto:${encodeURIComponent(emailTarget)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                  window.location.href = mailtoUrl;
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>一鍵開啟用信軟體發送 (開啓 Gmail/Outlook)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const fullText = `主旨：${emailSubject}\n\n${emailBody}`;
                    navigator.clipboard.writeText(fullText);
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2000);
                  }}
                  className="py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer"
                >
                  {copiedEmail ? <Check size={14} className="text-emerald-500" /> : <Clipboard size={14} />}
                  <span>{copiedEmail ? "已複製信件！" : "複製主旨與內文"}</span>
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                >
                  完成並關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
