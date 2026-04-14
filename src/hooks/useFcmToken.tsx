import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { api } from "@/lib/api";

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad/i.test(ua)) return "iOS";
  return "Web";
}

async function sendFcmToken() {
  if (!Capacitor.isNativePlatform()) return;

  const token = localStorage.getItem("fcm_token");
  if (!token) {
    console.warn("FCM 토큰 없음 - 아직 발급 안됨");
    return;
  }

  try {
    await api.post("/api/fcm/token", {
      token,
      deviceInfo: getDeviceInfo(),
    });
    console.log("FCM 토큰 저장 완료");
  } catch (e) {
    console.warn("FCM 토큰 전송 실패:", e);
  }
}

export function useFcmToken() {
  useEffect(() => {
    sendFcmToken();
  }, []);
}