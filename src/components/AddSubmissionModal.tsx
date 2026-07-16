import React, { useState } from "react";
import { X, User, Phone, Mail, MapPin, Bike, Smartphone, Image, Plus, Check, Calendar } from "lucide-react";
import { Submission } from "../types";

interface AddSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submissionData: Omit<Submission, "id" | "status" | "appliedAt"> & { appliedAt?: string }) => Promise<void>;
}

export default function AddSubmissionModal({ isOpen, onClose, onSubmit }: AddSubmissionModalProps) {
  // Helper to format a Date as YYYY-MM-DDTHH:mm for datetime-local input
  const getLocalDateTimeString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleType, setVehicleType] = useState("機車");
  const [plateNumber, setPlateNumber] = useState("");
  const [deliveryPlatform, setDeliveryPlatform] = useState("Foodpanda");
  const [area, setArea] = useState("");
  const [motorcycleModel, setMotorcycleModel] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [appliedAt, setAppliedAt] = useState(() => getLocalDateTimeString(new Date()));
  const [submitting, setSubmitting] = useState(false);

  // Rider specific profile fields
  const [lineId, setLineId] = useState("");
  const [primaryRegion, setPrimaryRegion] = useState("");
  const [weeklyOrders, setWeeklyOrders] = useState("");
  const [dailyHours, setDailyHours] = useState("");
  const [weeklyDays, setWeeklyDays] = useState("");
  const [address, setAddress] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  if (!isOpen) return null;

  // Taiwan Cities and Districts suggestions
  const TAIWAN_AREAS = [
    "台北市大安區",
    "台北市信義區",
    "台北市中山區",
    "新北市板橋區",
    "新北市中和區",
    "台中市西屯區",
    "台中市北區",
    "高雄市三民區",
    "高雄市左營區",
    "桃園市中壢區",
    "台南市東區"
  ];

  // Ad locations list
  const AD_LOCATIONS = [
    "外送箱後方主要看板",
    "外送箱雙側海報",
    "外送箱後方與兩側",
    "後貨架背包兩側"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !area.trim()) {
      alert("請填寫姓名、電話與服務區域！");
      return;
    }

    setSubmitting(true);
    try {
      // Use a placeholder photo URL if not specified to guarantee image displays properly
      const finalPhotoUrl = photoUrl.trim() || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80";
      
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || "無",
        vehicleType,
        plateNumber: plateNumber.trim() || "無",
        deliveryPlatform,
        area: area.trim(),
        adLocation: motorcycleModel.trim() || "無",
        motorcycleModel: motorcycleModel.trim() || "無",
        photoUrl: finalPhotoUrl,
        notes: notes.trim(),
        appliedAt: new Date(appliedAt).toISOString(),
        
        // Pass new fields
        lineId: lineId.trim(),
        primaryRegion: primaryRegion.trim() || area.trim(),
        weeklyOrders: weeklyOrders.trim(),
        dailyHours: dailyHours.trim(),
        weeklyDays: weeklyDays.trim(),
        address: address.trim(),
        bankAccount: bankAccount.trim(),
      });
      
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setVehicleType("機車");
      setPlateNumber("");
      setDeliveryPlatform("Foodpanda");
      setArea("");
      setMotorcycleModel("");
      setPhotoUrl("");
      setNotes("");
      setLineId("");
      setPrimaryRegion("");
      setWeeklyOrders("");
      setDailyHours("");
      setWeeklyDays("");
      setAddress("");
      setBankAccount("");
      setAppliedAt(getLocalDateTimeString(new Date()));
      onClose();
    } catch (error) {
      console.error("Add submission modal error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`新增失敗！錯誤原因：${errorMsg}\n\n請確認網路連線是否正常。`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base tracking-tight">新增外送員申請檔案</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Add New Delivery Applicant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                姓名 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  required
                  placeholder="例：林小明"
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                聯絡電話 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  required
                  placeholder="例：0912-345-678"
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium font-mono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Email */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">電子信箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="email"
                placeholder="例：xiaoming@gmail.com"
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Vehicle Type & Plate Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">載具類型</label>
              <div className="relative">
                <Bike className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <select
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-800"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="機車">機車</option>
                  <option value="自行車">自行車</option>
                  <option value="電動雙輪">電動雙輪</option>
                  <option value="其它">其它</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">車牌號碼</label>
              <input
                type="text"
                placeholder="例：ABC-1234 (無則填無)"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium font-mono"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Platform & Area */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">外送平台</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <select
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-800"
                  value={deliveryPlatform}
                  onChange={(e) => setDeliveryPlatform(e.target.value)}
                >
                  <option value="Foodpanda">Foodpanda</option>
                  <option value="UberEats">UberEats</option>
                  <option value="Lalamove">Lalamove</option>
                  <option value="其它">其它</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                服務區域 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  required
                  list="taiwan-areas"
                  placeholder="例：台北市大安區"
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
                <datalist id="taiwan-areas">
                  {TAIWAN_AREAS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Row 5: Motorcycle Model & Photo Url */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">機車車型 / 載具型號 <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Bike className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  required
                  placeholder="例：Gogoro 2, SYM Jet SL 等"
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                  value={motorcycleModel}
                  onChange={(e) => setMotorcycleModel(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">車身照片網址 (選填)</label>
              <div className="relative">
                <Image className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="url"
                  placeholder="http://example.com/photo.jpg (留空則帶入預設照片)"
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Row 5.5: Application Date/Time */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              申請日期與時間 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="datetime-local"
                required
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-850"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">預設為目前時間。若此申請是昨天或過去填寫的，請調整為當時的送出日期。</p>
          </div>

          {/* New Rider Specific Sections */}
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">跑單及帳戶詳細資料</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">LINE ID</label>
                <input
                  type="text"
                  placeholder="例：line_id_123"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">常跑縣市</label>
                <input
                  type="text"
                  placeholder="例：台北市、新北市"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                  value={primaryRegion}
                  onChange={(e) => setPrimaryRegion(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">平均跑單數</label>
                <input
                  type="text"
                  placeholder="例：150單/週"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                  value={weeklyOrders}
                  onChange={(e) => setWeeklyOrders(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">每週天數</label>
                <input
                  type="text"
                  placeholder="例：5天"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                  value={weeklyDays}
                  onChange={(e) => setWeeklyDays(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">每天時數</label>
                <input
                  type="text"
                  placeholder="例：8小時"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">聯絡地址</label>
              <input
                type="text"
                placeholder="例：台北市大安區新生南路三段 xx 號"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">銀行帳號 (格式：代碼-帳號)</label>
              <input
                type="text"
                placeholder="例：(822) 中國信託 1234-5678-9012"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium font-mono"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
              />
            </div>
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">管理備註</label>
            <textarea
              placeholder="輸入外送員上線時間、特殊需求等補充說明..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check size={14} />
              <span>{submitting ? "新增中..." : "確定新增申請單"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
