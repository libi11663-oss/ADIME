export interface Submission {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string; // "機車" | "自行車" | "電動雙輪" | "其它"
  plateNumber?: string;
  deliveryPlatform: string; // "Foodpanda" | "UberEats" | "Lalamove" | "其它"
  area: string; // e.g. "台北市大安區"
  adLocation?: string; // e.g. "外送箱後方", "外送箱雙側" (deprecated)
  motorcycleModel?: string; // 機車車型/載具型號, e.g. "Gogoro 2", "SYM Jet SL"
  photoUrl: string; // 車子與外送箱照片 URL
  status: "pending" | "approved" | "rejected";
  memberId?: string; // 會員號碼, e.g. CX-10023
  appliedAt: any; // Firestore Timestamp or Date string
  reviewedAt?: any;
  rejectionReason?: string;
  notes?: string;
  
  // Added fields for rider profile
  lineId?: string;       // LINE ID
  primaryRegion?: string; // 常跑縣市
  weeklyOrders?: string;  // 平均跑單數
  dailyHours?: string;    // 每天時數
  weeklyDays?: string;    // 每周天數
  address?: string;       // 聯絡地址
  bankAccount?: string;   // 銀行帳號
  selectedDistricts?: string[] | string; // 選擇常跑的地區行政區
  workType?: string;      // 屬性：正職 | 兼職
  
  // Dispatch properties
  dispatchStatus?: "undispatched" | "dispatched" | "email_sent";
  dispatchDays?: number;
  dispatchTarget?: string; // 里程時數目標
  dispatchedAt?: string;
  dispatchStartDate?: string;
  dispatchExpiry?: string;
  dispatchEmailSent?: boolean;
}

export interface SubmissionFilter {
  search: string;
  status: "all" | "pending" | "approved" | "rejected";
  vehicleType: string;
  deliveryPlatform: string;
}

export interface AdvertiserSubmission {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  budget: string;
  message: string;
  lineId?: string;
  city?: string;
  createdAt: string;
  role: string;
  dailyHours?: string;
  weeklyDays?: string;
  scooterModel?: string;
  address?: string;
  licensePlate?: string;
  primaryRegion?: string;
  deliveryPlatform?: string;
}

