import MobileLayout from "@/components/MobileLayout";
import { Car, Clock, ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { qrApi, residentApi } from "@/lib/api";

const hours = Array.from({ length: 25 }, (_, i) => i.toString().padStart(2, "0") + ":00");

const QRPage = () => {
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [vehicleQR, setVehicleQR] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [residentInfo, setResidentInfo] = useState({ dong: "", ho: "", name: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qrData, resident] = await Promise.all([
          qrApi.getQr(),
          residentApi.getMe(),
        ]);
        if (qrData?.qrCode) setQrImage(qrData.qrCode);
        if (resident) {
          setResidentInfo({
            dong: resident.dong || "",
            ho: resident.ho || "",
            name: resident.name || "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleIssue = () => {
    setVehicleQR(true);
    setShowVehicleForm(false);
    toast.success("방문 차량 출입 QR이 발급되었습니다");
  };

  return (
    <MobileLayout title="QR 입장코드">
      {/* QR 코드 카드 */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col items-center">
        {loading ? (
          <div className="w-48 h-48 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : qrImage ? (
          <img src={qrImage} alt="QR코드" className="w-48 h-48 rounded-xl" />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-xl">
            <p className="text-xs text-muted-foreground">QR 생성 실패</p>
          </div>
        )}
        <p className="text-base font-bold text-foreground mt-4">
          {residentInfo.dong}동 {residentInfo.ho}호 | {residentInfo.name}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">입주민 전용 출입 QR</p>
        </div>
      </div>

      {/* 차량 QR 발급 결과 */}
      {vehicleQR && (
        <div className="bg-card rounded-xl p-4 border border-primary/30 shadow-sm mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">방문 차량 출입 QR</h4>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">허용 시간</span>
              <span className="text-foreground font-medium">{startTime} ~ {endTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* 차량 QR 발급 폼 */}
      {showVehicleForm && (
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm mt-4 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">방문 차량 출입 QR 발급</h4>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">허용 시간 (24시간)</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-medium text-foreground pr-8">
                  {hours.slice(0, -1).map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span className="text-muted-foreground text-sm">~</span>
              <div className="relative flex-1">
                <select value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-medium text-foreground pr-8">
                  {hours.slice(1).map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
          <Button onClick={handleIssue} className="w-full h-11 rounded-xl font-semibold">
            QR 발급하기
          </Button>
        </div>
      )}

      {/* 하단 버튼 */}
      {!showVehicleForm && (
        <button onClick={() => setShowVehicleForm(true)}
          className="w-full mt-4 bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
          <Car className="w-4 h-4" />
          방문 차량 출입 QR 발급
        </button>
      )}
    </MobileLayout>
  );
};

export default QRPage;