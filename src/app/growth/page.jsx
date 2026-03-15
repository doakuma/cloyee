"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Trophy, Flame, TrendingUp, BarChart2 } from "lucide-react";

// ─── 집계 함수 ────────────────────────────────────────────────────────────────

function dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function computeStats(sessions) {
  const total = sessions.length;
  const level = Math.floor(total / 5) + 1;
  const levelProgress = total % 5;

  const uniqueDates = new Set(sessions.map((s) => dateKey(s.created_at)));

  // 연속 streak: 오늘부터 역순
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const cursor = new Date(today);
  while (uniqueDates.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // 이번 주 달력 (월~일)
  const dayOfWeek = today.getDay(); // 0=일
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"].map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label,
      studied: uniqueDates.has(dateKey(d)),
      isToday: dateKey(d) === dateKey(today),
      isFuture: d > today,
    };
  });

  // 카테고리별
  const byCat = {};
  sessions.forEach((s) => {
    const key = s.category_id ?? "unknown";
    const name = s.categories?.name ?? key;
    if (!byCat[key]) byCat[key] = { name, count: 0 };
    byCat[key].count++;
  });
  const categoryStats = Object.values(byCat).sort((a, b) => b.count - a.count);

  // 월별 (최근 6개월)
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const count = sessions.filter((s) => {
      const sd = new Date(s.created_at);
      return sd.getFullYear() === y && sd.getMonth() === m;
    }).length;
    return { label: `${m + 1}월`, count };
  });

  return { total, level, levelProgress, streak, weekDays, categoryStats, monthly };
}

// ─── 레벨 카드 ────────────────────────────────────────────────────────────────

function LevelCard({ level, levelProgress, total }) {
  const remaining = 5 - levelProgress;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          <Trophy size={14} className="text-yellow-500" />
          현재 레벨
        </CardDescription>
        <CardTitle className="text-4xl font-bold tracking-tight">
          Lv.<span className="text-primary">{level}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${(levelProgress / 5) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>총 {total}회 학습</span>
          <span>다음 레벨까지 {remaining}회</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── streak 달력 카드 ─────────────────────────────────────────────────────────

function StreakCard({ streak, weekDays }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          <Flame size={14} className="text-orange-500" />
          이번 주 학습
        </CardDescription>
        <CardTitle className="text-4xl font-bold tracking-tight">
          <span className="text-primary">{streak}</span>
          <span className="text-2xl font-semibold text-muted-foreground ml-1">일 연속</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1.5 mt-1">
          {weekDays.map(({ label, studied, isToday, isFuture }) => (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center transition-colors ${
                  isFuture
                    ? "bg-muted/40"
                    : studied
                    ? "bg-primary"
                    : "bg-muted"
                } ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
              >
                {studied && !isFuture && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                )}
              </div>
              <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 카테고리별 바 차트 ───────────────────────────────────────────────────────

function CategoryChart({ categoryStats, total }) {
  if (!categoryStats.length) {
    return <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>;
  }
  const max = categoryStats[0].count;

  return (
    <div className="space-y-3">
      {categoryStats.map(({ name, count }) => (
        <div key={name} className="flex items-center gap-3">
          <span className="w-24 text-sm text-right text-muted-foreground shrink-0 truncate">{name}</span>
          <div className="flex-1 h-7 bg-muted rounded-lg overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 bg-primary/80 rounded-lg transition-all duration-700"
              style={{ width: `${(count / max) * 100}%` }}
            />
            <span className="absolute inset-y-0 left-3 flex items-center text-xs font-medium text-primary-foreground z-10">
              {count}회
            </span>
          </div>
          <span className="w-12 text-xs text-muted-foreground text-right shrink-0">
            {Math.round((count / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 월별 바 차트 ─────────────────────────────────────────────────────────────

function MonthlyChart({ monthly }) {
  const max = Math.max(...monthly.map((m) => m.count), 1);
  const lastIndex = monthly.length - 1;

  return (
    <div className="flex items-end gap-2 h-36">
      {monthly.map(({ label, count }, i) => {
        const isCurrentMonth = i === lastIndex;
        const heightPct = max === 0 ? 0 : (count / max) * 100;
        return (
          <div key={label} className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {count > 0 ? count : ""}
            </span>
            <div className="w-full flex-1 flex items-end">
              <div
                className={`w-full rounded-t-lg transition-all duration-700 ${
                  isCurrentMonth ? "bg-primary" : "bg-primary/30"
                }`}
                style={{ height: `${Math.max(heightPct, count > 0 ? 8 : 0)}%` }}
              />
            </div>
            <span className={`text-[11px] font-medium ${isCurrentMonth ? "text-primary" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 로딩 스켈레톤 ────────────────────────────────────────────────────────────

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-2xl bg-muted ${className}`} />;
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default function GrowthPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      const { data } = await supabase
        .from("sessions")
        .select("id, category_id, created_at, categories(name)");
      setSessions(data ?? []);
      setLoading(false);
    }
    fetchSessions();
  }, []);

  const stats = useMemo(() => computeStats(sessions), [sessions]);
  const { total, level, levelProgress, streak, weekDays, categoryStats, monthly } = stats;

  return (
    <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-8 max-w-3xl mx-auto space-y-8">

      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">성장 현황</h1>
        <p className="text-muted-foreground text-sm mt-1">꾸준한 학습이 실력을 만듭니다.</p>
      </div>

      {/* 레벨 + Streak */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LevelCard level={level} levelProgress={levelProgress} total={total} />
          <StreakCard streak={streak} weekDays={weekDays} />
        </div>
      )}

      {/* 카테고리별 바 차트 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">카테고리별 학습</h2>
        </div>
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <CategoryChart categoryStats={categoryStats} total={total} />
            </CardContent>
          </Card>
        )}
      </section>

      {/* 월별 추이 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">월별 학습 추이</h2>
          <span className="text-xs text-muted-foreground ml-auto">최근 6개월</span>
        </div>
        {loading ? (
          <Skeleton className="h-52" />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <MonthlyChart monthly={monthly} />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
