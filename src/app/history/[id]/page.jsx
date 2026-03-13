import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Code2, CalendarDays, Trophy } from "lucide-react";

// ─── 데이터 fetching ──────────────────────────────────────────────────────────

async function getSessionDetail(id) {
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

// ─── 메시지 버블 ───────────────────────────────────────────────────────────────

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card border border-border rounded-tl-sm"
        }`}
      >
        {content}
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

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* 뒤로가기 */}
      <Link
        href="/history"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        학습 기록으로
      </Link>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4 mb-8">
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

        {/* 점수 */}
        {session.score != null && (
          <div className={`shrink-0 flex items-center gap-1.5 border rounded-xl px-3 py-2 ${scoreBadgeClass(session.score)}`}>
            <Trophy size={14} />
            <span className="text-lg font-bold">{session.score}</span>
            <span className="text-xs">점</span>
          </div>
        )}
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8">
        <span className="flex items-center gap-1">
          <CalendarDays size={13} />
          {new Date(session.created_at).toLocaleDateString("ko-KR", {
            year: "numeric", month: "long", day: "numeric",
          })}
        </span>
      </div>

      {/* 요약 */}
      {session.summary && (
        <Card className="mb-8">
          <CardContent className="py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">학습 요약</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{session.summary}</p>
          </CardContent>
        </Card>
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
