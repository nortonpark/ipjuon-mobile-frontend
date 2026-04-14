import { useEffect } from "react";
import { App } from "@capacitor/app";
import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { api } from "@/lib/api";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function useFcmToken() {
  useEffect(() => {
    sendFcmToken();

    // 백그라운드 → 포그라운드 복귀 시 갱신
    const listener = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) sendFcmToken();
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, []);
}

async function sendFcmToken() {
  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;

    await api.post("/api/fcm/token", {
      token,
      deviceInfo: getDeviceInfo(),
    });

    console.log("FCM 토큰 전송 완료");
  } catch (e) {
    console.warn("FCM 토큰 전송 실패:", e);
  }
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad/i.test(ua)) return "iOS";
  return "Web";
}