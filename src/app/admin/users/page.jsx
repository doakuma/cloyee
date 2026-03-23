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

async function getUsers(supabase) {
  // profiles 조회 (auth.users는 service role 없이 접근 불가 → id 앞 8자리 표시)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, job_role, is_admin, created_at")
    .order("created_at", { ascending: false });

  if (!profiles?.length) return [];

  // 완료 세션 수 집계
  const { data: sessions } = await supabase
    .from("sessions")
    .select("user_id")
    .eq("is_complete", true)
    .in("user_id", profiles.map((p) => p.id));

  const sessionCountMap = {};
  sessions?.forEach(({ user_id }) => {
    sessionCountMap[user_id] = (sessionCountMap[user_id] ?? 0) + 1;
  });

  return profiles.map((p) => ({
    ...p,
    session_count: sessionCountMap[p.id] ?? 0,
  }));
}

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const users = await getUsers(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">사용자 목록</h1>
        <p className="text-sm text-muted-foreground mt-1">총 {users.length}명</p>
      </div>

      <div className="rounded-lg border border-border bg-white dark:bg-neutral-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>직군</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead className="text-center">완료 세션</TableHead>
              <TableHead className="text-center">어드민</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  사용자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {u.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{u.job_role ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell className="text-center">{u.session_count}</TableCell>
                  <TableCell className="text-center">
                    {u.is_admin
                      ? <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">어드민</Badge>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
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
