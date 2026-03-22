import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import RoadmapCard from "@/components/study/RoadmapCard";
import ArchivedSection from "@/components/study/ArchivedSection";
import AddRoadmapButton from "@/components/study/AddRoadmapButton";

// ─── 데이터 fetching ──────────────────────────────────────────────────────────

async function getStudyData() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { active: [], archived: [] };

    const [{ data: activeData }, { data: archivedData }, { data: sessionData }] = await Promise.all([
      supabase
        .from("roadmaps")
        .select("id, topic, difficulty, duration, category_id, categories(name, icon)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("roadmaps")
        .select("id, topic, difficulty, duration, category_id, categories(name, icon)")
        .eq("user_id", user.id)
        .eq("status", "paused")
        .order("created_at", { ascending: false }),
      supabase
        .from("sessions")
        .select("roadmap_id, is_complete")
        .eq("user_id", user.id)
        .not("roadmap_id", "is", null)
        .order("created_at", { ascending: false }),
    ]);

    // roadmap별 최신 세션의 is_complete 맵 생성
    const completedRoadmapIds = new Set();
    const seen = new Set();
    for (const s of sessionData ?? []) {
      if (!seen.has(s.roadmap_id)) {
        seen.add(s.roadmap_id);
        if (s.is_complete) completedRoadmapIds.add(s.roadmap_id);
      }
    }

    // 완료된 로드맵은 active에서 제외
    const active = (activeData ?? []).filter((rm) => !completedRoadmapIds.has(rm.id));
    const archived = archivedData ?? [];

    return { active, archived };
  } catch (e) {
    console.error("[study] 데이터 조회 실패:", e.message);
    return { active: [], archived: [] };
  }
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default async function StudyPage() {
  const { active, archived } = await getStudyData();

  return (
    <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-8 max-w-5xl mx-auto space-y-10">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 학습 로드맵</h1>
          <p className="text-muted-foreground text-sm mt-1">학습할 주제를 선택하세요</p>
        </div>
        <AddRoadmapButton label="새 로드맵 추가" variant="primary" />
      </div>

      {/* 메인 — active (완료된 로드맵 제외) */}
      {active.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-sm">진행 중인 로드맵이 없어요.</p>
            <AddRoadmapButton label="새 로드맵 만들기" />
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
