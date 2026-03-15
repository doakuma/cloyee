import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, MessageSquare, Code2, CalendarDays, Trophy } from "lucide-react";
import MarkdownMessage from "@/components/common/MarkdownMessage";
import DownloadButton from "./DownloadButton";

// ─── 데이터 fetching ──────────────────────────────────────────────────────────

async function getSessionDetail(id) {
  const supabase = await createSupabaseServerClient();
  const [{ data: session, error }, { data: review }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, title, category_id, mode, score, created_at, summary, categories(name)")
      .eq("id", id)
      .single(),
    supabase
      .from("reviews")
      .select("code, messages")
      .eq("session_id", id)
      .maybeSingle(),
  ]);

  if (error || !session) return null;
  return { session, review };
}

// ─── 점수 색상 ────────────────────────────────────────────────────────────────

function scoreBadgeClass(score) {
  if (score == null) return "bg-muted text-muted-foreground border-border";
  if (score >= 80) return "bg-green-50 text-green-700 border-green-200";
  if (score >= 60) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-red-50 text-red-700 border-red-200";
}

function scoreTextColor(score) {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
}

function progressBarColor(score) {
  if (score == null) return "";
  if (score >= 80) return "[&>div]:bg-green-500";
  if (score >= 60) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}

// ─── 요약 파싱 ────────────────────────────────────────────────────────────────

function parseSummary(summary) {
  if (!summary) return { main: "", goodPoints: "", improvePoints: "" };

  const goodMatch = summary.match(/##\s*(잘\s*된\s*점|Good)[^\n]*\n([\s\S]*?)(?=##|$)/i);
  const improveMatch = summary.match(/##\s*(개선|Improve)[^\n]*\n([\s\S]*?)(?=##|$)/i);

  if (!goodMatch && !improveMatch) {
    return { main: summary.trim(), goodPoints: "", improvePoints: "" };
  }

  const main = summary
    .replace(/##\s*(잘\s*된\s*점|Good)[^\n]*\n[\s\S]*?(?=##|$)/i, "")
    .replace(/##\s*(개선|Improve)[^\n]*\n[\s\S]*?(?=##|$)/i, "")
    .trim();

  return {
    main,
    goodPoints: goodMatch?.[2]?.trim() ?? "",
    improvePoints: improveMatch?.[2]?.trim() ?? "",
  };
}

// ─── 메시지 버블 ───────────────────────────────────────────────────────────────

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap"
            : "bg-card border border-border rounded-tl-sm"
        }`}
      >
        {isUser ? content : <MarkdownMessage content={content} />}
      </div>
    </div>
  );
}

// ─── 대화 모드 뷰 ─────────────────────────────────────────────────────────────

function ChatView({ messages }) {
  if (!messages?.length) {
    return <p className="text-sm text-muted-foreground">대화 내역이 없습니다.</p>;
  }
  return (
    <div className="space-y-4">
      {messages.map((msg, i) => (
        <MessageBubble key={i} role={msg.role} content={msg.content} />
      ))}
    </div>
  );
}

// ─── 리뷰 모드 뷰 ─────────────────────────────────────────────────────────────

function ReviewView({ code, messages }) {
  return (
    <div className="flex gap-6 h-full">
      {/* 왼쪽: 원본 코드 */}
      <div className="w-2/5 flex flex-col gap-2 min-w-0">
        <p className="text-xs font-medium text-muted-foreground px-1">원본 코드</p>
        <pre className="flex-1 overflow-auto rounded-xl border border-border bg-muted/50 px-4 py-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all min-h-[200px]">
          {code ?? "코드 없음"}
        </pre>
      </div>

      {/* 오른쪽: 대화 내역 */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <p className="text-xs font-medium text-muted-foreground px-1">리뷰 대화</p>
        <div className="space-y-4">
          {messages?.length ? (
            messages.map((msg, i) => (
              <MessageBubble key={i} role={msg.role} content={msg.content} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">대화 내역이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default async function HistoryDetailPage({ params }) {
  const { id } = await params;
  const result = await getSessionDetail(id);

  if (!result) notFound();

  const { session, review } = result;
  const isReview = session.mode === "review";
  const categoryName = session.categories?.name ?? session.category_id ?? "—";
  const messages = review?.messages ?? [];
  const { main: summaryMain, goodPoints, improvePoints } = parseSummary(session.summary);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto pb-20">

      {/* 뒤로가기 */}
      <Link
        href="/history"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        학습 기록으로
      </Link>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isReview ? "bg-violet-100" : "bg-sky-100"}`}>
              {isReview
                ? <Code2 size={15} className="text-violet-600" />
                : <MessageSquare size={15} className="text-sky-600" />
              }
            </div>
            <Badge variant="outline">{isReview ? "코드 리뷰" : "학습 대화"}</Badge>
            <Badge variant="secondary">{categoryName}</Badge>
          </div>
          <h1 className="text-xl font-bold leading-snug">{session.title ?? "학습 세션"}</h1>
        </div>
        <DownloadButton session={session} review={review} />
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
        <span className="flex items-center gap-1">
          <CalendarDays size={13} />
          {new Date(session.created_at).toLocaleDateString("ko-KR", {
            year: "numeric", month: "long", day: "numeric",
          })}
        </span>
      </div>

      {/* 이해도 점수 — Progress 바 */}
      {session.score != null && (
        <Card className="mb-6">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Trophy size={15} className="text-yellow-500" />
                {isReview ? "코드 품질 점수" : "이해도 점수"}
              </span>
              <span className={`text-2xl font-bold ${scoreTextColor(session.score)}`}>
                {session.score}점
              </span>
            </div>
            <Progress value={session.score} className={`h-2.5 ${progressBarColor(session.score)}`} />
            <p className="text-xs text-muted-foreground mt-2">
              {session.score >= 80
                ? "훌륭해요! 목표를 충분히 달성했습니다."
                : session.score >= 60
                ? "좋은 시작이에요. 조금 더 연습해보세요."
                : "다시 도전해봐요. 꾸준히 하면 늘어납니다!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 요약 */}
      {session.summary && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
              학습 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {summaryMain || session.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 잘 된 점 / 개선할 점 (코드 리뷰이고 파싱된 경우) */}
      {isReview && (goodPoints || improvePoints) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {goodPoints && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-700">잘 된 점</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-800/80 whitespace-pre-wrap leading-relaxed">{goodPoints}</p>
              </CardContent>
            </Card>
          )}
          {improvePoints && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700">개선할 점</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-800/80 whitespace-pre-wrap leading-relaxed">{improvePoints}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 대화 내역 */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {isReview ? "리뷰 내역" : "대화 내역"}
        </p>
        {isReview ? (
          <ReviewView code={review?.code} messages={messages} />
        ) : (
          <ChatView messages={messages} />
        )}
      </div>
    </div>
  );
}
