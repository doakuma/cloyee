"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
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
import { CalendarDays, BookOpen } from "lucide-react";
import { SessionCard } from "@/components/common/SessionCard";

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function getDateRange(filter) {
  const now = new Date();
  if (filter === "week") {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (filter === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

// ─── 필터 버튼 ────────────────────────────────────────────────────────────────

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ─── 빈 상태 ──────────────────────────────────────────────────────────────────

function EmptyState({ filtered }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BookOpen size={36} className="text-muted-foreground/40 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">
        {filtered ? "해당 조건의 기록이 없습니다." : "아직 학습 기록이 없습니다."}
      </p>
      {!filtered && (
        <Link
          href="/study"
          className="mt-3 text-xs text-primary underline underline-offset-2"
        >
          첫 학습 시작하기
        </Link>
      )}
    </div>
  );
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");      // "week" | "month" | "all"
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTargetId) return;
    setDeleting(true);
    await supabase.from("reviews").delete().eq("session_id", deleteTargetId);
    await supabase.from("sessions").delete().eq("id", deleteTargetId);
    setSessions((prev) => prev.filter((s) => s.id !== deleteTargetId));
    setDeleting(false);
    setDeleteTargetId(null);
  }

  function handleRename(id, newTitle) {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, title: newTitle } : s));
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchSessions() {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;

      if (!userId) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("sessions")
        .select("id, title, category_id, roadmap_id, mode, score, is_complete, created_at, categories(name), roadmaps(topic)")
        .eq("is_complete", true)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (!error && data) setSessions(data);
      setLoading(false);
    }

    fetchSessions();

    return () => {
      cancelled = true;
    };
  }, []);

  // 카테고리 목록 (세션 데이터에서 추출)
  const categories = useMemo(() => {
    const seen = new Map();
    sessions.forEach((s) => {
      if (s.category_id && !seen.has(s.category_id)) {
        seen.set(s.category_id, s.categories?.name ?? s.category_id);
      }
    });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [sessions]);

  // 필터링 (완료 세션만 — is_complete=true 쿼리로 고정)
  const filtered = useMemo(() => {
    const since = getDateRange(dateFilter);
    return sessions.filter((s) => {
      if (since && new Date(s.created_at) < since) return false;
      if (categoryFilter !== "all" && s.category_id !== categoryFilter) return false;
      return true;
    });
  }, [sessions, dateFilter, categoryFilter]);

  const isFiltered = dateFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">학습 기록</h1>
          <p className="text-muted-foreground text-sm mt-1">
            총 {filtered.length}개의 기록
          </p>
        </div>

        {/* 날짜 필터 */}
        <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1">
          {[
            { value: "week", label: "이번 주" },
            { value: "month", label: "이번 달" },
            { value: "all", label: "전체" },
          ].map(({ value, label }) => (
            <FilterButton
              key={value}
              active={dateFilter === value}
              onClick={() => setDateFilter(value)}
            >
              {label}
            </FilterButton>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <CalendarDays size={14} className="text-muted-foreground shrink-0" />
          <button
            onClick={() => setCategoryFilter("all")}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              categoryFilter === "all"
                ? "border-primary text-primary bg-primary/5"
                : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            전체
          </button>
          {categories.map(({ id, name }) => (
            <button
              key={id}
              onClick={() => setCategoryFilter(id)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                categoryFilter === id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filtered={isFiltered} />
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              showMenu
              onDelete={setDeleteTargetId}
              onRename={handleRename}
            />
          ))}
        </div>
      )}

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>세션을 삭제할까요?</AlertDialogTitle>
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
    </div>
  );
}
