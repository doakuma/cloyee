import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CalendarDays,
  Flame,
  BookOpen,
  Trophy,
  ChevronRight,
  PlayCircle,
} from "lucide-react";



// ─── 데이터 fetching ──────────────────────────────────────────────────────────

async function getDashboardData() {
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, category_id, created_at, categories(name)")
    .eq("is_complete", true)
    .order("created_at", { ascending: false });

  if (!sessions || sessions.length === 0) {
    return { totalDays: 0, streak: 0, weekSessions: 0, level: 1, levelProgress: 0, recentSessions: [] };
  }

  // 총 학습일 (날짜 중복 제거)
  const dateKey = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  };
  const uniqueDates = new Set(sessions.map((s) => dateKey(s.created_at)));
  const totalDays = uniqueDates.size;

  // 이번 주 세션
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const weekSessions = sessions.filter((s) => new Date(s.created_at) >= startOfWeek).length;

  // 레벨 (5회당 1레벨)
  const level = Math.floor(sessions.length / 5) + 1;
  const levelProgress = sessions.length % 5; // 현재 레벨 내 진행 횟수

  // 연속 streak 계산
  const sortedDates = [...uniqueDates]
    .map((s) => {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m - 1, d);
    })
    .sort((a, b) => b - a);

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);

  for (const date of sortedDates) {
    if (date.getTime() === cursor.getTime()) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (date < cursor) {
      break;
    }
  }

  return {
    totalDays,
    streak,
    weekSessions,
    level,
    levelProgress,
    recentSessions: sessions.slice(0, 3),
  };
}

// ─── 카테고리 fetching ────────────────────────────────────────────────────────

async function getCategories() {
  const { data } = await supabase
    .from("categories")
    .select("id, name, icon, is_default");

  return data ?? [];
}

// ─── 미완료 세션 fetching (이어하기) ──────────────────────────────────────────

async function getIncompleteSessions() {
  const { data } = await supabase
    .from("sessions")
    .select("id, title, category_id, score, created_at, categories(name)")
    .eq("is_complete", false)
    .eq("mode", "chat")
    .order("created_at", { ascending: false })
    .limit(3);

  return data ?? [];
}

// ─── 통계 카드 정의 ────────────────────────────────────────────────────────────

function statCards({ totalDays, streak, weekSessions, level }) {
  return [
    { label: "총 학습일", value: `${totalDays}일`, icon: CalendarDays, color: "text-blue-500" },
    { label: "연속 학습", value: `${streak}일`, icon: Flame, color: "text-orange-500" },
    { label: "이번 주 세션", value: `${weekSessions}회`, icon: BookOpen, color: "text-green-500" },
    { label: "현재 레벨", value: `Lv.${level}`, icon: Trophy, color: "text-yellow-500" },
  ];
}

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [
    { totalDays, streak, weekSessions, level, levelProgress, recentSessions },
    categories,
    incompleteSessions,
  ] = await Promise.all([getDashboardData(), getCategories(), getIncompleteSessions()]);

  const stats = statCards({ totalDays, streak, weekSessions, level });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">

      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">안녕하세요! 👋</h1>
        <p className="text-muted-foreground mt-1">오늘도 꾸준히 성장해볼까요?</p>
      </div>

      {/* 이어하기 카드 (미완료 세션 있을 때만) */}
      {incompleteSessions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            이어하기
          </h2>
          <div className="space-y-2">
            {incompleteSessions.map((session) => (
              <Link
                key={session.id}
                href={`/study/chat?session_id=${session.id}&category=${encodeURIComponent(session.category_id ?? "")}&title=${encodeURIComponent(session.title ?? "")}`}
              >
                <Card className="cursor-pointer hover:ring-primary/40 hover:ring-2 transition-all border-primary/20 bg-primary/5">
                  <CardContent className="flex items-center gap-4">
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
                      <PlayCircle size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{session.title ?? "학습 세션"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {session.categories?.name ?? "—"} · {new Date(session.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} 중단
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {session.score != null && (
                        <span className="text-xs font-semibold text-primary">{session.score}점</span>
                      )}
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 통계 카드 4개 */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          나의 현황
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <Icon size={14} className={color} />
                  {label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                {label === "현재 레벨" && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{levelProgress}/5회</span>
                      <span>Lv.{level + 1}까지</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(levelProgress / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 카테고리 카드 4개 */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          학습 시작하기
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.length === 0 ? (
            <p className="col-span-4 text-sm text-muted-foreground">카테고리가 없습니다.</p>
          ) : (
            categories.map((cat, i) => (
              <Link key={cat.id} href={`/study?category=${cat.id}`}>
                <Card className="h-full cursor-pointer hover:ring-primary/40 hover:ring-2 transition-all">
                  <CardHeader>
                    <span className="text-2xl">{cat.icon}</span>
                    <CardTitle className="mt-2">{cat.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 최근 학습 기록 3개 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            최근 학습
          </h2>
          <Link
            href="/history"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
          >
            전체 보기 <ChevronRight size={14} />
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              아직 학습 기록이 없습니다.{" "}
              <Link href="/study" className="underline underline-offset-2 hover:text-foreground">
                첫 학습을 시작해보세요!
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <Link key={session.id} href={`/history/${session.id}`}>
                <Card size="sm" className="hover:ring-primary/30 hover:ring-2 transition-all cursor-pointer">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{session.title ?? "학습 세션"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{session.categories?.name ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {new Date(session.created_at).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <ChevronRight size={14} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
