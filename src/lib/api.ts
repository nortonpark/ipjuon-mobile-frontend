// 백엔드 REST API 클라이언트
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const getToken = () => localStorage.getItem("jwt_token");

export const api = {
  get: async (path: string) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  },

  post: async (path: string, body?: unknown) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
  },

  delete: async (path: string, body?: unknown) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.status === 204 ? null : res.json();
  },

  patch: async (path: string, body?: unknown) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
    return res.json();
  },
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
    }
    return data;
  },

  // ✅ expireOtp 수정
  expireOtp: (phone: string) =>
    api.delete("/api/auth/otp/expire", { phone }),

  logout: () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("resident_id");
    localStorage.removeItem("isLoggedIn");
  },

  isLoggedIn: () => !!localStorage.getItem("jwt_token"),
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
  getDetail: (id: string) => api.get(`/api/defects/${id}`),
  submit: (data: unknown) => api.post("/api/defects", data),
};

// 공지 관련
export const noticeApi = {
  getList: () => api.get("/api/notices"),
  getDetail: (id: string) => api.get(`/api/notices/${id}`),
  markRead: (id: string) => api.post(`/api/notices/${id}/read`),
};

// 납부 관련
export const paymentApi = {
  getList: () => api.get("/api/payments"),
  getDetail: (id: string) => api.get(`/api/payments/${id}`),
  confirm: (id: string) => api.post(`/api/payments/${id}/confirm`),
};

// 이사예약 관련
export const movingApi = {
  getMe: () => api.get("/api/moving/me"),
  reserve: (data: unknown) => api.post("/api/moving", data),
};

// QR 관련
export const qrApi = {
  getQr: () => api.get("/api/qr/me"),
};
