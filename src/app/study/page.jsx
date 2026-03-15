import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus } from "lucide-react";

// ─── 난이도 배지 색상 ─────────────────────────────────────────────────────────

const DIFFICULTY_STYLE = {
  입문: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  초급: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  중급: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  고급: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// ─── 데이터 fetching ──────────────────────────────────────────────────────────

async function getRoadmaps() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("roadmaps")
    .select("id, topic, difficulty, duration, category_id, categories(name, icon)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[study] roadmaps 조회 실패:", error.message);
  }

  return data ?? [];
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default async function StudyPage() {
  const roadmaps = await getRoadmaps();

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">내 학습 로드맵</h1>
          <p className="text-muted-foreground text-sm mt-1">학습할 주제를 선택하세요</p>
        </div>
        <Link
          href="/study/new"
          className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> 새 로드맵 추가
        </Link>
      </div>

      {/* 로드맵 목록 */}
      {roadmaps.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-sm">아직 학습 로드맵이 없어요.</p>
            <Link
              href="/study/new"
              className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={15} /> 첫 로드맵 만들기
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

    </div>
  );
}
