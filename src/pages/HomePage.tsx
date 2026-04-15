import { useState, useEffect } from "react";
import {
  CheckCircle2, Circle, AlertTriangle, ChevronRight,
  ClipboardList, ListChecks, Loader2, X, WifiOff, Upload, Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { defectApi, homeApi } from "@/lib/api";
import { useOfflineDrafts } from "@/hooks/useOfflineDrafts";
import { DashboardData } from "@/lib/api";
import { useFcmToken } from "@/hooks/useFcmToken";

// ─── 타입 ─────────────────────────────────────────────
interface DefectRow {
  receipt_no: string;
  location: string;
  mid_category: string | null;
  status: string;
  is_urgent: boolean;
}

// ─── 상수 ─────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  미배정: "text-muted-foreground",
  접수완료: "text-primary",
  배정완료: "text-primary",
  처리중: "text-warning",
  처리완료: "text-success",
  완료: "text-success",
};

const BADGE_CLASS: Record<string, string> = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

const MOVE_IN_GUIDE = [
  { icon: "🔑", title: "열쇠 수령",             desc: "입주지원센터 방문 → 신분증 + 입주증 지참" },
  { icon: "🚗", title: "주차 배정 확인",         desc: "배정 주차구역 확인 후 차량 이동" },
  { icon: "🔥", title: "가스 개통 신청",         desc: "도시가스 앱 또는 전화 신청 (당일 가능)" },
  { icon: "💡", title: "전기·수도 명의 변경",    desc: "한전 고객센터 123 / 수도사업소 연락" },
  { icon: "📦", title: "이사 완료 후 공용부 확인", desc: "엘리베이터·복도 파손 여부 확인" },
  { icon: "💰", title: "관리비 예치금 납부",      desc: "미납 시 앱 납부 탭에서 확인" },
];

const CIRCUMFERENCE = 2 * Math.PI * 34;

// ─── 유틸 ─────────────────────────────────────────────
const calcDday = (dateStr: string) => {
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / 86_400_000
  );
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-Day";
  return `D+${Math.abs(diff)}`;
};

// ─── 공통 슬라이드 패널 ───────────────────────────────
interface SlidePanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const SlidePanel = ({ title, onClose, children, footer }: SlidePanelProps) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div className="relative w-full max-w-[390px] bg-background rounded-t-2xl shadow-xl animate-slide-up max-h-[80vh] flex flex-col">
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="px-5 py-4 border-t border-border">{footer}</div>}
    </div>
  </div>
);

