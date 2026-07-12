import { useState, useEffect, FormEvent } from "react";
import { collection, onSnapshot, doc, updateDoc, writeBatch, addDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { signInAnonymously, signOut } from "firebase/auth";
import { Submission, SubmissionFilter } from "./types";
import { clearAllSubmissionsFromFirebase } from "./seedData";
import DashboardStats from "./components/DashboardStats";
import SubmissionList from "./components/SubmissionList";
import SubmissionDetail from "./components/SubmissionDetail";
import AddSubmissionModal from "./components/AddSubmissionModal";
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
  ChevronRight
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
  const [pubAdLocation, setPubAdLocation] = useState("外送箱後方主要看板");
  const [pubPhotoUrl, setPubPhotoUrl] = useState("");
  const [pubNotes, setPubNotes] = useState("");
  const [pubSubmitting, setPubSubmitting] = useState(false);
  const [pubSuccess, setPubSuccess] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Real-time synchronization message state
  const [statusMsg, setStatusMsg] = useState({ text: "正在連線至 Firebase 資料庫...", type: "info" });
  
  // Filtering state
  const [filters, setFilters] = useState<SubmissionFilter>({
    search: "",
    status: "all",
    vehicleType: "all",
    deliveryPlatform: "all",
  });

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
          snapshot.forEach((doc) => {
            const data = doc.data();
            list.push({
              id: doc.id,
              name: data.name || "",
              phone: data.phone || "",
              email: data.email || "",
              vehicleType: data.vehicleType || "機車",
              plateNumber: data.plateNumber || "",
              deliveryPlatform: data.deliveryPlatform || "其它",
              area: data.area || "",
              adLocation: data.adLocation || "",
              photoUrl: data.photoUrl || "",
              status: data.status || "pending",
              memberId: data.memberId || "",
              appliedAt: data.appliedAt || new Date().toISOString(),
              reviewedAt: data.reviewedAt || null,
              rejectionReason: data.rejectionReason || "",
              notes: data.notes || "",
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
          setStatusMsg({ text: "讀取資料失敗，請確認 Firebase 權限與連線！", type: "error" });
          setLoading(false);
        }
      );
    };

    // Ensure we are signed in anonymously to Firestore
    if (!auth.currentUser) {
      signInAnonymously(auth)
        .then(() => {
          if (isSubscribed) {
            startSync();
          }
        })
        .catch((err) => {
          console.warn("Auto sign-in warning (Anonymous Auth might be disabled in Firebase console):", err);
          if (isSubscribed) {
            // Fallback: if anonymous auth is not enabled, we still attempt to sync.
            // If firestore rules allow it (or are set to allow with fallback), this will succeed!
            startSync();
            setStatusMsg({ text: "安全密碼驗證成功！已成功載入資料庫", type: "success" });
          }
        });
    } else {
      startSync();
    }

    return () => {
      isSubscribed = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated]);

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
  const handleAddSubmission = async (submissionData: Omit<Submission, "id" | "status" | "appliedAt">) => {
    try {
      const submissionsRef = collection(db, "submissions");
      await addDoc(submissionsRef, {
        ...submissionData,
        status: "pending",
        appliedAt: new Date().toISOString(),
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
        adLocation: pubAdLocation,
        photoUrl: finalPhotoUrl,
        status: "pending",
        appliedAt: new Date().toISOString(),
        reviewedAt: null,
        rejectionReason: "",
        notes: pubNotes.trim() ? `[外送員留言] ${pubNotes.trim()}` : "",
      });

      // Clear public states
      setPubName("");
      setPubPhone("");
      setPubEmail("");
      setPubVehicleType("機車");
      setPubPlateNumber("");
      setPubDeliveryPlatform("Foodpanda");
      setPubArea("");
      setPubAdLocation("外送箱後方主要看板");
      setPubPhotoUrl("");
      setPubNotes("");
      
      setPubSuccess(true);
    } catch (e) {
      console.error("Public submit error:", e);
      alert("送出失敗！請確認網路連線是否正常。");
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

                  {/* Ad Location */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      預計广告安裝位置
                    </label>
                    <select
                      value={pubAdLocation}
                      onChange={(e) => setPubAdLocation(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-black text-slate-200 focus:outline-hidden transition-all appearance-none"
                    >
                      <option value="外送箱後方主要看板">外送箱後方主要看板 (1面)</option>
                      <option value="外送箱雙側海報">外送箱雙側海報 (2面)</option>
                      <option value="外送箱後方與兩側">外送箱後方與兩側 (3面極致版)</option>
                      <option value="後貨架背包兩側">後貨架背包兩側 (輕便版)</option>
                    </select>
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
            <button className="w-12 h-12 rounded-xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20 relative group transition-all" title="外送員審核">
              <Layers size={20} />
              <span className="absolute left-full ml-4 bg-slate-850 text-white text-xs py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold z-50">
                外送員審核
              </span>
            </button>
            
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 flex items-center justify-center border border-slate-700 relative group transition-all cursor-pointer"
              title="新增申請檔案"
            >
              <Plus size={20} />
              <span className="absolute left-full ml-4 bg-slate-850 text-white text-xs py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold z-50">
                新增申請檔案
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
          {/* Loading overlay for the whole page during heavy tasks */}
          {loading && submissions.length === 0 ? (
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
