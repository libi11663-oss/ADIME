import { useState, useEffect, FormEvent } from "react";
import { collection, onSnapshot, doc, updateDoc, writeBatch, addDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { signInAnonymously, signOut } from "firebase/auth";
import { Submission, SubmissionFilter, AdvertiserSubmission } from "./types";
import { clearAllSubmissionsFromFirebase } from "./seedData";
import DashboardStats from "./components/DashboardStats";
import SubmissionList from "./components/SubmissionList";
import SubmissionDetail from "./components/SubmissionDetail";
import AddSubmissionModal from "./components/AddSubmissionModal";
import AdvertiserListAndDetail from "./components/AdvertiserListAndDetail";
import {
  RefreshCw,
  Layers,
  Database,
  Plus,
  Sparkles,
  Trash2,
  Lock,
  LogOut,
  ShieldAlert,
  User,
  Phone,
  Mail,
  MapPin,
  Bike,
  Smartphone,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Calendar,
  MessageSquare,
  CreditCard,
  Clock,
  Map,
  TrendingUp
} from "lucide-react";

export default function App() {
  // Admin password authorization state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("crm_admin_authenticated") === "true";
  });
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Public submission portal states
  const [activePortalMode, setActivePortalMode] = useState<"rider" | "admin">("rider");
  const [pubName, setPubName] = useState("");
  const [pubPhone, setPubPhone] = useState("");
  const [pubEmail, setPubEmail] = useState("");
  const [pubVehicleType, setPubVehicleType] = useState("機車");
  const [pubPlateNumber, setPubPlateNumber] = useState("");
  const [pubDeliveryPlatform, setPubDeliveryPlatform] = useState("Foodpanda");
  const [pubArea, setPubArea] = useState("");
  const [pubMotorcycleModel, setPubMotorcycleModel] = useState("");
  const [pubPhotoUrl, setPubPhotoUrl] = useState("");
  const [pubNotes, setPubNotes] = useState("");
  
  // New public fields
  const [pubLineId, setPubLineId] = useState("");
  const [pubPrimaryRegion, setPubPrimaryRegion] = useState("");
  const [pubWeeklyOrders, setPubWeeklyOrders] = useState("");
  const [pubDailyHours, setPubDailyHours] = useState("");
  const [pubAddress, setPubAddress] = useState("");
  const [pubBankAccount, setPubBankAccount] = useState("");

  const [pubSubmitting, setPubSubmitting] = useState(false);
  const [pubSuccess, setPubSuccess] = useState(false);

  // Helper to format Date for datetime-local
  const getLocalDateTimeString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };
  const [pubAppliedAt, setPubAppliedAt] = useState(() => getLocalDateTimeString(new Date()));

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Real-time synchronization message state
  const [statusMsg, setStatusMsg] = useState({ text: "正在連線至 Firebase 資料庫...", type: "info" });
  const [retryCount, setRetryCount] = useState(0);
  
  // Filtering state
  const [filters, setFilters] = useState<SubmissionFilter>({
    search: "",
    status: "all",
    vehicleType: "all",
    deliveryPlatform: "all",
  });

  // Advertiser CRM state
  const [crmTab, setCrmTab] = useState<"riders" | "advertisers">("riders");
  const [advertisers, setAdvertisers] = useState<AdvertiserSubmission[]>([]);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<string | null>(null);
  const [advertisersLoading, setAdvertisersLoading] = useState(true);

  // Fetch / sync advertiser submissions in real-time
  useEffect(() => {
    if (!isAuthenticated) {
      setAdvertisersLoading(false);
      return;
    }

    setAdvertisersLoading(true);
    let isSubscribed = true;
    let unsubscribe: (() => void) | null = null;

    const startSyncAdvertisers = () => {
      const advertisersRef = collection(db, "advertiser_submissions");
      unsubscribe = onSnapshot(
        advertisersRef,
        (snapshot) => {
          if (!isSubscribed) return;
          const list: AdvertiserSubmission[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              name: data.name || "",
              phone: data.phone || "",
              email: data.email || "",
              companyName: data.companyName || "",
              budget: data.budget || "",
              message: data.message || "",
              lineId: data.lineId || "",
              city: data.city || "",
              createdAt: data.createdAt || new Date().toISOString(),
              role: data.role || "advertiser",
              dailyHours: data.dailyHours || "",
              weeklyDays: data.weeklyDays || "",
              scooterModel: data.scooterModel || "",
              address: data.address || "",
              licensePlate: data.licensePlate || "",
              primaryRegion: data.primaryRegion || "",
              deliveryPlatform: data.deliveryPlatform || "",
            });
          });

          // Sort descending by created time
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAdvertisers(list);
          setAdvertisersLoading(false);
        },
        (error) => {
          if (!isSubscribed) return;
          console.error("Firebase advertisers sync error:", error);
          setAdvertisersLoading(false);
        }
      );
    };

    startSyncAdvertisers();

    return () => {
      isSubscribed = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, retryCount]);

  // Fetch / sync submissions in real-time
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setStatusMsg({ text: "正在安全驗證連線...", type: "info" });

    let isSubscribed = true;
    let unsubscribe: (() => void) | null = null;

    const startSync = () => {
      const submissionsRef = collection(db, "submissions");
      unsubscribe = onSnapshot(
        submissionsRef,
        (snapshot) => {
          if (!isSubscribed) return;
          const list: Submission[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;

            // Auto-fix missing appliedAt in Firestore database to prevent dynamic updating on refresh
            if (!data.appliedAt) {
              const stableDate = data.createdAt || "2026-07-11T12:00:00.000Z";
              updateDoc(doc(db, "submissions", docId), {
                appliedAt: stableDate
              }).catch((err) => console.warn("Auto-fix appliedAt error:", err));
            }

            // Safe normalization of delivery platform
            let normalizedPlatform = data.deliveryPlatform || data.delivery_platform || "其它";
            if (normalizedPlatform.toLowerCase() === "booth" || normalizedPlatform.toLowerCase() === "both") {
              normalizedPlatform = "Foodpanda"; // Map "booth/both" back to Foodpanda (or whatever they picked)
            }

            // Safe plate number extraction
            const parsedPlateNumber = data.plateNumber || data.plate_number || "無";

            list.push({
              id: docId,
              name: data.name || "",
              phone: data.phone || "",
              email: data.email || "",
              vehicleType: data.vehicleType || "機車",
              plateNumber: parsedPlateNumber,
              deliveryPlatform: normalizedPlatform,
              area: data.area || "",
              adLocation: data.adLocation || "",
              motorcycleModel: data.motorcycleModel || data.motorcycle_model || data.adLocation || "無",
              photoUrl: data.photoUrl || "",
              status: data.status || "pending",
              memberId: data.memberId || "",
              appliedAt: (() => {
                if (!data.appliedAt) return data.createdAt || "2026-07-11T12:00:00.000Z";
                if (typeof data.appliedAt.toDate === "function") {
                  return data.appliedAt.toDate().toISOString();
                }
                if (typeof data.appliedAt === "string") {
                  return data.appliedAt;
                }
                if (data.appliedAt.seconds) {
                  return new Date(data.appliedAt.seconds * 1000).toISOString();
                }
                return String(data.appliedAt);
              })(),
              reviewedAt: (() => {
                if (!data.reviewedAt) return null;
                if (typeof data.reviewedAt.toDate === "function") {
                  return data.reviewedAt.toDate().toISOString();
                }
                if (typeof data.reviewedAt === "string") {
                  return data.reviewedAt;
                }
                if (data.reviewedAt.seconds) {
                  return new Date(data.reviewedAt.seconds * 1000).toISOString();
                }
                return String(data.reviewedAt);
              })(),
              rejectionReason: data.rejectionReason || "",
              notes: data.notes || "",
              lineId: data.lineId || data.line_id || "",
              primaryRegion: data.primaryRegion || data.primary_region || data.city || data.area || "",
              weeklyOrders: data.weeklyOrders || data.weekly_orders || "",
              dailyHours: data.dailyHours || data.daily_hours || "",
              address: data.address || "",
              bankAccount: data.bankAccount || data.bank_account || "",
            });
          });

          // Sort descending by applied time initially
          list.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

          setSubmissions(list);
          setLoading(false);
          setStatusMsg({ text: `安全連線成功，已同步 ${list.length} 筆資料`, type: "success" });
        },
        (error) => {
          if (!isSubscribed) return;
          console.error("Firebase sync error:", error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          setStatusMsg({ text: `讀取資料失敗: ${errorMsg} (請確認 Firebase 權限與連線)`, type: "error" });
          setLoading(false);
        }
      );
    };

    // Start syncing immediately to prevent waiting for Auth handshake
    startSync();

    // Sign in anonymously in the background without blocking the data sync
    if (!auth.currentUser) {
      signInAnonymously(auth)
        .catch((err) => {
          console.warn("Background Anonymous Auth sign-in warning:", err);
        });
    }

    return () => {
      isSubscribed = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, retryCount]);

  // Update selectedId if selected document is deleted or changed
  const selectedSubmission = submissions.find((s) => s.id === selectedId) || null;

  // Approve action
  const handleApprove = async (id: string, memberId: string) => {
    try {
      const docRef = doc(db, "submissions", id);
      await updateDoc(docRef, {
        status: "approved",
        memberId: memberId,
        reviewedAt: new Date().toISOString(),
      });
      setStatusMsg({ text: `已成功核准申請，指派會員號碼：${memberId}`, type: "success" });
    } catch (e) {
      console.error("Error approving submission:", e);
      throw e;
    }
  };

  // Reject action
  const handleReject = async (id: string, reason: string) => {
    try {
      const docRef = doc(db, "submissions", id);
      await updateDoc(docRef, {
        status: "rejected",
        rejectionReason: reason,
        reviewedAt: new Date().toISOString(),
      });
      setStatusMsg({ text: "已成功拒絕該申請，並寫回退件原因", type: "success" });
    } catch (e) {
      console.error("Error rejecting submission:", e);
      throw e;
    }
  };

  // Save notes action
  const handleSaveNotes = async (id: string, notes: string) => {
    try {
      const docRef = doc(db, "submissions", id);
      await updateDoc(docRef, {
        notes: notes,
      });
      setStatusMsg({ text: "內部管理備註已更新", type: "success" });
    } catch (e) {
      console.error("Error saving notes:", e);
      throw e;
    }
  };

  // Clear all submissions from database
  const handleClearAll = async () => {
    if (!window.confirm("確定要刪除資料庫中的所有外送員申請檔案嗎？此動作無法復原。")) {
      return;
    }
    setLoading(true);
    try {
      const res = await clearAllSubmissionsFromFirebase();
      setSelectedId(null);
      setStatusMsg({ text: `已成功清空資料庫！共刪除 ${res.count} 筆檔案。`, type: "success" });
    } catch (e) {
      console.error("Error clearing submissions:", e);
      setStatusMsg({ text: "清空資料庫失敗，請確認 Firebase 設定。", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Create manual submission action
  const handleAddSubmission = async (submissionData: Omit<Submission, "id" | "status" | "appliedAt"> & { appliedAt?: string }) => {
    try {
      const submissionsRef = collection(db, "submissions");
      await addDoc(submissionsRef, {
        ...submissionData,
        status: "pending",
        appliedAt: submissionData.appliedAt || new Date().toISOString(),
        reviewedAt: null,
        rejectionReason: "",
      });
      setStatusMsg({ text: `已成功手動新增申請檔案：${submissionData.name}`, type: "success" });
    } catch (e) {
      console.error("Error adding submission:", e);
      setStatusMsg({ text: "新增申請檔案失敗，請檢查權限。", type: "error" });
      throw e;
    }
  };

  // Public user submission form handler
  const handlePublicSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pubName.trim() || !pubPhone.trim() || !pubArea.trim()) {
      alert("請填寫真實姓名、電話與服務區域！");
      return;
    }
    setPubSubmitting(true);
    try {
      const finalPhotoUrl = pubPhotoUrl.trim() || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80";
      
      const submissionsRef = collection(db, "submissions");
      await addDoc(submissionsRef, {
        name: pubName.trim(),
        phone: pubPhone.trim(),
        email: pubEmail.trim() || "無",
        vehicleType: pubVehicleType,
        plateNumber: pubPlateNumber.trim() || "無",
        deliveryPlatform: pubDeliveryPlatform,
        area: pubArea.trim(),
        adLocation: pubMotorcycleModel.trim() || "無",
        motorcycleModel: pubMotorcycleModel.trim() || "無",
        photoUrl: finalPhotoUrl,
        status: "pending",
        appliedAt: new Date(pubAppliedAt).toISOString(),
        reviewedAt: null,
        rejectionReason: "",
        notes: pubNotes.trim() ? `[外送員留言] ${pubNotes.trim()}` : "",
        
        // Add new fields
        lineId: pubLineId.trim(),
        primaryRegion: pubPrimaryRegion.trim() || pubArea.trim(),
        weeklyOrders: pubWeeklyOrders.trim(),
        dailyHours: pubDailyHours.trim(),
        address: pubAddress.trim(),
        bankAccount: pubBankAccount.trim(),
      });

      // Clear public states
      setPubName("");
      setPubPhone("");
      setPubEmail("");
      setPubVehicleType("機車");
      setPubPlateNumber("");
      setPubDeliveryPlatform("Foodpanda");
      setPubArea("");
      setPubMotorcycleModel("");
      setPubPhotoUrl("");
      setPubNotes("");
      setPubLineId("");
      setPubPrimaryRegion("");
      setPubWeeklyOrders("");
      setPubDailyHours("");
      setPubAddress("");
      setPubBankAccount("");
      setPubAppliedAt(getLocalDateTimeString(new Date()));
      
      setPubSuccess(true);
    } catch (e) {
      console.error("Public submit error:", e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      alert(`送出失敗！錯誤原因：${errorMsg}\n\n請確認網路連線是否正常。如果是配額問題 (Quota exceeded)，可在隔日重置。`);
    } finally {
      setPubSubmitting(false);
    }
  };

  // Handle Admin Login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const correctPassword = "admin"; // Standard default password
    if (adminPassword.trim() === correctPassword) {
      try {
        setStatusMsg({ text: "正在進行安全身份驗證...", type: "info" });
        await signInAnonymously(auth);
        localStorage.setItem("crm_admin_authenticated", "true");
        setIsAuthenticated(true);
        setPasswordError("");
        setStatusMsg({ text: "安全驗證成功，資料庫已解鎖！", type: "success" });
      } catch (err) {
        console.warn("Firebase auth login error (expected if Anonymous Auth is disabled):", err);
        // Fallback: If auth fails (e.g. because anonymous auth is disabled in Firebase console),
        // we still allow the user to login to the CRM as long as they entered the correct password!
        localStorage.setItem("crm_admin_authenticated", "true");
        setIsAuthenticated(true);
        setPasswordError("");
        setStatusMsg({ text: "密碼正確！已為您解鎖管理後台", type: "success" });
      }
    } else {
      setPasswordError("密碼錯誤，請檢查並重新輸入！");
    }
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    if (window.confirm("確定要登出管理控制台嗎？")) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Firebase auth logout error:", err);
      }
      localStorage.removeItem("crm_admin_authenticated");
      setIsAuthenticated(false);
      setSubmissions([]);
      setSelectedId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-start p-4 md:p-8 relative overflow-y-auto">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

        {/* Ambient glow decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full relative z-10 animate-fade-in mt-4 mb-12">
          {/* Logo & Slogan Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-400/30 text-white mx-auto shadow-xl shadow-indigo-950/40 mb-4">
              <span className="font-black text-3xl">巷</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">穿巷外送廣告平台</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Alleyway Delivery Ad Placement Portal</p>
          </div>

          {/* Dual-Mode Selector Tabs */}
          <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl mb-6">
            <button
              onClick={() => {
                setActivePortalMode("rider");
                setPubSuccess(false);
              }}
              className={`flex-1 py-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                activePortalMode === "rider"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bike size={14} />
              <span>外送夥伴：廣告合作申請</span>
            </button>
            <button
              onClick={() => setActivePortalMode("admin")}
              className={`flex-1 py-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                activePortalMode === "admin"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Lock size={14} />
              <span>管理員：CRM 後台登入</span>
            </button>
          </div>

          {/* Mode 1: Public Rider Application Form */}
          {activePortalMode === "rider" && (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8">
              {pubSuccess ? (
                <div className="text-center py-8 space-y-5 animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Check size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-white">申請表單已成功送出！</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      感謝您的加入！資料已安全同步至「穿巷外送資料庫」，管理團隊在審核您的車牌與照片後，將會以簡訊或 Email 與您聯繫。
                    </p>
                  </div>
                  <button
                    onClick={() => setPubSuccess(false)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    再填寫一份申請
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePublicSubmit} className="space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-indigo-400" />
                      立即加入外送箱車貼廣告夥伴
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">填寫下方真實資料，審核通過即可開始賺取廣告收益！</p>
                  </div>

                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                        真實姓名 <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                        <input
                          type="text"
                          required
                          placeholder="請輸入您的姓名"
                          value={pubName}
                          onChange={(e) => setPubName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                        聯絡電話 <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                        <input
                          type="tel"
                          required
                          placeholder="例：0912345678"
                          value={pubPhone}
                          onChange={(e) => setPubPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      電子信箱
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                      <input
                        type="email"
                        placeholder="例：rider@example.com (選填)"
                        value={pubEmail}
                        onChange={(e) => setPubEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  {/* Vehicle Type & Plate Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                        載具類型
                      </label>
                      <div className="relative">
                        <Bike className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                        <select
                          value={pubVehicleType}
                          onChange={(e) => setPubVehicleType(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-black text-slate-200 focus:outline-hidden transition-all appearance-none"
                        >
                          <option value="機車">機車 (Motorcycle)</option>
                          <option value="自行車">自行車 (Bicycle)</option>
                          <option value="電動雙輪">電動雙輪 (E-Bike)</option>
                          <option value="其它">其它 (Others)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                        車牌號碼 (機車必填)
                      </label>
                      <input
                        type="text"
                        placeholder="例：ABC-1234 (無車牌請寫無)"
                        value={pubPlateNumber}
                        onChange={(e) => setPubPlateNumber(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Platform & Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                        外送平台
                      </label>
                      <div className="relative">
                        <Smartphone className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                        <select
                          value={pubDeliveryPlatform}
                          onChange={(e) => setPubDeliveryPlatform(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-black text-slate-200 focus:outline-hidden transition-all appearance-none"
                        >
                          <option value="Foodpanda">Foodpanda (熊貓)</option>
                          <option value="UberEats">UberEats (優食)</option>
                          <option value="Lalamove">Lalamove</option>
                          <option value="其它">其它平台</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                        服務區域 <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                        <input
                          type="text"
                          required
                          placeholder="例：台北市大安區"
                          value={pubArea}
                          onChange={(e) => setPubArea(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Motorcycle Model */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      機車車型 / 載具型號 <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Bike className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                      <input
                        type="text"
                        required
                        placeholder="例：Gogoro 2, SYM Jet SL, Kymco GP 125, Giant 等"
                        value={pubMotorcycleModel}
                        onChange={(e) => setPubMotorcycleModel(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  {/* Photo URL */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      外送車身/外送箱照片網址 (選填)
                    </label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                      <input
                        type="url"
                        placeholder="請貼上照片網址 (留空則使用系統預設車貼範本)"
                        value={pubPhotoUrl}
                        onChange={(e) => setPubPhotoUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  {/* Rider Profile Extra Fields (LINE ID, Primary Region, Weekly Orders, Daily Hours, Contact Address, Bank Account) */}
                  <div className="border-t border-slate-800 pt-4 space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">跑單及帳戶詳細資料</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                          LINE ID
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                          <input
                            type="text"
                            placeholder="例：line_id_123"
                            value={pubLineId}
                            onChange={(e) => setPubLineId(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                          常跑縣市
                        </label>
                        <div className="relative">
                          <Map className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                          <input
                            type="text"
                            placeholder="例：台北市、新北市"
                            value={pubPrimaryRegion}
                            onChange={(e) => setPubPrimaryRegion(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                          平均跑單數 (每週或每日)
                        </label>
                        <div className="relative">
                          <TrendingUp className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                          <input
                            type="text"
                            placeholder="例：150 單/週"
                            value={pubWeeklyOrders}
                            onChange={(e) => setPubWeeklyOrders(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                          每天時數
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                          <input
                            type="text"
                            placeholder="例：8 小時"
                            value={pubDailyHours}
                            onChange={(e) => setPubDailyHours(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                        聯絡地址
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                        <input
                          type="text"
                          placeholder="例：台北市大安區新生南路三段 xx 號"
                          value={pubAddress}
                          onChange={(e) => setPubAddress(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                        銀行帳號
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                        <input
                          type="text"
                          placeholder="例：(822) 中國信託 1234-5678-9012"
                          value={pubBankAccount}
                          onChange={(e) => setPubBankAccount(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes (Supplementary message for driver) */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      申請補充說明/留言
                    </label>
                    <textarea
                      placeholder="您可以填寫偏好的上線時間、特殊需求，或任何想對我們說的話..."
                      rows={2}
                      value={pubNotes}
                      onChange={(e) => setPubNotes(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-hidden transition-all"
                    />
                  </div>

                  {/* Application Date/Time (Allows retroactively setting date) */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      填寫/送出日期時間
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                      <input
                        type="datetime-local"
                        required
                        value={pubAppliedAt}
                        onChange={(e) => setPubAppliedAt(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-xs font-bold text-slate-200 focus:outline-hidden transition-all"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold mt-1">※ 預設為目前時間。如果您是補填昨日或過去的表單，可在此調整送出時間，以便在後台正確顯示。</p>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={pubSubmitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-indigo-950/50 cursor-pointer active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {pubSubmitting ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        <span>正在安全傳送申請中...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>確認送出車貼廣告合作申請</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Mode 2: Admin Login Control Panel */}
          {activePortalMode === "admin" && (
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 animate-fade-in">
              <div className="flex items-center space-x-2.5 mb-5 text-indigo-400">
                <Lock size={18} />
                <h3 className="font-extrabold text-sm text-slate-200">管理控制台安全驗證</h3>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                    請輸入管理員解鎖密碼
                  </label>
                  <input
                    type="password"
                    placeholder="請輸入系統管理密碼..."
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 rounded-xl text-sm font-bold text-slate-200 tracking-widest placeholder:text-slate-700 focus:outline-hidden transition-all text-center"
                    autoFocus
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center space-x-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl text-xs font-bold">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-indigo-950/50 cursor-pointer active:scale-[0.98]"
                >
                  解鎖並載入管理後台
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800/50 text-center text-[10px] text-slate-500 font-bold leading-relaxed">
                <p>※ 為了保護外送員的隱私個資與車牌照片，後台已啟動安全保護。</p>
                <p className="mt-1 text-slate-400">預設管理員密碼為：<span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300">admin</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      {/* Side Navigation Bar - Geometric Balance Sidebar */}
      <aside className="w-20 bg-slate-900 flex flex-col items-center py-8 justify-between border-r border-slate-800 shrink-0 hidden md:flex">
        <div className="flex flex-col items-center gap-10">
          {/* Brand logo icon container */}
          <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center border border-indigo-500/30 text-indigo-400">
            <span className="font-black text-2xl">巷</span>
          </div>
          
          {/* Active Sidebar item */}
          <div className="flex flex-col gap-6">
            <button
              onClick={() => setCrmTab("riders")}
              className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all relative group cursor-pointer ${
                crmTab === "riders"
                  ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700"
              }`}
              title="外送員審核"
            >
              <Layers size={20} />
              <span className="absolute left-full ml-4 bg-slate-850 text-white text-xs py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold z-50 shadow-lg">
                外送員審核
              </span>
            </button>

            <button
              onClick={() => setCrmTab("advertisers")}
              className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all relative group cursor-pointer ${
                crmTab === "advertisers"
                  ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700"
              }`}
              title="企業廣告主信箱"
            >
              <Mail size={20} />
              <span className="absolute left-full ml-4 bg-slate-850 text-white text-xs py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold z-50 shadow-lg">
                企業廣告主
              </span>
            </button>
            
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 flex items-center justify-center border border-slate-700 relative group transition-all cursor-pointer"
              title="新增外送員檔案"
            >
              <Plus size={20} />
              <span className="absolute left-full ml-4 bg-slate-850 text-white text-xs py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold z-50 shadow-lg">
                新增外送員
              </span>
            </button>
          </div>
        </div>
        
        <div className="text-slate-500 font-bold text-xs tracking-widest font-mono select-none">
          CRM
        </div>
      </aside>

      {/* Main Workspace Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            {/* Mobile Logo indicator */}
            <div className="w-10 h-10 bg-indigo-600/10 rounded-lg flex items-center justify-center border border-indigo-500/30 text-indigo-500 md:hidden font-bold">
              巷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black text-slate-800 tracking-tight">員工管理系統</h1>
                <span className="text-slate-300 hidden md:inline">/</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider hidden md:inline-block">
                  穿巷外送審核 CRM
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Alleyway Delivery Ad Placement Panel</p>
            </div>
          </div>

          {/* Database Connection Status & Action Panel */}
          <div className="flex items-center gap-3">
            {/* Real-time status badge */}
            <div className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded border uppercase tracking-wider flex items-center space-x-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : statusMsg.type === "error"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-slate-100 text-amber-700 border-slate-200"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                statusMsg.type === "success"
                  ? "bg-emerald-500"
                  : statusMsg.type === "error"
                  ? "bg-rose-500"
                  : "bg-amber-500 animate-ping"
              }`} />
              <span className="max-w-[120px] md:max-w-[280px] truncate">{statusMsg.text}</span>
              {statusMsg.type === "error" && (
                <button
                  onClick={() => setRetryCount(prev => prev + 1)}
                  className="ml-2 px-1.5 py-0.5 bg-rose-200 hover:bg-rose-300 text-rose-800 rounded font-bold cursor-pointer text-[10px] transition-colors"
                >
                  重試連線
                </button>
              )}
            </div>

            {/* Clear All Data Action (Only shown when there are records) */}
            {submissions.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                title="清空資料庫中所有現有資料"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline font-bold">清空資料庫</span>
              </button>
            )}

            {/* Add New Applicant Action */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100 flex items-center space-x-1.5 transition-all cursor-pointer"
              title="新增真實外送員申請"
            >
              <Plus size={13} />
              <span className="hidden sm:inline font-bold">新增申請檔案</span>
            </button>

            {/* Admin Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
              title="安全登出管理系統"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline font-bold">登出</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content Frame */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Segmented Control Tab Switcher for CRM Section */}
          <div className="flex bg-slate-200/70 p-1 rounded-xl max-w-sm border border-slate-300/40 select-none">
            <button
              onClick={() => setCrmTab("riders")}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                crmTab === "riders"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers size={13} />
              <span>外送夥伴審核 ({submissions.length})</span>
            </button>
            <button
              onClick={() => setCrmTab("advertisers")}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                crmTab === "advertisers"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Mail size={13} />
              <span>企業廣告主 ({advertisers.length})</span>
            </button>
          </div>

          {crmTab === "riders" ? (
            /* Loading overlay for the whole page during heavy tasks */
            loading && submissions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
                <RefreshCw className="animate-spin text-indigo-600" size={36} />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800">正在同步與載入名單資料...</p>
                  <p className="text-xs text-slate-400 font-medium">第一次載入可能需要數秒，請稍候。</p>
                </div>
              </div>
            ) : (
              <>
                {/* Upper Dashboard Statistics Row */}
                <DashboardStats submissions={submissions} />

                {/* Zero State Onboarding */}
                {submissions.length === 0 && (
                  <div className="bg-slate-100/50 border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-4 max-w-2xl mx-auto my-6">
                    <div className="mx-auto w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                      <Database size={24} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-800 text-lg">尚未有任何真實外送員申請檔案</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                        資料庫目前處於全空狀態。您可以點選右上方或側邊欄的<b>「新增申請檔案」</b>按鈕，手動建立您真實的外送員申請名單（包含姓名、電話、機車車牌、外送平台、照片及區域）。
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-md shadow-indigo-100 inline-flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>立即新增第一筆申請檔案</span>
                    </button>
                  </div>
                )}

                {/* Split Screen Application Workspace */}
                {submissions.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Submissions lists, keyword searches, filtering */}
                    <div className="lg:col-span-5">
                      <SubmissionList
                        submissions={submissions}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        filters={filters}
                        onFiltersChange={setFilters}
                      />
                    </div>

                    {/* Right Column: Full Details and workflow Audit card */}
                    <div className="lg:col-span-7">
                      <SubmissionDetail
                        submission={selectedSubmission}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onSaveNotes={handleSaveNotes}
                      />
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            /* Advertisers Section */
            advertisersLoading && advertisers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
                <RefreshCw className="animate-spin text-indigo-600" size={36} />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800">正在載入廣告主名單...</p>
                  <p className="text-xs text-slate-400 font-medium">請稍候。</p>
                </div>
              </div>
            ) : advertisers.length === 0 ? (
              <div className="bg-slate-100/50 border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-4 max-w-2xl mx-auto my-6">
                <div className="mx-auto w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                  <Mail size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-800 text-lg">尚未有任何企業廣告主諮詢</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                    目前「企業廣告主諮詢」資料庫沒有任何資料。
                  </p>
                </div>
              </div>
            ) : (
              <AdvertiserListAndDetail advertisers={advertisers} />
            )
          )}
        </main>
      </div>

      {/* Add Submission Modal Form */}
      <AddSubmissionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmission}
      />
    </div>
  );
}
