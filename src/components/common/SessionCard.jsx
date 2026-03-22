"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, Code2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

function scoreBg(score) {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 80) return "bg-green-50 text-green-700 border-green-200";
  if (score >= 60) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-red-50 text-red-700 border-red-200";
}

// props:
//   session    — 세션 데이터 객체 (필수)
//   showMenu   — 제목 편집 / 삭제 메뉴 표시 여부 (기본 false)
//   onDelete   — (sessionId) => void  (showMenu=true 일 때 사용)
//   onRename   — (sessionId, newTitle) => void  (showMenu=true 일 때 사용)

export function SessionCard({ session, showMenu = false, onDelete, onRename }) {
  const isReview = session.mode === "review";
  const categoryName = session.categories?.name ?? session.category_id ?? "—";
  const title = session.roadmaps?.topic ?? session.title ?? "학습 세션";

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title ?? "학습 세션");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  async function handleRenameSubmit(e) {
    e?.preventDefault();
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === session.title) { setEditing(false); return; }
    setSaving(true);
    const { error } = await supabase
      .from("sessions")
      .update({ title: trimmed })
      .eq("id", session.id);
    setSaving(false);
    if (!error) {
      onRename?.(session.id, trimmed);
      setEditing(false);
    }
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div className="flex items-center gap-3 px-3.5 py-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
      {/* 아이콘 */}
      <div className="w-[34px] h-[34px] rounded-[8px] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
        {isReview
          ? <Code2 className="w-4 h-4 text-neutral-400" />
          : <MessageSquare className="w-4 h-4 text-neutral-400" />
        }
      </div>

      {/* 내용 */}
      <Link
        href={`/history/${session.id}`}
        className="flex-1 min-w-0"
        onClick={(e) => editing && e.preventDefault()}
      >
        {editing ? (
          <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()}>
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
              disabled={saving}
              className="h-7 text-sm py-0"
            />
          </form>
        ) : (
          <>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate leading-tight">
              {title}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5 leading-tight">
              {categoryName} · {new Date(session.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
            </p>
          </>
        )}
      </Link>

      {/* 오른쪽: 배지 + 점수 + 메뉴 */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
            {isReview ? "리뷰" : "대화"}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400">
            완료
          </span>
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.preventDefault()}>
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil size={13} className="mr-2" /> 제목 편집
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(session.id)}
                >
                  <Trash2 size={13} className="mr-2" /> 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {session.score > 0 && (
          <span className={`text-xs font-semibold border rounded-md px-1.5 py-0.5 ${scoreBg(session.score)}`}>
            {session.score}점
          </span>
        )}
      </div>
    </div>
  );
}
