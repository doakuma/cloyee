"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Code2, CalendarDays, BookOpen } from "lucide-react";

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

function scoreColor(score) {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
}

function scoreBg(score) {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 80) return "bg-green-50 text-green-700 border-green-200";
  if (score >= 60) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-red-50 text-red-700 border-red-200";
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

// ─── 세션 카드 ────────────────────────────────────────────────────────────────

function SessionCard({ session }) {
  const isReview = session.mode === "review";
  const categoryName = session.categories?.name ?? session.category_id ?? "—";

  return (
    <Link href={`/history/${session.id}`}>
      <Card
        size="sm"
        className="cursor-pointer hover:ring-primary/30 hover:ring-2 transition-all"
      >
        <CardContent className="flex items-center gap-4">
          {/* 모드 아이콘 */}
          <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isReview ? "bg-violet-100" : "bg-sky-100"}`}>
            {isReview
              ? <Code2 size={16} className="text-violet-600" />
              : <MessageSquare size={16} className="text-sky-600" />
            }
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{session.title ?? "학습 세션"}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{categoryName}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {new Date(session.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* 오른쪽: 모드 배지 + 점수 */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <Badge variant="outline" className="text-xs">
              {isReview ? "리뷰" : "대화"}
            </Badge>
            {session.score != null && (
              <span className={`text-xs font-semibold border rounded-md px-1.5 py-0.5 ${scoreBg(session.score)}`}>
                {session.score}점
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
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

  useEffect(() => {
    async function fetchSessions() {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, title, category_id, mode, score, created_at, categories(name)")
        .order("created_at", { ascending: false });

      if (!error && data) setSessions(data);
      setLoading(false);
    }
    fetchSessions();
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

  // 필터링
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
            총 {sessions.length}개의 기록
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
        <div className="space-y-3">
          {filtered.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
