"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreVertical } from "lucide-react";

const DIFFICULTY_STYLE = {
  입문: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  초급: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  중급: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  고급: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function RoadmapCard({ roadmap, variant = "active" }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function updateStatus(status) {
    setUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("roadmaps")
      .update({ status })
      .eq("id", roadmap.id)
      .eq("user_id", user.id);
    setUpdating(false);
    router.refresh();
  }

  async function handleDelete() {
    await updateStatus("deleted");
    setDeleteOpen(false);
  }

  return (
    <>
      <div className="relative group">
        <Link href={`/study/chat?roadmap_id=${roadmap.id}`}>
          <Card className="h-full cursor-pointer hover:ring-primary/40 hover:ring-2 transition-all">
            <CardHeader className="pb-3 pr-10">
              {roadmap.categories?.icon && (
                <span className="text-2xl mb-1">{roadmap.categories.icon}</span>
              )}
              <CardTitle className="text-base leading-snug">{roadmap.topic}</CardTitle>
              {roadmap.categories?.name && (
                <CardDescription>{roadmap.categories.name}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0 flex items-center gap-2 flex-wrap">
              {roadmap.difficulty && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_STYLE[roadmap.difficulty] ?? "bg-muted text-muted-foreground"}`}>
                  {roadmap.difficulty}
                </span>
              )}
              {roadmap.duration && (
                <span className="text-xs text-muted-foreground">{roadmap.duration}</span>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* ··· 메뉴 버튼 */}
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.preventDefault()}
                disabled={updating}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="메뉴"
              >
                <MoreVertical size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {variant === "active" ? (
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); updateStatus("paused"); }}
                >
                  📦 보관하기
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); updateStatus("active"); }}
                >
                  🔄 다시 학습하기
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => { e.preventDefault(); setDeleteOpen(true); }}
                className="text-destructive focus:text-destructive"
              >
                🗑️ 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로드맵을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              연결된 학습 기록은 그대로 유지돼요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
