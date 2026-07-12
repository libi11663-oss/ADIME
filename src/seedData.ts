import { collection, getDocs, addDoc, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase";
import { Submission } from "./types";

export const MOCK_SUBMISSIONS = [
  {
    name: "張志明",
    phone: "0912-345-678",
    email: "jimmy.chang@gmail.com",
    vehicleType: "機車",
    plateNumber: "MTR-8899",
    deliveryPlatform: "UberEats",
    area: "台北市信義區",
    adLocation: "外送箱後方主要看板",
    photoUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80",
    status: "pending",
    appliedAt: new Date(Date.now() - 3 * 3600 * 1000 * 24).toISOString(), // 3 days ago
    notes: "平日晚上跟假日跑單為主，希望能盡快安裝廣告箱。"
  },
  {
    name: "陳怡君",
    phone: "0928-111-222",
    email: "yijun.chen@yahoo.com.tw",
    vehicleType: "機車",
    plateNumber: "ABC-5678",
    deliveryPlatform: "Foodpanda",
    area: "台中市西屯區",
    adLocation: "外送箱雙側海報",
    photoUrl: "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=600&auto=format&fit=crop&q=80",
    status: "pending",
    appliedAt: new Date(Date.now() - 1 * 3600 * 1000 * 24).toISOString(), // 1 day ago
    notes: "專職熊貓外送員，平均每週上線 50 小時以上，曝光度極高！"
  },
  {
    name: "王大同",
    phone: "0933-444-555",
    email: "datong.wang@outlook.com",
    vehicleType: "電動雙輪",
    plateNumber: "EM-2345",
    deliveryPlatform: "Lalamove",
    area: "新北市板橋區",
    adLocation: "外送箱後方與兩側",
    photoUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
    status: "approved",
    memberId: "CX-10204",
    appliedAt: new Date(Date.now() - 5 * 3600 * 1000 * 24).toISOString(), // 5 days ago
    reviewedAt: new Date(Date.now() - 4 * 3600 * 1000 * 24).toISOString(),
    notes: "大件物品外送專車，車身有防雨罩。"
  },
  {
    name: "李美玲",
    phone: "0955-666-777",
    email: "meiling.lee@gmail.com",
    vehicleType: "自行車",
    plateNumber: "無",
    deliveryPlatform: "UberEats",
    area: "台北市大安區",
    adLocation: "後貨架背包兩側",
    photoUrl: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=600&auto=format&fit=crop&q=80",
    status: "rejected",
    rejectionReason: "自行車廣告可視面積太小，且活動範圍較小，不符合本次外送箱廣告看板推廣計畫。",
    appliedAt: new Date(Date.now() - 7 * 3600 * 1000 * 24).toISOString(), // 7 days ago
    reviewedAt: new Date(Date.now() - 6 * 3600 * 1000 * 24).toISOString(),
    notes: "台北大安市區短程外送員。"
  },
  {
    name: "林建宏",
    phone: "0972-888-999",
    email: "jh.lin@gmail.com",
    vehicleType: "機車",
    plateNumber: "XYZ-7890",
    deliveryPlatform: "其它",
    area: "高雄市三民區",
    adLocation: "外送箱後方主要看板",
    photoUrl: "https://images.unsplash.com/photo-1526367790999-0150786486a9?w=600&auto=format&fit=crop&q=80",
    status: "pending",
    appliedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 hours ago
    notes: "跑私人餐廳合作外送，常駐高雄火車站周邊，車流人流大。"
  },
  {
    name: "黃雅婷",
    phone: "0988-555-444",
    email: "yating.huang@gamil.com",
    vehicleType: "機車",
    plateNumber: "MQA-1122",
    deliveryPlatform: "Foodpanda",
    area: "桃園市中壢區",
    adLocation: "外送箱雙側海報",
    photoUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80",
    status: "approved",
    memberId: "CX-10205",
    appliedAt: new Date(Date.now() - 4 * 3600 * 1000 * 24).toISOString(),
    reviewedAt: new Date(Date.now() - 3 * 3600 * 1000 * 24).toISOString(),
    notes: "兼職外送，通常跑中壢市區與中原大學附近。"
  }
];

export async function seedSubmissionsToFirebase(force = false) {
  try {
    const submissionsRef = collection(db, "submissions");
    const snapshot = await getDocs(submissionsRef);
    
    // If not forced and already has documents, don't seed
    if (!force && snapshot.size > 0) {
      console.log(`Submissions already seeded: ${snapshot.size} records found.`);
      return { success: true, count: 0, existing: snapshot.size };
    }

    // Use batch write to insert documents
    const batch = writeBatch(db);
    
    MOCK_SUBMISSIONS.forEach((sub) => {
      // Create a new document ref with automatic ID
      const newDocRef = doc(submissionsRef);
      batch.set(newDocRef, {
        ...sub,
        createdAt: new Date().toISOString()
      });
    });

    await batch.commit();
    console.log("Mock data successfully seeded!");
    return { success: true, count: MOCK_SUBMISSIONS.length, existing: snapshot.size };
  } catch (error) {
    console.error("Error seeding mock data:", error);
    throw error;
  }
}

export async function clearAllSubmissionsFromFirebase() {
  try {
    const submissionsRef = collection(db, "submissions");
    const snapshot = await getDocs(submissionsRef);
    if (snapshot.size === 0) {
      return { success: true, count: 0 };
    }
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error("Error clearing submissions:", error);
    throw error;
  }
}

