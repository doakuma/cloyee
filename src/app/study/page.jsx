import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon, is_default")
    .order("is_default", { ascending: false });

  if (error) {
    console.error("[study] categories 조회 실패:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function StudyPage() {
  const categories = await getCategories();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">학습 주제 선택</h1>
      <p className="text-muted-foreground mb-8">어떤 주제로 학습할까요?</p>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 카테고리가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/study/chat?category=${cat.id}&title=${encodeURIComponent(cat.name)}`}
            >
              <Card className="cursor-pointer hover:ring-primary/40 transition-shadow h-full">
                <CardHeader>
                  {cat.icon && (
                    <span className="text-2xl mb-1">{cat.icon}</span>
                  )}
                  <CardTitle>{cat.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {categories.map((cat) => (
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
    </div>
  );
}
