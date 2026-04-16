import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PushNotifications } from "@capacitor/push-notifications";  // ← 추가

import { Capacitor } from "@capacitor/core";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import PaymentPage from "./pages/PaymentPage";
import QRPage from "./pages/QRPage";
import ReservationPage from "./pages/ReservationPage";
import NoticePage from "./pages/NoticePage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import DefectReportPage from "./pages/DefectReportPage";
import ConsentPage from "./pages/ConsentPage";
import CertificatePage from "./pages/CertificatePage";
import MyPage from "./pages/MyPage";
import DefectDetailPage from "./pages/DefectDetailPage";
import NoticeDetailPage from "./pages/NoticeDetailPage";
import LoanPage from "./pages/LoanPage";
import RegistryPage from "./pages/RegistryPage";
import ServicesPage from "./pages/ServicesPage";
import InteriorPage from "./pages/InteriorPage";
import MovingPage from "./pages/MovingPage";
import FaqPage from "./pages/FaqPage";
import OnboardingPage from "./pages/OnboardingPage";

const queryClient = new QueryClient();

const initPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;

  const { receive } = await PushNotifications.requestPermissions();
  if (receive !== "granted") {
    console.warn("FCM 권한 거부됨");
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener("registration", (token) => {
    console.log("FCM Token:", token.value);
    localStorage.setItem("fcm_token", token.value);
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("FCM registration error:", error);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push received:", notification);
    toast(notification.title ?? "새 알림", {
        description: notification.body,
        duration: 5000,
    });    
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("Push action:", action);
  });
};

declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

const App = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 버전 바뀌면 토큰 초기화 → 재로그인 유도
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion !== APP_VERSION) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('resident_id');
      localStorage.removeItem('site_id');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('fcm_token');
      localStorage.setItem('app_version', APP_VERSION);
    }
    setReady(true);
    initPushNotifications(); 
  }, []);

  if (!ready) return null;   // ← 초기화 전 빈 화면 방지

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="/qr" element={<ProtectedRoute><QRPage /></ProtectedRoute>} />
            <Route path="/reservation" element={<ProtectedRoute><ReservationPage /></ProtectedRoute>} />
            <Route path="/notice" element={<ProtectedRoute><NoticePage /></ProtectedRoute>} />
            <Route path="/notice/:id" element={<ProtectedRoute><NoticeDetailPage /></ProtectedRoute>} />
            <Route path="/defect" element={<ProtectedRoute><DefectReportPage /></ProtectedRoute>} />
            <Route path="/defect/:id" element={<ProtectedRoute><DefectDetailPage /></ProtectedRoute>} />
            <Route path="/consent" element={<ProtectedRoute><ConsentPage /></ProtectedRoute>} />
            <Route path="/certificate" element={<ProtectedRoute><CertificatePage /></ProtectedRoute>} />
            <Route path="/loan" element={<ProtectedRoute><LoanPage /></ProtectedRoute>} />
            <Route path="/registry" element={<ProtectedRoute><RegistryPage /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
            <Route path="/interior" element={<ProtectedRoute><InteriorPage /></ProtectedRoute>} />
            <Route path="/moving" element={<ProtectedRoute><MovingPage /></ProtectedRoute>} />
            <Route path="/faq" element={<ProtectedRoute><FaqPage /></ProtectedRoute>} />
            <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;