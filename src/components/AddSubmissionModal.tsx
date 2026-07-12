import React, { useState } from "react";
import { X, User, Phone, Mail, MapPin, Bike, Smartphone, Image, Plus, Check } from "lucide-react";
import { Submission } from "../types";

interface AddSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submissionData: Omit<Submission, "id" | "status" | "appliedAt">) => Promise<void>;
}

export default function AddSubmissionModal({ isOpen, onClose, onSubmit }: AddSubmissionModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleType, setVehicleType] = useState("機車");
  const [plateNumber, setPlateNumber] = useState("");
  const [deliveryPlatform, setDeliveryPlatform] = useState("Foodpanda");
  const [area, setArea] = useState("");
  const [adLocation, setAdLocation] = useState("外送箱後方");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        adLocation,
        photoUrl: finalPhotoUrl,
        notes: notes.trim(),
      });
      
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setVehicleType("機車");
      setPlateNumber("");
      setDeliveryPlatform("Foodpanda");
      setArea("");
      setAdLocation("外送箱後方主要看板");
      setPhotoUrl("");
      setNotes("");
      onClose();
    } catch (error) {
      alert("新增失敗，請確認網路連線。");
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

          {/* Row 5: Ad Location & Photo Url */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">預計廣告安裝位置</label>
              <select
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-800"
                value={adLocation}
                onChange={(e) => setAdLocation(e.target.value)}
              >
                {AD_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
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