// ─── 메인 컴포넌트 ────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const { drafts, syncAll, syncing } = useOfflineDrafts();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [defects, setDefects] = useState<DefectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDefectList, setShowDefectList] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showMoveInGuide, setShowMoveInGuide] = useState(false);

  useFcmToken();  // 앱 실행 시 자동 토큰 전송

  useEffect(() => {
    Promise.all([
      homeApi.getDashboard(),
      defectApi.getList(),
    ])
      .then(([dash, defectList]) => {
        console.log("dashboard:", dash);        // ← 추가
        console.log("defects:", defectList);    // ← 추가        
        setDashboard(dash);
        if (Array.isArray(defectList)) setDefects(defectList.slice(0, 10));
      })
      .catch((e) => console.error("에러:", e)) // ← 수정
      .finally(() => setLoading(false));
  }, []);

  if (loading || !dashboard) {
    return (
      <MobileLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  const { resident, readiness_percent, checklist, steps, notices } = dashboard;

  const completedCount = checklist.filter((i) => i.done).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);
  const dashoffset = CIRCUMFERENCE * (1 - readiness_percent / 100);
  const dday = calcDday(resident.move_in_date);
  const moveInDateLabel = new Date(resident.move_in_date).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const statusCounts = {
    접수완료: defects.filter((d) => ["미배정", "접수완료", "배정완료"].includes(d.status)).length,
    처리중:   defects.filter((d) => d.status === "처리중").length,
    완료:     defects.filter((d) => ["처리완료", "완료"].includes(d.status)).length,
  };

  return (
    <MobileLayout>

      {/* D-Day 배너 */}
      <div className="bg-gradient-to-r from-[#0f1923] to-[#2e86c1] rounded-2xl p-5 mx-0 mt-1 mb-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">입주 예정일</span>
            <p className="text-4xl font-black text-white mt-1">{dday}</p>
            <p className="text-xs text-white/70 mt-0.5">{moveInDateLabel} 입주</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 relative">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                <circle cx="40" cy="40" r="34" stroke="white" strokeWidth="6" fill="none"
                  strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashoffset}
                  strokeLinecap="round" transform="rotate(-90 40 40)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-white">{readiness_percent}%</span>
                <span className="text-[9px] text-white/70">준비완료</span>
              </div>
            </div>
            <span className="text-[10px] text-white/60 text-center mt-1">입주 준비율</span>
          </div>
        </div>
      </div>

      {/* 진행 단계 */}
      <div className="px-0 mt-0 mb-3">
        <div className="flex items-start">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-start flex-1">
              <div className="flex flex-col items-center">
                {step.status === "completed" ? (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                ) : step.status === "current" ? (
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted" />
                )}
                <span className="text-[10px] text-muted-foreground mt-1 text-center w-10">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("flex-1 h-0.5 self-center mb-4 mx-1",
                  step.status === "completed" ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 인사말 */}
      <div className="bg-accent text-accent-foreground rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium opacity-80">{resident.dong}동 {resident.ho}호</p>
          <span className="text-[10px] bg-primary/20 text-primary-foreground px-2 py-0.5 rounded-full font-medium">입주 예정</span>
        </div>
        <h2 className="text-lg font-bold mt-1">환영합니다!</h2>
      </div>

      {/* 오프라인 임시저장 */}
      {drafts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-800">📱 임시 저장: {drafts.length}건</p>
              <p className="text-[10px] text-amber-600">전송 대기 중인 하자 접수가 있습니다</p>
            </div>
          </div>
          <button onClick={syncAll} disabled={syncing}
            className="flex items-center gap-1 bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 disabled:opacity-50">
            <Upload className="w-3 h-3" />
            {syncing ? "전송 중..." : "일괄 전송"}
          </button>
        </div>
      )}

      {/* 공지사항 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-bold text-foreground">📢 공지사항</span>
          <button onClick={() => navigate("/notice")} className="text-sm text-primary font-medium">전체보기 →</button>
        </div>
        <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border divide-y divide-border">
          {notices.map((item, i) => (
            <button key={i} onClick={() => navigate("/notice")}
              className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${BADGE_CLASS[item.badge_type]}`}>
                  {item.name}
                </span>
                <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{item.date}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 하자 현황 */}
      <div className="bg-card rounded-xl p-4 mb-3 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-semibold text-foreground">하자 현황</h3>
          </div>
          <button onClick={() => navigate("/defect")}
            className="flex items-center gap-1 bg-destructive/10 text-destructive text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
            <ClipboardList className="w-3 h-3" /> 접수하기
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "접수완료", count: statusCounts.접수완료, color: "primary" },
            { label: "처리중",   count: statusCounts.처리중,   color: "warning" },
            { label: "완료",     count: statusCounts.완료,     color: "success" },
          ].map(({ label, count, color }) => (
            <div key={label} className={`bg-${color}/10 rounded-lg p-3 text-center`}>
              <p className={`text-2xl font-bold text-${color}`}>{count}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setShowDefectList(true)}
          className="w-full flex items-center justify-center gap-1 mt-3 pt-3 border-t border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ListChecks className="w-3.5 h-3.5" /> 나의 접수 내역 보기 <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 입주 진행률 */}
      <button onClick={() => setShowChecklist(true)}
        className="w-full bg-card rounded-xl p-4 mb-3 shadow-sm border border-border text-left active:scale-[0.99] transition-transform">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">입주 진행률</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">{progressPercent}%</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <Progress value={progressPercent} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">{completedCount}/{checklist.length}개 항목 완료</p>
      </button>

      {/* 입주 당일 가이드 */}
      <button onClick={() => setShowMoveInGuide(true)}
        className="w-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 text-left active:scale-[0.99] transition-transform mt-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <span className="text-lg">🏠</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">입주 당일 가이드</p>
            <p className="text-[10px] text-muted-foreground">준비할 것들을 확인하세요</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
        </div>
      </button>

      {/* 슬라이드 패널: 하자 접수 내역 */}
      {showDefectList && (
        <SlidePanel title="나의 하자 접수 내역" onClose={() => setShowDefectList(false)}
          footer={
            <button onClick={() => { setShowDefectList(false); navigate("/defect"); }}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold active:scale-[0.98] transition-transform">
              새 하자 접수하기
            </button>
          }>
          {defects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">접수된 하자가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {defects.map((d) => (
                <div key={d.receipt_no}
                  className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3 border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{d.receipt_no}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.mid_category || ""} · {d.location}</p>
                  </div>
                  <span className={cn("text-sm font-bold shrink-0", STATUS_COLOR[d.status] || "text-muted-foreground")}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SlidePanel>
      )}

      {/* 슬라이드 패널: 체크리스트 */}
      {showChecklist && (
        <SlidePanel title="입주 체크리스트" onClose={() => setShowChecklist(false)}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">{completedCount}/{checklist.length}개 완료</span>
            <span className="text-lg font-bold text-primary">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3 mb-5" />
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item.id}
                className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3 border border-border">
                {item.done
                  ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  : <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                <span className={cn("text-sm flex-1", item.done ? "text-foreground" : "text-muted-foreground")}>
                  {item.label}
                </span>
                {item.done ? (
                  <span className="text-xs font-bold text-success">완료</span>
                ) : (
                  <button onClick={() => { setShowChecklist(false); navigate(item.path); }}
                    className="text-xs font-bold text-primary border border-primary/40 bg-primary/10 px-2.5 py-1 rounded-lg active:scale-95 transition-transform">
                    바로가기 →
                  </button>
                )}
              </li>
            ))}
          </ul>
        </SlidePanel>
      )}

      {/* 슬라이드 패널: 입주 당일 가이드 */}
      {showMoveInGuide && (
        <SlidePanel title="🏠 입주 당일 가이드" onClose={() => setShowMoveInGuide(false)}>
          <div className="space-y-3">
            {MOVE_IN_GUIDE.map((item, i) => (
              <div key={i}
                className="flex items-start gap-3 bg-muted/30 rounded-xl px-4 py-3 border border-border">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-base">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">💡 문의: 입주지원센터 1588-0000 (평일 09~18시)</p>
          </div>
        </SlidePanel>
      )}

    </MobileLayout>
  );
};

export default HomePage;