import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { noticeApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const badgeColors: Record<string, string> = {
  안내문: "bg-destructive/15 text-destructive border-destructive/30",
  공지: "bg-primary/15 text-primary border-primary/30",
  동의서: "bg-amber-100 text-amber-700 border-amber-300",
};

interface Notice {
  id: string;
  type: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

const NoticeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await noticeApi.getDetail(id!);
        setNotice(data);
        noticeApi.markRead(id!).catch(() => {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[390px] min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="mx-auto max-w-[390px] min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-40 bg-navy text-white flex items-center h-12 px-4">
          <button onClick={() => navigate("/notice")} className="mr-2 flex items-center gap-1">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs text-white/70">목록</span>
          </button>
          <h1 className="flex-1 text-center text-base font-semibold pr-16">공지 상세</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">공지를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[390px] min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-navy text-white flex items-center h-12 px-4">
        <button onClick={() => navigate("/notice")} className="mr-2 flex items-center gap-1">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs text-white/70">목록</span>
        </button>
        <h1 className="flex-1 text-center text-base font-semibold pr-16">공지 상세</h1>
      </header>

      <div className="flex-1 px-4 pt-4 pb-6 flex flex-col gap-4 overflow-y-auto">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-[10px] px-2 py-0.5 rounded border font-semibold", badgeColors[notice.type] ?? "bg-muted text-muted-foreground")}>
              {notice.type}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(notice.createdAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}
            </span>
          </div>
          <h2 className="text-base font-bold text-foreground">{notice.title}</h2>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">상세 내용</h3>
          <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
            {notice.content}
          </div>
        </div>

        {notice.type === "동의서" && (
          <button
            onClick={() => navigate("/consent")}
            className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-base font-bold transition-colors"
          >
            서명하러 가기
          </button>
        )}
      </div>
    </div>
  );
};

export default NoticeDetailPage;