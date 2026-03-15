"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PlayCircle, ChevronRight, X } from "lucide-react";

export default function IncompleteSessions({ initialSessions }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  if (sessions.length === 0) return null;

  async function handleDelete() {
    if (!deleteTargetId) return;
    setDeleting(true);
    await supabase.from("reviews").delete().eq("session_id", deleteTargetId);
    await supabase.from("sessions").delete().eq("id", deleteTargetId);
    setSessions((prev) => prev.filter((s) => s.id !== deleteTargetId));
    setDeleting(false);
    setDeleteTargetId(null);
    router.refresh();
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        이어하기
      </h2>
      <div className="space-y-2">
        {sessions.map((session) => (
          <div key={session.id} className="relative group">
            <Link
              href={`/study/chat?roadmap_id=${session.roadmap_id}&session_id=${session.id}`}
            >
              <Card className="cursor-pointer hover:ring-primary/40 hover:ring-2 transition-all border-primary/20 bg-primary/5">
                <CardContent className="flex items-center gap-4">
                  <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
                    <PlayCircle size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.title ?? "학습 세션"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {session.categories?.name ?? "—"} · {new Date(session.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} 중단
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {session.score != null && (
                      <span className="text-xs font-semibold text-primary">{session.score}점</span>
                    )}
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* 삭제 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => {
                e.preventDefault();
                setDeleteTargetId(session.id);
              }}
            >
              <X size={13} />
            </Button>
          </div>
        ))}
      </div>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이어하기 세션을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 학습 기록은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
