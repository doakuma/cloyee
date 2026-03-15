import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import RoadmapCard from "@/components/study/RoadmapCard";
import ArchivedSection from "@/components/study/ArchivedSection";

// ─── 데이터 fetching ──────────────────────────────────────────────────────────

async function getRoadmapsByStatus(status) {
  let roadmaps = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("roadmaps")
      .select("id, topic, difficulty, duration, category_id, categories(name, icon)")
      .eq("user_id", user.id)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw error;
    roadmaps = data ?? [];
  } catch (e) {
    console.error(`[study] roadmaps(${status}) 조회 실패:`, e.message);
  }
  return roadmaps;
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default async function StudyPage() {
  const [active, archived] = await Promise.all([
    getRoadmapsByStatus("active"),
    getRoadmapsByStatus("paused"),
  ]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
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

      {/* 메인 — active */}
      {active.length === 0 ? (
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
          {active.map((rm) => (
            <RoadmapCard key={rm.id} roadmap={rm} variant="active" />
          ))}
        </div>
      )}

      {/* 보관함 — paused (1개 이상일 때만) */}
      {archived.length > 0 && (
        <ArchivedSection roadmaps={archived} />
      )}

    </div>
  );
}
