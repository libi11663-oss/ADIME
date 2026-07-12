export interface Submission {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string; // "機車" | "自行車" | "電動雙輪" | "其它"
  plateNumber?: string;
  deliveryPlatform: string; // "Foodpanda" | "UberEats" | "Lalamove" | "其它"
  area: string; // e.g. "台北市大安區"
  adLocation: string; // e.g. "外送箱後方", "外送箱雙側"
  photoUrl: string; // 車子與外送箱照片 URL
  status: "pending" | "approved" | "rejected";
  memberId?: string; // 會員號碼, e.g. CX-10023
  appliedAt: any; // Firestore Timestamp or Date string
  reviewedAt?: any;
  rejectionReason?: string;
  notes?: string;
}

export interface SubmissionFilter {
  search: string;
  status: "all" | "pending" | "approved" | "rejected";
  vehicleType: string;
  deliveryPlatform: string;
}
