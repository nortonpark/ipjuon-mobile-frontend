import { toast } from "sonner";

// 백엔드 REST API 클라이언트
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const getToken = () => localStorage.getItem("jwt_token");

// 🔥 세션 만료 토스트 공통 함수
const showSessionExpiredToast = () => {
  if (!window.location.pathname.includes("/login")) {
    toast.error("세션이 만료되었습니다", {
      description: "다시 로그인해 주세요",
      duration: 3000,
    });
  }
};

// 🔥 401 처리 공통 함수
const handleUnauthorized = () => {
  const hadToken = !!localStorage.getItem("jwt_token");  // ← 토큰이 있었는지 기록

  localStorage.removeItem("jwt_token");
  localStorage.removeItem("resident_id");
  localStorage.removeItem("site_id");
  localStorage.removeItem("isLoggedIn");

  if (hadToken) showSessionExpiredToast();

  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }

};

const request = async (
  method: string,
  path: string,
  body?: unknown
): Promise<any> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 🔥 토큰 만료 또는 무효
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("인증이 만료되었습니다. 다시 로그인해 주세요.");
  }

  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
};

export const api = {
  get: (path: string) => request("GET", path),
  post: (path: string, body?: unknown) => request("POST", path, body),
  put: (path: string, body?: unknown) => request("PUT", path, body),
  patch: (path: string, body?: unknown) => request("PATCH", path, body),
  delete: (path: string, body?: unknown) => request("DELETE", path, body),
};


// 인증 관련
export const authApi = {
  sendOtp: (phone: string) =>
    api.post("/api/auth/otp/send", { phone }),

  verifyOtp: async (phone: string, otp: string) => {
    const data = await api.post("/api/auth/otp/verify", { phone, otp });
    if (data.token) {
      localStorage.setItem("jwt_token", data.token);
      if (data.residentId) localStorage.setItem("resident_id", data.residentId);
      if (data.siteId) localStorage.setItem("site_id", data.siteId);
    }
    return data;
  },

  expireOtp: (phone: string) =>
    api.delete("/api/auth/otp/expire", { phone }),

  logout: () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("resident_id");
    localStorage.removeItem("site_id");
    localStorage.removeItem("isLoggedIn");
  },

  // 🔥 JWT payload 파싱해서 만료시간 체크
  isLoggedIn: () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        
        // 🔥 만료 감지 → 토스트 띄우고 정리
        showSessionExpiredToast();
        authApi.logout();
        return false;
      }
      return true;
    } catch {
      // 파싱 실패 = 손상된 토큰
      authApi.logout();
      return false;
    }
  },
};


// HOME, 메인화면 
export interface DashboardData {
  resident: {
    dong: string;
    ho: string;
    move_in_date: string; // "2026-04-26"
  };
  readiness_percent: number;
  checklist: {
    id: number;
    label: string;
    done: boolean;
    path: string;
  }[];
  steps: {
    label: string;
    status: "completed" | "current" | "pending";
  }[];
  notices: {
    badge: string;
    name: string;
    badge_type: "primary" | "success" | "warning";
    title: string;
    date: string;
  }[];
}

// 공통코드 API
export const codeApi = {
  getList: (groupCode: string) => api.get(`/api/codes/${groupCode}`),
};

// HOME 메인화면
export const homeApi = {
  getDashboard: (): Promise<DashboardData> =>
    // api.get("/api/home/dashboard").then((r) => r.data),
  api.get("/api/home/dashboard"),  // .then(r => r.data) 제거
};

// 입주민 관련
export const residentApi = {
  getMe: () => api.get("/api/residents/me"),
  updateNotifications: (settings: Record<string, boolean>) =>
    api.patch("/api/residents/me/notifications", settings),
  updateProfile: (data: { phone?: string; car_number?: string }) =>
    api.patch("/api/residents/me/profile", data),
};

// 하자 관련
export const defectApi = {
  getList: () => api.get("/api/defects"),
  getDetail: (id: number) => api.get(`/api/defects/${id}`),
  submit: (data: unknown) => api.post("/api/defects", data),
};

// 공지 관련
export const noticeApi = {
  getList: (type?: string, codeMap?: Record<string, string>) => {
    const siteId = localStorage.getItem("site_id") || "";
    const params = new URLSearchParams({ siteId });
    if (type && type !== "전체" && codeMap) {
      const code = codeMap[type];
      if (code) params.append("type", code);
    }
    return api.get(`/api/notices?${params}`);
  },
  getDetail: (id: number) => api.get(`/api/notices/${id}`),
  markRead: (id: number) => api.post(`/api/notices/${id}/read`),
};

// 납부 관련
export const paymentApi = {
  getList: () => api.get("/api/payments"),
  getDetail: (id: number) => api.get(`/api/payments/${id}`),
  confirm: (id: number) => api.post(`/api/payments/${id}/confirm`),
};

// 이사/사전점검 예약 관련
export const movingApi = {
  getAvailableDates: (type: string, year: number, month: number) =>
    api.get(`/api/moving/available-dates?type=${type}&year=${year}&month=${month}`),

  getMyReservation: (type: string) =>
    api.get(`/api/moving/me?type=${type}`),

  reserve: (data: {
    type: string;
    scheduleDate: string;
    timeSlot: string;
    movingCompany?: string;
    movingPhone?: string;
    vehicleNumber?: string;
    memo?: string;
  }) => api.post("/api/moving", data),

  update: (id: number, data: {
    scheduleDate: string;
    timeSlot: string;
    movingCompany?: string;
    movingPhone?: string;
    vehicleNumber?: string;
    memo?: string;
  }) => api.post(`/api/moving/${id}/update`, data),  // ← POST로 변경
};

// QR 관련
export const qrApi = {
  getQr: () => api.get("/api/qr/me"),
};



// ── 하자 카테고리 타입 ──
export interface SubCategoryRes {
  id: number;
  name: string;
  isUrgent: boolean;
  guides: string[];
}

export interface MidCategoryRes {
  id: number;
  name: string;
  subs: SubCategoryRes[];
}

export interface MainCategoryRes {
  id: number;
  name: string;
  icon: string;
  mids: MidCategoryRes[];
}

// ── 하자 카테고리 API ──
export const defectCategoryApi = {
  getCategories: (): Promise<MainCategoryRes[]> =>
    api.get("/api/defect/categories"),
};

// ── 기존 checkUrgency 호환 유틸 ──
export const URGENT_KEYWORDS = ["누수", "단전", "잠금장치"];

export function checkUrgency(sub: SubCategoryRes, checkedGuides: string[]): boolean {
  if (sub.isUrgent) return true;
  return checkedGuides.some((g) =>
    URGENT_KEYWORDS.some((kw) => g.includes(kw))
  );
}

