import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import OtherCategoriesAccordion from "@/components/study/OtherCategoriesAccordion";

async function getStudyData() {
  const supabase = await createSupabaseServerClient();

  const [{ data: categories, error }, { data: { user } }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, icon, is_default")
      .order("is_default", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  if (error) {
    console.error("[study] categories 조회 실패:", error.message);
  }

  const allCategories = categories ?? [];

  if (!user) {
    return { selected: allCategories, others: [] };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("category_order")
    .eq("id", user.id)
    .maybeSingle();

  const order = profile?.category_order;
  if (!Array.isArray(order) || order.length === 0) {
    return { selected: allCategories, others: [] };
  }

  // order 배열 순서대로 selected 정렬
  const orderMap = new Map(order.map((id, i) => [id, i]));
  const selected = order
    .map((id) => allCategories.find((c) => c.id === id))
    .filter(Boolean);
  const others = allCategories.filter((c) => !orderMap.has(c.id));

  return { selected, others };
}

export default async function StudyPage() {
  const { selected, others } = await getStudyData();
  const hasSelected = selected.length > 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">학습 주제 선택</h1>
      <p className="text-muted-foreground mb-8">어떤 주제로 학습할까요?</p>

      {/* 선택된(또는 전체) 카테고리 */}
      {selected.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 카테고리가 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {selected.map((cat) => (
              <Link
                key={cat.id}
                href={`/study/chat?category=${cat.id}&title=${encodeURIComponent(cat.name)}`}
              >
                <Card className="cursor-pointer hover:ring-primary/40 transition-shadow h-full">
                  <CardHeader>
                    {cat.icon && <span className="text-2xl mb-1">{cat.icon}</span>}
                    <CardTitle>{cat.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {selected.map((cat) => (
              <Link
                key={cat.id}
                href={`/study/review?category=${cat.id}`}
                className="inline-flex items-center gap-1.5 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name} 코드 리뷰
              </Link>
            ))}
          </div>
        </>
      )}

      {/* 선택하지 않은 카테고리 — accordion */}
      <OtherCategoriesAccordion categories={others} />
    </div>
  );
}
