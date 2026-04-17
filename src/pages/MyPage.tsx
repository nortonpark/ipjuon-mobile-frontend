import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, ChevronRight, Phone, MessageSquare, Loader2 } from "lucide-react";
import BottomTabBar from "@/components/BottomTabBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { residentApi, authApi } from "@/lib/api";


const MyPage = () => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [unitNumber, setUnitNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [name, setName] = useState("");

  const [notifications, setNotifications] = useState({
    notify_notice: true,
    notify_payment: true,
    notify_defect: true,
    notify_event: false,
    notify_move_in: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resident = await residentApi.getMe();
        if (resident) {
        setName(resident.name || "");
        setPhone(resident.phone || "");
        setCarNumber(resident.carNumber || "");
        setUnitNumber(
          resident.dong && resident.ho
            ? `${resident.dong}동 ${resident.ho}호`
            : ""
        );
        setNotifications({
          notify_notice:  resident.notifyNotice  ?? true,
          notify_payment: resident.notifyPayment ?? true,
          notify_defect:  resident.notifyDefect  ?? true,
          notify_event:   resident.notifyEvent   ?? false,
          notify_move_in: resident.notifyMoveIn  ?? true,
        });
        }
      } catch {
        // 오류 시 기본값 유지
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const NOTIFY_KEY_MAP: Record<string, string> = {
    notify_notice:  "notifyNotice",
    notify_payment: "notifyPayment",
    notify_defect:  "notifyDefect",
    notify_event:   "notifyEvent",
    notify_move_in: "notifyMoveIn",
  };

  const toggleNotification = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newValue }));
    try {
      await residentApi.updateNotifications({ [key]: newValue });
      toast.success("알림 설정이 변경되었습니다.");
    } catch {
      setNotifications(prev => ({ ...prev, [key]: !newValue }));
      toast.error("알림 설정 변경에 실패했습니다.");
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await residentApi.updateProfile({ phone, car_number: carNumber });
      toast.success("개인정보가 수정되었습니다.");
      setShowProfile(false);
    } catch {
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutConfirm  = () => {
    authApi.logout();
    navigate("/login");
  };

  const menuItems = [
    { color: "bg-blue-500", label: "공지·안내문", desc: "공지·안내문·동의서 모아보기", action: () => navigate("/notice") },
    { color: "bg-indigo-500", label: "입주증", desc: "디지털 입주증 확인 및 저장", action: () => navigate("/certificate") },
    { color: "bg-teal-500", label: "자주 묻는 질문", desc: "잔금·등기·하자 등 FAQ", action: () => navigate("/faq") },
    { color: "bg-amber-500", label: "알림 설정", desc: "푸시알림 항목별 ON/OFF", action: () => setShowNotification(true) },
    { color: "bg-muted-foreground", label: "개인정보 수정", desc: "연락처·차량번호 변경", action: () => setShowProfile(true) },
    { color: "bg-purple-500", label: "입주지원센터 연락", desc: "전화 / 채팅 문의", action: () => setShowContact(true) },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-[390px] min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[390px] min-h-screen bg-background flex flex-col">
      <div className="bg-navy text-white px-6 pt-14 pb-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full border-[3px] border-primary bg-white/10 flex items-center justify-center mb-3">
          <User className="w-10 h-10 text-foreground" />
        </div>
        {name && <p className="text-foreground font-bold text-lg mt-2">{name}님</p>}
      </div>

      <div className="px-4 -mt-6">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-1">세대 정보</h2>
          <p className="text-xs text-foreground">{unitNumber}</p>
          <p className="text-xs text-muted-foreground mt-1">
            연락처: {phone}
            {carNumber ? ` · 등록차량: ${carNumber}` : ""}
          </p>
        </div>
      </div>

      <div className="px-4 mt-4 flex-1">
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <button key={i} onClick={item.action}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 hover:bg-muted/30 transition-colors text-left">
              <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground block">{item.label}</span>
                <span className="text-[11px] text-muted-foreground">{item.desc}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 pb-24 text-center">
        <button className="text-sm text-destructive font-medium" onClick={() => setShowLogoutConfirm(true)}>로그아웃</button>
      </div>

      <BottomTabBar />

      {/* 개인정보 수정 */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-[360px] rounded-xl">
          <DialogHeader><DialogTitle className="text-base">개인정보 수정</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">연락처</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">등록 차량번호</label>
              <Input value={carNumber} onChange={(e) => setCarNumber(e.target.value)} placeholder="00가0000" />
            </div>
            <Button onClick={handleProfileSave} disabled={saving} className="w-full bg-primary text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} 저장하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 입주지원센터 연락 */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="max-w-[360px] rounded-xl">
          <DialogHeader><DialogTitle className="text-base">입주지원센터 연락</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <a href="tel:1588-0000" className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-4 active:scale-[0.98] transition-all">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">전화 문의</p>
                <p className="text-xs text-muted-foreground">1588-0000 (평일 09~18시)</p>
              </div>
            </a>
            <a href="sms:1588-0000" className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-4 active:scale-[0.98] transition-all">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-bold text-foreground">문자 문의</p>
                <p className="text-xs text-muted-foreground">1588-0000으로 문자 보내기</p>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* 알림 설정 */}
      <Dialog open={showNotification} onOpenChange={setShowNotification}>
        <DialogContent className="max-w-[360px] rounded-xl">
          <DialogHeader><DialogTitle className="text-base">알림 설정</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-1 pt-2">
            {[
              { key: "notify_defect" as const, label: "하자 처리 현황", desc: "접수/처리중/완료 상태 변경 시" },
              { key: "notify_payment" as const, label: "납부 안내", desc: "납부 기한 및 완납 알림" },
              { key: "notify_move_in" as const, label: "입주 일정", desc: "사전점검·입주 관련 공지" },
              { key: "notify_notice" as const, label: "공지사항", desc: "관리사무소 공지 알림" },
              { key: "notify_event" as const, label: "이벤트·혜택", desc: "입주민 이벤트 및 할인 정보" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={notifications[item.key]} onCheckedChange={() => toggleNotification(item.key)} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 로그아웃 확인 */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-[320px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">로그아웃</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground pt-1 pb-2">
            정말 로그아웃 하시겠습니까?
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowLogoutConfirm(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleLogoutConfirm}
            >
              로그아웃
            </Button>
          </div>
        </DialogContent>
      </Dialog>      
    </div>
  );
};

export default MyPage;
