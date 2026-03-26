import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getUsers() {
  // API에서 데이터 조회 (service role 사용)
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/users`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to fetch users:", res.statusText);
    return [];
  }

  return res.json();
}

export default async function AdminUsersPage() {
  const users = await getUsers();

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
              <TableHead>이메일</TableHead>
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
                  <TableCell className="text-sm">{u.email}</TableCell>
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
