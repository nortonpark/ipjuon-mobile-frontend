import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Info, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

type Step = "phone" | "otp";

const LoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) {
      toast.error("휴대폰 번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      toast.success("인증번호가 발송되었습니다.");
      setStep("otp");
    } catch {
      toast.error("인증번호 발송에 실패했습니다. 번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("인증번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtp(phone, otp);
      localStorage.setItem("isLoggedIn", "true");
      toast.success("로그인 성공!");
      const onboarded = localStorage.getItem("onboarding_done");
      navigate(onboarded ? "/" : "/onboarding");
    } catch {
      toast.error("인증번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 아파트 창문 패턴
  const windowPattern = [
    true, false, true, true,
    false, true, false, true,
    true, true, false, false,
  ];

  return (
    <div className="bg-gradient-to-b from-[#0f1923] to-[#1a3c5e] flex flex-col items-center justify-between min-h-screen px-6">
      {/* Top Section */}
      <div className="flex-1 flex flex-col items-center justify-center pt-16 pb-8">
        <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center mb-8 border border-white/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1.5">
            <div className="grid grid-cols-4 gap-1.5">
              {windowPattern.map((lit, i) => (
                <div
                  key={i}
                  className={`w-4 h-3 rounded-sm ${lit ? "bg-yellow-300/80" : "bg-white/20"}`}
                />
              ))}
            </div>
            <div className="w-5 h-6 bg-white/30 rounded-t-md mt-1" />
          </div>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">입주ON</h1>
        <p className="text-sm text-white/60 mt-2">아파트 입주 관리 플랫폼</p>
      </div>

      {/* Bottom Section */}
      <div className="w-full max-w-[390px] bg-white rounded-t-3xl px-6 pt-8 pb-12">
        <h2 className="text-lg font-bold text-gray-900 mb-6">세대주 로그인</h2>

        {step === "phone" ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">휴대폰 번호</label>
              <Input
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                className="h-14 rounded-2xl border-gray-200 bg-gray-50 px-4 text-base focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <Button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0f1923] to-[#2e86c1] text-white font-bold text-base shadow-lg shadow-blue-900/30 active:scale-[0.98] transition-transform mt-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "인증번호 받기"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                인증번호 <span className="text-blue-500">({phone})</span>
              </label>
              <Input
                placeholder="6자리 인증번호 입력"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                maxLength={6}
                className="h-14 rounded-2xl border-gray-200 bg-gray-50 px-4 text-base text-center tracking-widest focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <Button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0f1923] to-[#2e86c1] text-white font-bold text-base shadow-lg shadow-blue-900/30 active:scale-[0.98] transition-transform"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "로그인"}
            </Button>
            <button
              onClick={() => { setStep("phone"); setOtp(""); }}
              className="w-full text-xs text-gray-400 text-center mt-2"
            >
              ← 번호 다시 입력
            </button>
          </div>
        )}

        <div className="bg-blue-50 rounded-2xl p-4 mt-6">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-700">입주자 인증 안내</span>
          </div>
          <p className="text-xs text-blue-500 mt-1">
            세대주 등록 휴대폰 번호로 인증번호를 받아 로그인하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
