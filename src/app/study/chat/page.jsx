"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, CheckCircle2, PauseCircle } from "lucide-react";
import MarkdownMessage from "@/components/common/MarkdownMessage";

const isDev = process.env.NODE_ENV !== "production";

// ─── 메시지 버블 ───────────────────────────────────────────────────────────────

function CloyeeMessage({ content, feedback, score }) {
  return (
    <div className="flex flex-col gap-1 max-w-[75%]">
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
    <div className="flex justify-end w-full">
      <div className="flex flex-col items-end gap-1 max-w-[75%]">
        <span className="text-xs text-muted-foreground font-medium px-1">나</span>
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
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
  const sessionId = searchParams.get("session_id"); // 이어하기 진입 시 존재
  const roadmapId = searchParams.get("roadmap_id");

  // { role: "user"|"assistant", content, score?, feedback? }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);   // 연결 대기 (ThinkingBubble)
  const [streaming, setStreaming] = useState(false); // 청크 수신 중 (입력 비활성)
  const [pausing, setPausing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [categoryName, setCategoryName] = useState(category); // UUID 대신 표시할 이름
  const [userProfile, setUserProfile] = useState(null);
  const [roadmap, setRoadmap] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const SESSION_KEY = "cloyee_chat_session";

  // 사용자 프로필 조회
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("job_role, experience, level")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => { if (data) setUserProfile(data); });
    });
  }, []);

  // categories 테이블에서 카테고리 이름 조회 (roadmap.category_id 우선)
  useEffect(() => {
    const catId = roadmap?.category_id ?? category;
    if (!catId || catId === "일반") return;
    supabase
      .from("categories")
      .select("name")
      .eq("id", catId)
      .maybeSingle()
      .then(({ data }) => { if (data?.name) setCategoryName(data.name); });
  }, [category, roadmap]);

  // 새 메시지마다 스크롤 하단으로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 로딩/스트리밍 완료 후 입력창 포커스
  useEffect(() => {
    if (!loading && !streaming && !isComplete) {
      inputRef.current?.focus();
    }
  }, [loading, streaming, isComplete]);

  // 메시지 변경 시 sessionStorage에 저장
  useEffect(() => {
    if (messages.length === 0) return;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ category, title, messages }));
  }, [messages, category, title]);

  // 진입 시 초기화: roadmap_id 있으면 먼저 roadmap 조회 후 시작
  useEffect(() => {
    if (roadmapId) {
      supabase
        .from("roadmaps")
        .select("id, topic, category_id, difficulty, duration, current_level, target_level")
        .eq("id", roadmapId)
        .maybeSingle()
        .then(({ data }) => {
          const rm = data ?? null;
          if (rm) setRoadmap(rm);
          if (sessionId) {
            loadSession(sessionId);
          } else {
            callApi([], "학습을 시작해주세요.", rm);
          }
        });
      return;
    }

    // 기존 자유 학습 흐름
    if (sessionId) {
      loadSession(sessionId);
      return;
    }

    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const { category: savedCategory, title: savedTitle, messages: savedMessages } = JSON.parse(saved);
        if (savedCategory === category && savedTitle === title && savedMessages?.length > 0) {
          setMessages(savedMessages);
          return;
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    callApi([], "학습을 시작해주세요.");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase에서 대화 복원 (이어하기)
  async function loadSession(id) {
    isDev && console.log("[loadSession] 시작 — session_id:", id);
    setLoading(true);
    try {
      const { data: review, error } = await supabase
        .from("reviews")
        .select("messages")
        .eq("session_id", id)
        .maybeSingle();

      isDev && console.log("[loadSession] 결과 — error:", error?.message ?? "없음", "| messages 길이:", review?.messages?.length ?? 0);

      if (error) {
        console.error("[loadSession] Supabase 오류:", error.message, "| code:", error.code);
      }

      if (!error && review?.messages?.length > 0) {
        setMessages(review.messages);
        setLoading(false);
        isDev && console.log("[loadSession] 복원 완료");
      } else {
        isDev && console.warn("[loadSession] messages 없음 — 새 대화 시작");
        setLoading(false);
        callApi([], "학습을 이어서 시작해주세요.");
      }
    } catch (err) {
      console.error("[loadSession] 예외:", err.message);
      setLoading(false);
      callApi([], "학습을 시작해주세요.");
    }
  }

  // API 호출 — SSE 스트리밍 수신 (explicitRoadmap: init 시 state 반영 전 데이터 전달용)
  async function callApi(history, userMessage, explicitRoadmap) {
    const roadmapToSend = explicitRoadmap !== undefined ? explicitRoadmap : roadmap;

    setLoading(true);   // ThinkingBubble 표시
    setStreaming(false);

    let res;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, messages: history, message: userMessage, userProfile, roadmap: roadmapToSend }),
      });
    } catch (err) {
      console.error("[chat] fetch 실패:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "네트워크 오류가 발생했습니다. 다시 시도해주세요." }]);
      setLoading(false);
      return;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      isDev && console.error("[chat] API 오류:", res.status, errData);
      setMessages((prev) => [...prev, { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." }]);
      setLoading(false);
      return;
    }

    // ── 스트림 읽기 시작 ──────────────────────────────────────────────────────
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let lineBuffer = "";       // SSE 라인 분리용 버퍼
    let accumulated = "";      // 누적 메시지 텍스트
    let meta = null;
    let firstChunk = true;

    setStreaming(true);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop(); // 마지막 불완전 라인은 보류

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data.startsWith("[DONE]")) {
            meta = JSON.parse(data.slice(6));
          } else if (data.startsWith("[ERROR]")) {
            const { error } = JSON.parse(data.slice(7));
            throw new Error(error ?? "스트림 오류");
          } else {
            // 텍스트 청크 — JSON.stringify로 인코딩된 문자열
            const text = JSON.parse(data);
            accumulated += text;

            if (firstChunk) {
              // 첫 청크 → ThinkingBubble 제거, 스트리밍 메시지 추가
              firstChunk = false;
              setLoading(false);
              setMessages((prev) => [...prev, { role: "assistant", content: accumulated, score: null, feedback: null }]);
            } else {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], content: accumulated };
                return next;
              });
            }
          }
        }
      }

      // 남은 lineBuffer 처리 (스트림이 \n 없이 끝난 경우)
      if (lineBuffer.startsWith("data: ")) {
        const data = lineBuffer.slice(6);
        if (data.startsWith("[DONE]")) meta = JSON.parse(data.slice(6));
      }

      // 메타데이터로 최종 메시지 업데이트
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: accumulated,
          score: meta?.score ?? null,
          feedback: meta?.feedback ?? null,
        };
        return next;
      });

      if (meta?.is_complete) {
        setIsComplete(true);
        setFinalScore(meta.score);
        const allMessages = [
          ...history,
          { role: "user", content: userMessage },
          { role: "assistant", content: accumulated },
        ];
        const saved = await saveSession(meta.summary, meta.score, allMessages);
        if (saved) {
          sessionStorage.removeItem(SESSION_KEY);
          setTimeout(() => router.push("/history"), 2000);
        } else {
          setSaveError("학습 기록 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      }
    } catch (err) {
      console.error("[chat] 스트림 처리 오류:", err);
      if (firstChunk) {
        setMessages((prev) => [...prev, { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." }]);
      } else {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: accumulated || "오류가 발생했습니다. 다시 시도해주세요." };
          return next;
        });
      }
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading || isComplete) return;

    const userContent = input.trim();
    setInput("");

    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: "user", content: userContent }]);
    await callApi(history, userContent);
  }


  // 완료 시 세션 저장 (신규 생성 or 기존 세션 업데이트) — 성공 시 true, 실패 시 false 반환
  async function saveSession(summary, score, allMessages) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;

      if (sessionId) {
        // 이어하기 → 기존 세션 업데이트
        const { error: sessErr } = await supabase
          .from("sessions")
          .update({ is_complete: true, summary, score })
          .eq("id", sessionId);
        if (sessErr) { console.error("[chat] 세션 업데이트 실패:", sessErr.message); return false; }

        const { error: revErr } = await supabase
          .from("reviews")
          .update({ messages: allMessages })
          .eq("session_id", sessionId);
        if (revErr) { console.error("[chat] reviews 업데이트 실패:", revErr.message); return false; }
      } else {
        // 일반 완료 → 신규 세션 생성
        const { data, error } = await supabase
          .from("sessions")
          .insert({ category_id: roadmap?.category_id ?? null, title, summary, score, mode: "chat", is_complete: true, user_id: userId ?? null, roadmap_id: roadmapId ?? null })
          .select("id")
          .single();
        if (error) { console.error("[chat] 세션 저장 실패:", error.message); return false; }

        const { error: revErr } = await supabase.from("reviews").insert({
          session_id: data.id,
          code: null,
          messages: allMessages,
        });
        if (revErr) { console.error("[chat] reviews insert 실패:", revErr.message); return false; }
      }
      return true;
    } catch (err) {
      console.error("[chat] saveSession 예외:", err.message);
      return false;
    }
  }

  // 오늘은 여기까지 — 현재 진행 상태를 Supabase에 저장하고 홈으로 이동
  async function pauseSession() {
    if (pausing || loading || isComplete || messages.length === 0) return;
    setPausing(true);
    setSaveError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;

      const currentScore = messages.findLast((m) => m.role === "assistant")?.score ?? 0;
      // score/feedback 포함해서 저장해야 복원 시 점수 바가 유지됨
      const apiMessages = messages.map(({ role, content, score, feedback }) => ({
        role,
        content,
        ...(score != null && { score }),
        ...(feedback && { feedback }),
      }));

      isDev && console.log("[pause] apiMessages 길이:", apiMessages.length, "| 첫 항목:", apiMessages[0]);

      let pauseSaved = false;

      if (sessionId) {
        // 이어하기 중 다시 일시정지 → 기존 세션/리뷰 업데이트
        const { error: sessErr } = await supabase
          .from("sessions")
          .update({ score: currentScore })
          .eq("id", sessionId);
        if (sessErr) { console.error("[pause] sessions 업데이트 실패:", sessErr.message); }
        else {
          const { error: revErr } = await supabase
            .from("reviews")
            .update({ messages: apiMessages })
            .eq("session_id", sessionId);
          if (revErr) console.error("[pause] reviews 업데이트 실패:", revErr.message);
          else {
            isDev && console.log("[pause] reviews 업데이트 성공 (session_id:", sessionId, ")");
            pauseSaved = true;
          }
        }
      } else {
        // 신규 세션 중간 저장
        const { data, error: sessErr } = await supabase
          .from("sessions")
          .insert({ category_id: roadmap?.category_id ?? null, title, summary: null, score: currentScore, mode: "chat", is_complete: false, user_id: userId, roadmap_id: roadmapId ?? null })
          .select("id")
          .single();
        if (sessErr) { console.error("[pause] sessions insert 실패:", sessErr.message); }
        else {
          isDev && console.log("[pause] sessions insert 성공 — session id:", data.id);
          const { error: revErr } = await supabase.from("reviews").insert({
            session_id: data.id,
            messages: apiMessages,
          });
          if (revErr) console.error("[pause] reviews insert 실패:", revErr.message, "| code:", revErr.code);
          else {
            isDev && console.log("[pause] reviews insert 성공");
            pauseSaved = true;
          }
        }
      }

      if (pauseSaved) {
        sessionStorage.removeItem(SESSION_KEY);
        router.push("/dashboard");
      } else {
        setSaveError("진행 상황 저장에 실패했습니다. 다시 시도해주세요.");
        setPausing(false);
      }
    } catch (err) {
      console.error("[pause] 예외:", err.message);
      setSaveError("진행 상황 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      setPausing(false);
    }
  }

  const lastScore = messages.findLast((m) => m.role === "assistant")?.score;
  const canPause = !loading && !streaming && !isComplete && !pausing && messages.length > 0;

  return (
    <div className="flex flex-col h-[100dvh]">

      {/* 상단 헤더 */}
      <header className="sticky top-0 z-10 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 h-14 sm:h-16 border-b border-border bg-background shrink-0">
        <Link
          href="/study"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="secondary" className="shrink-0">{categoryName}</Badge>
          {(() => {
            const displayTitle = roadmap?.topic ?? title;
            return displayTitle && displayTitle !== categoryName ? (
              <h1 className="text-sm font-semibold truncate">{displayTitle}</h1>
            ) : null;
          })()}
        </div>

        {/* 오늘은 여기까지 버튼 */}
        <button
          onClick={pauseSession}
          disabled={!canPause}
          className="shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pausing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <PauseCircle size={14} />
          )}
          <span className="hidden sm:inline">오늘은 여기까지</span>
        </button>

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
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5 bg-muted/30">
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
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-4 text-sm">
            <span className="font-semibold">저장 실패</span>
            <span>{saveError}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 하단 입력창 */}
      <form
        onSubmit={sendMessage}
        className="flex items-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-background shrink-0"
      >
        <textarea
          ref={inputRef}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 max-h-36 overflow-y-auto leading-relaxed"
          placeholder={isComplete ? "학습이 완료됐습니다." : "메시지를 입력하세요…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              sendMessage(e);
            }
          }}
          disabled={loading || streaming || isComplete}
        />
        <button
          type="submit"
          disabled={loading || streaming || isComplete || !input.trim()}
          className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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
