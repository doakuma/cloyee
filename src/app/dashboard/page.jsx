import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
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
  Plus,
} from "lucide-react";
import IncompleteSessions from "@/components/home/IncompleteSessions";



// ─── 데이터 fetching ──────────────────────────────────────────────────────────

async function getDashboardData(supabase, userId) {
  let query = supabase
    .from("sessions")
    .select("id, title, category_id, created_at, categories(name)")
    .eq("is_complete", true)
    .order("created_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);

  const { data: sessions } = await query;

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

// ─── 로드맵 fetching ──────────────────────────────────────────────────────────

async function getRoadmaps(supabase, userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from("roadmaps")
    .select("id, topic, difficulty, duration, category_id, categories(name, icon)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ─── 미완료 세션 fetching (이어하기) ──────────────────────────────────────────

async function getIncompleteSessions(supabase, userId) {
  let query = supabase
    .from("sessions")
    .select("id, title, category_id, score, created_at, roadmap_id, categories(name)")
    .eq("is_complete", false)
    .eq("mode", "chat")
    .or("summary.is.null,summary.eq.")
    .not("roadmap_id", "is", null)  // roadmap_id 없는 구 세션 제외
    .order("created_at", { ascending: false })
    .limit(3);

  if (userId) query = query.eq("user_id", userId);

  const { data } = await query;
  return data ?? [];
}

// ─── 난이도 배지 색상 ─────────────────────────────────────────────────────────

const DIFFICULTY_STYLE = {
  입문: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  초급: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  중급: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  고급: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

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

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // 온보딩 미완료 유저 리다이렉트
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_done")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.onboarding_done !== true) {
      redirect("/onboarding");
    }
  }

  const [
    { totalDays, streak, weekSessions, level, levelProgress, recentSessions },
    roadmaps,
    incompleteSessions,
  ] = await Promise.all([
    getDashboardData(supabase, userId),
    getRoadmaps(supabase, userId),
    getIncompleteSessions(supabase, userId),
  ]);

  const stats = statCards({ totalDays, streak, weekSessions, level });


  return (
    <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-8 max-w-5xl mx-auto space-y-10">

      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">안녕하세요! 👋</h1>
        <p className="text-muted-foreground mt-1">오늘도 꾸준히 성장해볼까요?</p>
      </div>

      {/* 이어하기 카드 (미완료 세션 있을 때만) */}
      <IncompleteSessions initialSessions={incompleteSessions} />

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

      {/* 학습 시작하기 — 로드맵 카드 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            학습 시작하기
          </h2>
          <Link
            href="/study/new"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={13} /> 학습 추가하기
          </Link>
        </div>

        {roadmaps.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              아직 학습 로드맵이 없어요.{" "}
              <Link href="/study/new" className="underline underline-offset-2 hover:text-foreground">
                학습을 추가해보세요!
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmaps.map((rm) => (
              <Link key={rm.id} href={`/study/chat?roadmap_id=${rm.id}`}>
                <Card className="h-full cursor-pointer hover:ring-primary/40 hover:ring-2 transition-all">
                  <CardHeader className="pb-3">
                    {rm.categories?.icon && (
                      <span className="text-2xl mb-1">{rm.categories.icon}</span>
                    )}
                    <CardTitle className="text-base leading-snug">{rm.topic}</CardTitle>
                    {rm.categories?.name && (
                      <CardDescription>{rm.categories.name}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 flex items-center gap-2 flex-wrap">
                    {rm.difficulty && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_STYLE[rm.difficulty] ?? "bg-muted text-muted-foreground"}`}>
                        {rm.difficulty}
                      </span>
                    )}
                    {rm.duration && (
                      <span className="text-xs text-muted-foreground">{rm.duration}</span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
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
