import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import MobileLayout from "@/components/MobileLayout";
import { ChevronLeft, ChevronRight, ClipboardList, Truck, Check, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { movingApi } from "@/lib/api";

interface AvailableDate {
  date: string;
  maxCount: number;
  reservedCount: number;
  closed: boolean;
}

interface MyReservation {
  id: string;
  type: string;
  scheduleDate: string;
  timeSlot: string;
  elevatorAssignment: string;
  status: string;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
];

const getDateRange = (dates: AvailableDate[]) => {
  if (dates.length === 0) return null;
  const sorted = [...dates].sort((a, b) => a.date.localeCompare(b.date));
  return {
    from: sorted[0].date,
    to: sorted[sorted.length - 1].date,
    maxCount: sorted[0].maxCount,  // ← 추가
  };
};

const ReservationPage = () => {
  const [activeTab, setActiveTab] = useState<"inspection" | "move">("inspection");
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [inspectionDates, setInspectionDates] = useState<AvailableDate[]>([]);
  const [moveDates, setMoveDates] = useState<AvailableDate[]>([]);

  const [inspectionReservation, setInspectionReservation] = useState<MyReservation | null>(null);
  const [inspectionDate, setInspectionDate] = useState<string | null>(null);
  const [inspectionTime, setInspectionTime] = useState<string | null>(null);
  const [inspectionEditId, setInspectionEditId] = useState<string | null>(null);
  const [moveEditId, setMoveEditId] = useState<string | null>(null);


  const [moveReservation, setMoveReservation] = useState<MyReservation | null>(null);
  const [moveInDate, setMoveInDate] = useState<string | null>(null);
  const [moveInTime, setMoveInTime] = useState<string | null>(null);

  const inspectionQrRef = useRef<HTMLCanvasElement>(null);
  const moveInQrRef = useRef<HTMLCanvasElement>(null);

  // 초기 내 예약 조회 (1회)
  useEffect(() => {
    const loadMyReservations = async () => {
      try {
        const [inspMy, moveMy] = await Promise.all([
          movingApi.getMyReservation("INSPECTION"),
          movingApi.getMyReservation("MOVING"),
        ]);
        if (inspMy?.id) setInspectionReservation(inspMy);
        if (moveMy?.id) setMoveReservation(moveMy);
      } catch {
        toast.error("예약 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadMyReservations();
  }, []);

  // 월 변경 시 가능 날짜 재조회
  useEffect(() => {
    const loadDates = async () => {
      try {
        const [inspDates, moveDts] = await Promise.all([
          movingApi.getAvailableDates("INSPECTION", calYear, calMonth),
          movingApi.getAvailableDates("MOVING", calYear, calMonth),
        ]);
        setInspectionDates(inspDates);
        setMoveDates(moveDts);
      } catch {
        toast.error("날짜 정보를 불러오지 못했습니다.");
      }
    };
    loadDates();
  }, [calYear, calMonth]);  

  useEffect(() => {
    if (!inspectionReservation) return;
    const timer = setTimeout(() => {
      if (inspectionQrRef.current) {
        QRCode.toCanvas(inspectionQrRef.current,
          `INSPECTION-${inspectionReservation.id}`,
          { width: 120, margin: 1 }
        );
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [inspectionReservation, activeTab]);

  useEffect(() => {
    if (!moveReservation) return;
    const timer = setTimeout(() => {
      if (moveInQrRef.current) {
        QRCode.toCanvas(moveInQrRef.current,
          `MOVEIN-${moveReservation.id}`,
          { width: 120, margin: 1 }
        );
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [moveReservation, activeTab]);

  // 예약 성공 후 날짜 재조회
  const refreshDates = async () => {
    const [inspDates, moveDts] = await Promise.all([
      movingApi.getAvailableDates("INSPECTION", calYear, calMonth),
      movingApi.getAvailableDates("MOVING", calYear, calMonth),
    ]);
    setInspectionDates(inspDates);
    setMoveDates(moveDts);
  };  

  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const activeDates = activeTab === "inspection" ? inspectionDates : moveDates;
  const inspectionRange = getDateRange(inspectionDates);
  const moveRange = getDateRange(moveDates);

  const getDateInfo = (day: number): AvailableDate | undefined => {
    const dateStr = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return activeDates.find((d) => d.date === dateStr);
  };

  const handlePrevMonth = () => {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  };  

  const renderCalendar = (
    selectedDate: string | null,
    onSelect: (d: string) => void
  ) => (
    <>      
      <div className="bg-accent text-accent-foreground rounded-xl p-3 flex items-center justify-between mb-4">
        <ChevronLeft className="w-5 h-5 cursor-pointer" onClick={handlePrevMonth} />
        <span className="text-sm font-semibold">{calYear}년 {calMonth}월</span>
        <ChevronRight className="w-5 h-5 cursor-pointer" onClick={handleNextMonth} />
      </div>
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm mb-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <span key={d} className={d === "일" ? "text-destructive" : d === "토" ? "text-primary" : ""}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks.map((b) => <div key={`b-${b}`} />)}
          {days.map((day) => {
            const dateStr = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;          
            const info = getDateInfo(day);
            const isAvailable = !!info && !info.closed;
            const isClosed = !!info && info.closed;
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={day}
                onClick={() => isAvailable && onSelect(dateStr)}
                className={cn(
                  "w-9 h-9 mx-auto rounded-full text-xs font-medium flex items-center justify-center transition-colors",
                  isSelected && "bg-accent text-accent-foreground",
                  !isSelected && isAvailable && "border border-success text-success",
                  !isSelected && isClosed && "border border-destructive/40 text-destructive/60",
                  !isSelected && !info && "text-muted-foreground"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-success" /> 예약가능</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-destructive" /> 마감</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> 선택</span>
        </div>
      </div>
    </>
  );

  const handleInspectionConfirm = async () => {
    if (!inspectionDate || !inspectionTime) return;
    try {
      const res = await movingApi.reserve({ type: "INSPECTION", scheduleDate: inspectionDate, timeSlot: inspectionTime });
      setInspectionReservation(res);
      toast.success(`사전점검 예약 완료: ${inspectionDate} ${inspectionTime}`);
    } catch {
      toast.error("예약에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleMoveConfirm = async () => {
    if (!moveInDate || !moveInTime) return;
    try {
      const res = await movingApi.reserve({ type: "MOVING", scheduleDate: moveInDate, timeSlot: moveInTime });
      setMoveReservation(res);
      await refreshDates();  // ← 추가
      toast.success(`이사 예약 완료: ${moveInDate} ${moveInTime}`);
    } catch {
      toast.error("예약에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleInspectionChange = async () => {
    if (!inspectionEditId || !inspectionDate || !inspectionTime) return;
    try {
      const res = await movingApi.update(inspectionEditId, {  // ← inspectionEditId 사용
        scheduleDate: inspectionDate,
        timeSlot: inspectionTime,
      });
      setInspectionReservation(res);
      setInspectionEditId(null);  // ← 초기화
      toast.success("사전점검 예약이 변경되었습니다.");
    } catch {
      toast.error("예약 변경에 실패했습니다.");
    }
  };

  const handleMoveChange = async () => {
    if (!moveEditId || !moveInDate || !moveInTime) return;
    try {
      const res = await movingApi.update(moveEditId, { scheduleDate: moveInDate, timeSlot: moveInTime });
      setMoveReservation(res);
      await refreshDates();  // ← 추가
      setMoveEditId(null);
      toast.success("이사 예약이 변경되었습니다.");
    } catch {
      toast.error("예약 변경에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <MobileLayout title="예약">
        <div className="flex flex-col items-center justify-center h-60 gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">예약 정보를 불러오는 중...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="예약">
      {/* Tab Switcher */}
      <div className="bg-muted rounded-xl p-1 flex mb-4">
        <button
          onClick={() => setActiveTab("inspection")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all",
            activeTab === "inspection" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
          )}
        >
          <ClipboardList className="w-4 h-4" />
          사전점검 예약
          {inspectionReservation && <Check className="w-3.5 h-3.5 text-success" />}
        </button>
        <button
          onClick={() => setActiveTab("move")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all",
            activeTab === "move" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
          )}
        >
          <Truck className="w-4 h-4" />
          이사 예약
          {moveReservation && <Check className="w-3.5 h-3.5 text-success" />}
        </button>
      </div>

      {/* 사전점검 예약 */}
      {activeTab === "inspection" && (
        <>
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs font-bold text-primary">사전점검 안내</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {inspectionRange
                ? `운영 기간: ${inspectionRange.from} ~ ${inspectionRange.to}`
                : "등록된 일정이 없습니다."}
            </p>
          </div>

          {inspectionReservation ? (
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <p className="text-sm font-bold text-success">사전점검 예약 완료</p>
              </div>
              <p className="text-sm text-foreground">{inspectionReservation.scheduleDate} {inspectionReservation.timeSlot}</p>
              <div className="flex flex-col items-center mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">사전점검 입장 QR</p>
                <canvas ref={inspectionQrRef} className="rounded-lg" />
              </div>
              <button
                onClick={() => {
                  setInspectionEditId(inspectionReservation.id);  // ← id 보관
                  setInspectionDate(inspectionReservation.scheduleDate);
                  setInspectionTime(inspectionReservation.timeSlot);
                  setInspectionReservation(null);
                }}
                className="mt-3 text-xs text-primary font-semibold underline"
              >
                변경
              </button>
            </div>
          ) : (
            <>
              {renderCalendar(inspectionDate, (d) => { setInspectionDate(d); setInspectionTime(null); })}
              {inspectionDate && (
                <div className="bg-card rounded-xl p-4 border border-border shadow-sm mb-4 animate-fade-in">
                  <p className="text-xs font-bold text-muted-foreground mb-2">시간 선택</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setInspectionTime(t)}
                        className={cn(
                          "py-2 rounded-lg text-xs font-medium border transition-colors",
                          inspectionTime === t
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-foreground hover:bg-muted/40"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button                
                onClick={inspectionEditId ? handleInspectionChange : handleInspectionConfirm}
                disabled={!inspectionDate || !inspectionTime}
                className={cn(
                  "w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm active:scale-[0.98] transition-transform",
                  (!inspectionDate || !inspectionTime) && "opacity-40 pointer-events-none"
                )}
              >
                사전점검 예약 확정
              </button>
            </>
          )}
        </>
      )}

      {/* 이사 예약 */}
      {activeTab === "move" && (
        <>
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs font-bold text-primary">이사 예약 안내</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {moveRange
                /* ? `운영 기간: ${moveRange.from} ~ ${moveRange.to} / 1일 ${moveRange.maxCount}세대 제한` */
                ? `운영 기간: ${moveRange.from} ~ ${moveRange.to}`
                : "등록된 일정이 없습니다."}
            </p>
          </div>

          {moveReservation ? (
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <p className="text-sm font-bold text-success">이사 예약 완료</p>
              </div>
              <p className="text-sm text-foreground">{moveReservation.scheduleDate} {moveReservation.timeSlot}</p>
              {moveReservation.elevatorAssignment && (
                <p className="text-xs text-muted-foreground mt-1">엘리베이터: {moveReservation.elevatorAssignment}</p>
              )}
              <div className="flex flex-col items-center mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">이사 차량 출입 QR</p>
                <canvas ref={moveInQrRef} className="rounded-lg" />
              </div>
              <button
                onClick={() => {
                  setMoveEditId(moveReservation.id);  // ← id 보관
                  setMoveInDate(moveReservation.scheduleDate);
                  setMoveInTime(moveReservation.timeSlot);
                  setMoveReservation(null);
                }}
                className="mt-3 text-xs text-primary font-semibold underline"
              >
                변경
              </button>
            </div>
          ) : (
            <>
              {renderCalendar(moveInDate, (d) => { setMoveInDate(d); setMoveInTime(null); })}
              {moveInDate && (
                <div className="bg-card rounded-xl p-4 border border-border shadow-sm mb-4 animate-fade-in">
                  {/* ← 추가 */}
                  {(() => {
                    const info = moveDates.find(d => d.date === moveInDate);
                    return info ? (
                      <p className="text-xs text-muted-foreground mb-3">
                        1일 최대 <span className="font-bold text-foreground">{info.maxCount}세대</span> 제한
                        &nbsp;·&nbsp; 잔여 <span className="font-bold text-primary">{info.maxCount - info.reservedCount}세대</span>
                      </p>
                    ) : null;
                  })()}

                  <p className="text-xs font-bold text-muted-foreground mb-2">시간 선택</p>
                  <div className="flex gap-2">
                    {["오전 (09:00~12:00)", "오후 (13:00~17:00)"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setMoveInTime(t)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-xs font-semibold border transition-colors",
                          moveInTime === t
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-foreground hover:bg-muted/40"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {moveInTime && (
                    <div className="mt-3 bg-muted/30 rounded-lg px-3 py-2 text-xs text-muted-foreground animate-fade-in">
                      엘리베이터 배정은 관리자 확인 후 안내됩니다.
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={moveEditId ? handleMoveChange : handleMoveConfirm}                
                disabled={!moveInDate || !moveInTime}
                className={cn(
                  "w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm active:scale-[0.98] transition-transform",
                  (!moveInDate || !moveInTime) && "opacity-40 pointer-events-none"
                )}
              >
                이사 예약 확정
              </button>
            </>
          )}
        </>
      )}
    </MobileLayout>
  );
};

export default ReservationPage;