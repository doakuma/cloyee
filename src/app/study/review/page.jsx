"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, CheckCircle2, Play } from "lucide-react";
import MarkdownMessage from "@/components/common/MarkdownMessage";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "plaintext", label: "기타" },
];

// ─── 메시지 버블 ───────────────────────────────────────────────────────────────

function CloyeeMessage({ content, feedback, score }) {
  return (
    <div className="flex flex-col gap-1 max-w-[90%]">
      <span className="text-xs text-muted-foreground font-medium px-1">Cloyee</span>
      <Card>
        <CardContent className="py-3 px-4 text-sm leading-relaxed">
          <MarkdownMessage content={content} />
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
    <div className="flex flex-col items-end gap-1 max-w-[90%] ml-auto">
      <span className="text-xs text-muted-foreground font-medium px-1">나</span>
      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex flex-col gap-1 max-w-[90%]">
      <span className="text-xs text-muted-foreground font-medium px-1">Cloyee</span>
      <Card>
        <CardContent className="py-3 px-4">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}

function CompleteBanner({ score }) {
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm mx-2">
      <CheckCircle2 size={16} className="shrink-0 text-green-600" />
      <div>
        <p className="font-semibold">리뷰 완료!</p>
        <p className="text-xs text-green-700 mt-0.5">코드 점수 {score}점 · 저장 중…</p>
      </div>
    </div>
  );
}

// ─── 코드 입력 패널 (리뷰 시작 전) ───────────────────────────────────────────

function CodeInputPanel({ code, setCode, language, setLanguage, onStart, loading }) {
  return (
    <div className="flex flex-col gap-4">
      {/* 언어 선택 */}
      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="text-sm border border-input rounded-lg px-3 py-1.5 bg-background outline-none focus:ring-2 focus:ring-ring/50"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">언어를 선택하세요</span>
      </div>

      {/* 코드 textarea */}
      <div className="relative">
        <textarea
          className="w-full flex-1 min-h-[400px] resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-ring/50 leading-relaxed"
          placeholder={`리뷰받을 ${LANGUAGES.find(l => l.value === language)?.label ?? ""} 코드를 붙여넣으세요…`}
          value={code}
          onChange={(e) => setCode(e.target.value.slice(0, 50000))}
          spellCheck={false}
        />
        <span className={`absolute bottom-3 right-3 text-xs select-none ${code.length >= 50000 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
          {code.length.toLocaleString()} / 50,000
        </span>
      </div>

      <button
        onClick={onStart}
        disabled={!code.trim() || loading}
        className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-opacity self-start"
      >
        {loading ? (
          <><Loader2 size={15} className="animate-spin" /> 분석 중…</>
        ) : (
          <><Play size={15} /> 리뷰 시작</>
        )}
      </button>
    </div>
  );
}

// ─── 리뷰 진행 중 왼쪽 코드 패널 ─────────────────────────────────────────────

function CodePreviewPanel({ code, language }) {
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-medium text-muted-foreground">제출한 코드</span>
        <Badge variant="outline" className="text-xs">{LANGUAGES.find(l => l.value === language)?.label ?? language}</Badge>
      </div>
      <pre className="flex-1 overflow-auto rounded-xl border border-border bg-muted/50 px-4 py-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

// ─── 리뷰 페이지 본체 ─────────────────────────────────────────────────────────

function ReviewView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category = searchParams.get("category") ?? "일반";

  const [phase, setPhase] = useState("input"); // "input" | "reviewing"
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [saveError, setSaveError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // API 호출 공통 함수
  async function callApi(history, userMessage) {
    setLoading(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: `${LANGUAGES.find(l => l.value === language)?.label ?? language} 코드 리뷰`,
          code,
          language,
          messages: history,
          message: userMessage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("[review] API 오류:", res.status, errData);
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
        const allMessages = [
          ...history,
          { role: "user", content: userMessage },
          { role: "assistant", content: data.message },
        ];
        // data.score를 직접 전달해 finalScore 클로저 문제 방지
        const saved = await saveSession(data.summary, data.score, allMessages);
        if (saved) {
          setTimeout(() => router.push("/history"), 2000);
        } else {
          setSaveError("리뷰 기록 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // 리뷰 시작
  async function handleStart() {
    if (!code.trim() || loading) return;
    setPhase("reviewing");
    await callApi([], "이 코드를 리뷰해주세요.");
  }

  // 메시지 전송
  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading || isComplete) return;

    const userContent = input.trim();
    setInput("");

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

  // 성공 시 true, 실패 시 false 반환 — score를 명시적 파라미터로 받아 클로저 문제 방지
  async function saveSession(summary, score, allMessages) {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          category_id: category,
          title: `${LANGUAGES.find(l => l.value === language)?.label ?? language} 코드 리뷰`,
          summary,
          score,
          mode: "review",
        })
        .select("id")
        .single();
      if (error) { console.error("[review] 세션 저장 실패:", error.message); return false; }

      const { error: revErr } = await supabase.from("reviews").insert({
        session_id: data.id,
        code,
        messages: allMessages,
      });
      if (revErr) { console.error("[review] reviews insert 실패:", revErr.message); return false; }

      return true;
    } catch (err) {
      console.error("[review] saveSession 예외:", err.message);
      return false;
    }
  }

  const lastScore = messages.findLast((m) => m.role === "assistant")?.score;

  return (
    <div className="flex flex-col h-screen">

      {/* 헤더 */}
      <header className="flex items-center gap-3 px-6 h-16 border-b border-border bg-background shrink-0">
        <Link
          href="/study"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="secondary" className="shrink-0">{category}</Badge>
          <h1 className="text-sm font-semibold">코드 리뷰</h1>
        </div>

        {phase === "reviewing" && lastScore != null && (
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

      {/* 본문 */}
      {phase === "input" ? (
        /* ── 코드 입력 단계 ── */
        <div className="flex-1 overflow-y-auto p-8 max-w-3xl w-full mx-auto">
          <p className="text-muted-foreground text-sm mb-6">
            코드를 붙여넣고 리뷰 시작 버튼을 누르면 Cloyee가 대화형으로 리뷰해드립니다.
          </p>
          <CodeInputPanel
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            onStart={handleStart}
            loading={loading}
          />
        </div>
      ) : (
        /* ── 리뷰 진행 단계 (2패널) ── */
        <div className="flex flex-1 overflow-hidden">

          {/* 왼쪽: 코드 패널 */}
          <div className="w-2/5 border-r border-border p-4 overflow-hidden flex flex-col">
            <CodePreviewPanel code={code} language={language} />
          </div>

          {/* 오른쪽: 채팅 패널 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-muted/30">
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
              {saveError && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm mx-2">
                  <span className="font-semibold">저장 실패</span>
                  <span>{saveError}</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* 메시지 입력창 */}
            <form
              onSubmit={sendMessage}
              className="flex items-end gap-2 px-4 py-3 border-t border-border bg-background shrink-0"
            >
              <textarea
                ref={inputRef}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 max-h-32 overflow-y-auto leading-relaxed"
                placeholder={isComplete ? "리뷰가 완료됐습니다." : "질문하거나 추가 설명을 요청하세요… (Enter 전송)"}
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
        </div>
      )}
    </div>
  );
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground text-sm">로딩 중…</div>}>
      <ReviewView />
    </Suspense>
  );
}
