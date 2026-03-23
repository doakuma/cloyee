import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageSquare } from "lucide-react";

const CATEGORY_STYLE = {
  bug:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  suggestion: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  other:      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

const CATEGORY_LABEL = {
  bug:        "🐛 버그",
  suggestion: "💡 개선",
  other:      "💬 기타",
};

async function getFeedback() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data, error } = await supabase
    .from("feedback")
    .select("id, category, content, user_id, created_at")
    .order("created_at", { ascending: false });

  if (error) console.error("[admin/feedback] 조회 실패:", error.message);
  return data ?? [];
}

export default async function AdminFeedbackPage() {
  const feedbacks = await getFeedback();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">피드백</h1>
        <p className="text-sm text-muted-foreground mt-1">총 {feedbacks.length}건</p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="rounded-lg border border-border bg-white dark:bg-neutral-900 flex flex-col items-center justify-center py-20 gap-3 text-center">
          <MessageSquare size={36} className="text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">아직 피드백이 없어요.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-white dark:bg-neutral-900 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">카테고리</TableHead>
                <TableHead>내용</TableHead>
                <TableHead className="w-28">사용자 ID</TableHead>
                <TableHead className="w-28">날짜</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacks.map((fb) => (
                <TableRow key={fb.id}>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_STYLE[fb.category] ?? CATEGORY_STYLE.other}`}>
                      {CATEGORY_LABEL[fb.category] ?? fb.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm max-w-sm">
                    <p className="whitespace-pre-wrap break-words">{fb.content}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {fb.user_id ? fb.user_id.slice(0, 8) : "게스트"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(fb.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
