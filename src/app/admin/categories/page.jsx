import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminCategoryActions from "@/components/admin/AdminCategoryActions";

async function getCategories(supabase) {
  const { data } = await supabase
    .from("categories")
    .select("id, name, icon, is_default, user_id, created_at")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  return data ?? [];
}

export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseServerClient();
  const categories = await getCategories(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">카테고리 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">총 {categories.length}개</p>
        </div>
        <AdminCategoryActions />
      </div>

      <div className="rounded-lg border border-border bg-white dark:bg-neutral-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>아이콘</TableHead>
              <TableHead>이름</TableHead>
              <TableHead className="text-center">기본 여부</TableHead>
              <TableHead>생성자 ID</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-center">삭제</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  카테고리가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="text-lg">{cat.icon ?? "—"}</TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-center">
                    {cat.is_default
                      ? <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">기본</Badge>
                      : <span className="text-xs text-muted-foreground">커스텀</span>
                    }
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {cat.user_id ? cat.user_id.slice(0, 8) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(cat.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell className="text-center">
                    <AdminCategoryActions categoryId={cat.id} categoryName={cat.name} deleteMode />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
