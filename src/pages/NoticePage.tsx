import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import { cn } from "@/lib/utils";
import { noticeApi, codeApi } from "@/lib/api";

const badgeColors: Record<string, string> = {
  공지:   "bg-primary/15 text-primary border-primary/30",
  안내문: "bg-destructive/15 text-destructive border-destructive/30",
  동의서: "bg-amber-100 text-amber-700 border-amber-300",
};

const cardBorder: Record<string, string> = {
  공지:   "border-border",
  안내문: "border-destructive/30",
  동의서: "border-amber-300",
};

interface Notice {
  id: string;
  badge: string;
  name: string;
  badgeType: string;
  title: string;
  content: string;
  date: string;
}

interface CodeItem {
  code: string;
  name: string;
  sortOrder: number;
}

const NoticePage = () => {
  const [active, setActive] = useState<string>("전체");
  const [filters, setFilters] = useState<string[]>(["전체"]);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 공통코드 로딩
  useEffect(() => {
    codeApi.getList("NOTICE_TYPE")
      .then((data: CodeItem[]) => {
        setFilters(["전체", ...data.map((c) => c.name)]);
        // { 공지: '1', 안내문: '2', 동의서: '3' }
        const map: Record<string, string> = {};
        data.forEach((c) => { map[c.name] = c.code; });
        setCodeMap(map);
      })
      .catch(() => {
        setFilters(["전체", "공지", "안내문", "동의서"]);
      });
  }, []);

  // 공지 목록 로딩
  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      try {
        const data = await noticeApi.getList(active, codeMap);
        setNotices(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, [active, codeMap]);

  const handleCardClick = (notice: Notice) => {
    if (notice.name === "동의서") {
      navigate("/consent");
    } else {
      navigate(`/notice/${notice.id}`);
    }
  };

  return (
    <MobileLayout title="공지·안내문">
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-medium transition-colors border whitespace-nowrap",
              active === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-2xl">📭</span>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">공지사항이 없습니다</p>
            <p className="text-xs text-muted-foreground">해당 카테고리의 공지가 없어요</p>
          </div>
        ) : (
          notices.map((n) => (
            <button
              key={n.id}
              onClick={() => handleCardClick(n)}
              className={cn(
                "w-full text-left bg-card rounded-xl p-4 border shadow-sm relative",
                cardBorder[n.name] ?? "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded border font-semibold",
                  badgeColors[n.name] ?? "bg-muted text-muted-foreground"
                )}>
                  {n.name}
                </span>
                <span className="text-[10px] text-muted-foreground">{n.date}</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">{n.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{n.content}</p>
            </button>
          ))
        )}
      </div>
    </MobileLayout>
  );
};

export default NoticePage;