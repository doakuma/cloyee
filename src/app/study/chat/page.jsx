"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react";

// ─── 메시지 버블 ───────────────────────────────────────────────────────────────

function CloyeeMessage({ content, feedback, score }) {
  return (
    <div className="flex flex-col gap-1 max-w-[75%]">
      <span className="text-xs text-muted-foreground font-medium px-1">Cloyee</span>
      <Card>
        <CardContent className="py-3 px-4 text-sm whitespace-pre-wrap leading-relaxed">
          {content}
        </CardContent>
      </Card>
      {feedback && (
        <div className="flex items-center justify-between px-1 mt-0.5">
          <span className="text-xs text-muted-foreground">{feedback}</span>
          {score != null && (
            <span className="text-xs font-semibold text-primary">{score}점</span>
          )}
        </div>
      )}
    </div>
  );
}

function UserMessage({ content }) {
  return (
    <div className="flex flex-col items-end gap-1 max-w-[75%] ml-auto">
      <span className="text-xs text-muted-foreground font-medium px-1">나</span>
      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex flex-col gap-1 max-w-[75%]">
      <span className="text-xs text-muted-foreground font-medium px-1">Cloyee</span>
      <Card>
        <CardContent className="py-3 px-4">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 완료 배너 ────────────────────────────────────────────────────────────────

function CompleteBanner({ score }) {
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4 text-sm">
      <CheckCircle2 size={18} className="shrink-0 text-green-600" />
      <div>
        <p className="font-semibold">학습 완료!</p>
        <p className="text-xs text-green-700 mt-0.5">최종 점수 {score}점 · 기록을 저장하고 있습니다…</p>
      </div>
    </div>
  );
}

// ─── 채팅 본체 ────────────────────────────────────────────────────────────────

function ChatView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category = searchParams.get("category") ?? "일반";
  const title = searchParams.get("title") ?? "자유 학습";

  // { role: "user"|"assistant", content, score?, feedback? }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // 새 메시지마다 스크롤 하단으로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 로딩 완료 후 입력창 포커스 (re-render 이후 textarea가 enabled된 시점에 실행)
  useEffect(() => {
    if (!loading && !isComplete) {
      inputRef.current?.focus();
    }
  }, [loading, isComplete]);

  // 페이지 진입 시 Cloyee 첫 메시지 요청
  useEffect(() => {
    callApi([], "학습을 시작해주세요.");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // API 호출 공통 함수
  async function callApi(history, userMessage) {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, messages: history, message: userMessage }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("[chat] API 오류:", res.status, errData);
        throw new Error(errData.error ?? "API 오류");
      }

      const data = await res.json();

      const assistantMsg = {
        role: "assistant",
        content: data.message,
        score: data.score,
        feedback: data.feedback,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.is_complete) {
        setIsComplete(true);
        setFinalScore(data.score);
        await saveSession(
          data.summary,
          [...history, { role: "user", content: userMessage }, { role: "assistant", content: data.message }]
        );
        setTimeout(() => router.push("/history"), 2000);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading || isComplete) return;

    const userContent = input.trim();
    setInput("");

    // 현재 messages에서 API용 히스토리 추출 (role, content만)
    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: "user", content: userContent }]);
    await callApi(history, userContent);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  async function saveSession(summary, allMessages) {
    await supabase.from("sessions").insert({
      category,
      title,
      summary,
    });
  }

  const lastScore = messages.findLast((m) => m.role === "assistant")?.score;

  return (
    <div className="flex flex-col h-screen">

      {/* 상단 헤더 */}
      <header className="flex items-center gap-3 px-6 h-16 border-b border-border bg-background shrink-0">
        <Link
          href="/study"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="secondary" className="shrink-0">{category}</Badge>
          <h1 className="text-sm font-semibold truncate">{title}</h1>
        </div>

        {lastScore != null && (
          <div className="shrink-0 flex items-center gap-1.5">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${lastScore}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-primary w-8 text-right">{lastScore}점</span>
          </div>
        )}
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-muted/30">
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserMessage key={i} content={msg.content} />
          ) : (
            <CloyeeMessage
              key={i}
              content={msg.content}
              feedback={msg.feedback}
              score={msg.score}
            />
          )
        )}

        {loading && <ThinkingBubble />}
        {isComplete && <CompleteBanner score={finalScore} />}
        <div ref={bottomRef} />
      </div>

      {/* 하단 입력창 */}
      <form
        onSubmit={sendMessage}
        className="flex items-end gap-2 px-6 py-4 border-t border-border bg-background shrink-0"
      >
        <textarea
          ref={inputRef}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 max-h-36 overflow-y-auto leading-relaxed"
          placeholder={isComplete ? "학습이 완료됐습니다." : "메시지를 입력하세요… (Enter로 전송)"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || isComplete}
        />
        <button
          type="submit"
          disabled={loading || isComplete || !input.trim()}
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// ─── 페이지 (Suspense 래핑 — useSearchParams 필수) ────────────────────────────

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground text-sm">로딩 중…</div>}>
      <ChatView />
    </Suspense>
  );
}
