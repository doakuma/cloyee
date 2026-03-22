"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, CheckCircle2, PauseCircle } from "lucide-react";
import MarkdownMessage from "@/components/common/MarkdownMessage";
import ChoiceButtons from "@/components/common/ChoiceButtons";
import { parseChoices } from "@/utils/parseChoices";

const isDev = process.env.NODE_ENV !== "production";

// ─── 플로우 버튼 (복습 여부 / 방식 선택) ──────────────────────────────────────

function FlowButtons({ buttons, onSelect, disabled }) {
  if (!buttons?.length) return null;
  return (
    <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={() => onSelect(btn)}
          disabled={disabled}
          className="w-full text-left px-4 py-2.5 text-sm border border-border rounded-xl hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// ─── 메시지 버블 ───────────────────────────────────────────────────────────────

function CloyeeMessage({ content, feedback, choices, choiceAnswer, onSelect, flowButtons, onFlowButton, flowDisabled }) {
  return (
    <div className="flex flex-col gap-1 max-w-[75%]">
      <span className="text-xs text-muted-foreground font-medium px-1">Cloyee</span>
      <Card>
        <CardContent className="py-3 px-4 text-sm leading-relaxed">
          <MarkdownMessage content={content} />
          {choices?.length > 0 && (
            <ChoiceButtons choices={choices} onSelect={onSelect} answer={choiceAnswer} />
          )}
          {flowButtons?.length > 0 && (
            <FlowButtons buttons={flowButtons} onSelect={onFlowButton} disabled={flowDisabled} />
          )}
        </CardContent>
      </Card>
      {feedback && (
        <span className="text-xs text-muted-foreground px-1 mt-0.5 block">{feedback}</span>
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

function CompleteBanner({ score }) {
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4 text-sm">
      <CheckCircle2 size={18} className="shrink-0 text-green-600" />
      <div>
        <p className="font-semibold">학습 완료!</p>
        <p className="text-xs text-green-700 mt-0.5">오늘의 이해도 {score}점 · 기록을 저장하고 있습니다…</p>
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
  const sessionId = searchParams.get("session_id");
  const roadmapId = searchParams.get("roadmap_id");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [categoryName, setCategoryName] = useState(category);
  const [userProfile, setUserProfile] = useState(null);
  const [roadmap, setRoadmap] = useState(null);

  // 플로우 상태
  const [chatMode, setChatMode] = useState(null); // null | 'conversational' | 'choice'
  const [flowStep, setFlowStep] = useState("greeting"); // 'greeting' | 'learning'
  const [lastSession, setLastSession] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const SESSION_KEY = `cloyee_chat_${roadmapId || category}`;

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

  // 카테고리 이름 조회
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

  // 새 메시지마다 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 로딩/스트리밍 완료 후 입력창 포커스
  useEffect(() => {
    if (!loading && !streaming && !isComplete) {
      inputRef.current?.focus();
    }
  }, [loading, streaming, isComplete]);

  // 메시지 변경 시 sessionStorage 저장 (플로우 메시지 제외)
  useEffect(() => {
    if (flowStep !== "learning") return;
    const msgsToSave = messages.filter((m) => !m.isFlow);
    if (msgsToSave.length === 0) return;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      category, title, messages: msgsToSave, chatMode,
    }));
  }, [messages, category, title, chatMode, flowStep]);

  // 진입 초기화
  useEffect(() => {
    async function init() {
      // 1. 로드맵 조회
      let rm = null;
      if (roadmapId) {
        const { data } = await supabase
          .from("roadmaps")
          .select("id, topic, category_id, difficulty, duration, current_level, target_level")
          .eq("id", roadmapId)
          .maybeSingle();
        rm = data ?? null;
        if (rm) setRoadmap(rm);
      }

      // 2. 이어하기 진입 — 플로우 없이 바로 세션 복원
      if (sessionId) {
        await loadSession(sessionId, rm);
        setFlowStep("learning");
        return;
      }

      // 3. sessionStorage 복원 — 이미 학습 중이었으면 플로우 건너뜀
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        try {
          const { category: sc, title: st, messages: sm, chatMode: scm } = JSON.parse(saved);
          if (sc === category && st === title && sm?.length > 0) {
            setMessages(sm);
            if (scm) setChatMode(scm);
            setFlowStep("learning");
            return;
          }
        } catch {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }

      // 4. 신규 진입 — 인사 플로우 시작
      await initFlow(rm);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 인사 플로우 ─────────────────────────────────────────────────────────────

  async function initFlow(rm) {
    const { data: { user } } = await supabase.auth.getUser();
    let lastSess = null;

    if (user) {
      const catId = rm?.category_id ?? null; // 반드시 UUID만 사용, 카테고리 이름 사용 금지
      let query = supabase
        .from("sessions")
        .select("id, title, summary, score, created_at, roadmaps(topic)")
        .eq("mode", "chat")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (roadmapId) query = query.eq("roadmap_id", roadmapId);
      else if (catId) query = query.eq("category_id", catId);
      else query = null;

      if (query) {
        const { data } = await query;
        lastSess = data?.[0] ?? null;
      }
    }

    setLastSession(lastSess);

    const topicName = rm?.topic ?? title;

    if (lastSess) {
      const dateStr = new Date(lastSess.created_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
      setMessages([{
        role: "assistant",
        content: `다시 돌아오셨군요! 반가워요 😊\n\n지난 ${dateStr}에 **${lastSess.roadmaps?.topic ?? lastSess.title}** 학습을 하셨어요. 복습하고 시작할까요, 아니면 바로 이어서 할까요?`,
        isDone: true,
        isFlow: true,
        flowButtons: [
          { label: "📖 복습하고 시작", action: "review" },
          { label: "▶ 바로 이어서", action: "mode_select" },
        ],
      }]);
    } else {
      setMessages([{
        role: "assistant",
        content: `안녕하세요! 오늘도 함께 공부해봐요 🎉\n\n**${topicName}** 학습을 시작할게요. 어떤 방식으로 학습하고 싶으신가요?`,
        isDone: true,
        isFlow: true,
        flowButtons: [
          { label: "💬 대화형으로 학습", action: "set_mode", value: "conversational" },
          { label: "✅ 선택형으로 학습", action: "set_mode", value: "choice" },
        ],
      }]);
    }
  }

  async function handleFlowButton(btn) {
    // 버튼 제거 (클릭된 메시지에서)
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], flowButtons: null };
      return next;
    });

    // 사용자 메시지로 표시
    setMessages((prev) => [...prev, { role: "user", content: btn.label, isFlow: true }]);

    if (btn.action === "review") {
      const dateStr = new Date(lastSession.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
      const sessionTitle = lastSession.roadmaps?.topic ?? lastSession.title;
      const summaryLine = lastSession.summary ? `\n\n${lastSession.summary}` : "";
      const scoreLine = lastSession.score > 0 ? `\n\n⭐ **이해도 ${lastSession.score}점**` : "\n\n이해도 기록 없음";

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `지난 학습 요약이에요:\n\n📚 **${sessionTitle}**${summaryLine}${scoreLine}\n\n📅 ${dateStr}\n\n방식을 선택해주세요!`,
        isDone: true,
        isFlow: true,
        flowButtons: [
          { label: "💬 대화형으로 학습", action: "set_mode", value: "conversational" },
          { label: "✅ 선택형으로 학습", action: "set_mode", value: "choice" },
        ],
      }]);
    } else if (btn.action === "mode_select") {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "어떤 방식으로 학습하고 싶으신가요?",
        isDone: true,
        isFlow: true,
        flowButtons: [
          { label: "💬 대화형으로 학습", action: "set_mode", value: "conversational" },
          { label: "✅ 선택형으로 학습", action: "set_mode", value: "choice" },
        ],
      }]);
    } else if (btn.action === "set_mode") {
      const mode = btn.value;
      setChatMode(mode);
      setFlowStep("learning");

      const startMsg = mode === "choice"
        ? "선택형 방식으로 학습을 시작해주세요. 4지선다 문제로 진행해주세요."
        : "대화형 방식으로 학습을 시작해주세요.";
      await callApi([], startMsg, roadmap ?? undefined, mode);
    }
  }

  // ── 세션 복원 ───────────────────────────────────────────────────────────────

  async function loadSession(id, rm) {
    isDev && console.log("[loadSession] 시작 — session_id:", id);
    setLoading(true);
    try {
      const { data: review, error } = await supabase
        .from("reviews")
        .select("messages")
        .eq("session_id", id)
        .maybeSingle();

      if (!error && review?.messages?.length > 0) {
        setMessages(review.messages);
        setLoading(false);
      } else {
        setLoading(false);
        callApi([], "학습을 이어서 시작해주세요.", rm);
      }
    } catch (err) {
      console.error("[loadSession] 예외:", err.message);
      setLoading(false);
      callApi([], "학습을 시작해주세요.", rm);
    }
  }

  // ── API 호출 (SSE 스트리밍) ─────────────────────────────────────────────────

  async function callApi(history, userMessage, explicitRoadmap, explicitChatMode) {
    const roadmapToSend = explicitRoadmap !== undefined ? explicitRoadmap : roadmap;
    const chatModeToSend = explicitChatMode !== undefined ? explicitChatMode : chatMode;

    setLoading(true);
    setStreaming(false);

    let res;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category, title,
          messages: history.map(({ role, content }) => ({ role, content })),
          message: userMessage,
          userProfile, roadmap: roadmapToSend, chatMode: chatModeToSend,
        }),
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

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let lineBuffer = "";
    let accumulated = "";
    let meta = null;
    let firstChunk = true;

    setStreaming(true);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data.startsWith("[DONE]")) {
            meta = JSON.parse(data.slice(6));
          } else if (data.startsWith("[ERROR]")) {
            const { error } = JSON.parse(data.slice(7));
            throw new Error(error ?? "스트림 오류");
          } else {
            const text = JSON.parse(data);
            accumulated += text;

            if (firstChunk) {
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

      if (lineBuffer.startsWith("data: ")) {
        const data = lineBuffer.slice(6);
        if (data.startsWith("[DONE]")) meta = JSON.parse(data.slice(6));
      }

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: accumulated,
          score: meta?.score ?? null,
          feedback: meta?.feedback ?? null,
          isDone: true,
          answer: meta?.answer ?? -1,
        };
        return next;
      });

      if (meta?.is_complete) {
        // 응답에 선택지가 포함되어 있으면 아직 질문 중 — is_complete 무시
        const { choices: pendingChoices } = parseChoices(accumulated);
        if (pendingChoices.length === 0) {
          await handleComplete();
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

    async function handleComplete() {
      setIsComplete(true);
      const learningHistory = history.filter((m) => !m.isFlow);
      const prevScores = learningHistory.filter((m) => m.role === "assistant" && m.score > 0).map((m) => m.score);
      const allScores = meta.score > 0 ? [...prevScores, meta.score] : prevScores;
      const avgScore = allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : meta.score ?? 0;
      setFinalScore(avgScore);
      const allMessages = [
        ...learningHistory,
        { role: "user", content: userMessage },
        { role: "assistant", content: accumulated },
      ];
      const saved = await saveSession(meta.summary, avgScore, allMessages);
      if (saved) {
        sessionStorage.removeItem(SESSION_KEY);
        setTimeout(() => router.push("/history"), 2000);
      } else {
        setSaveError("학습 기록 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    }
  }

  // ── 메시지 전송 ─────────────────────────────────────────────────────────────

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading || streaming || isComplete) return;

    const userContent = input.trim();
    setInput("");

    const history = messages.filter((m) => !m.isFlow).map(({ role, content, score }) => ({ role, content, ...(score != null && { score }) }));
    setMessages((prev) => [...prev, { role: "user", content: userContent }]);
    await callApi(history, userContent);
  }

  // 선택지 클릭 → 즉시 전송
  async function handleChoiceSelect(choice) {
    if (loading || streaming || isComplete) return;
    const history = messages.filter((m) => !m.isFlow).map(({ role, content, score }) => ({ role, content, ...(score != null && { score }) }));
    setMessages((prev) => [...prev, { role: "user", content: choice }]);
    await callApi(history, choice);
  }

  // ── 세션 저장 ───────────────────────────────────────────────────────────────

  async function saveSession(summary, score, allMessages) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;

      if (sessionId) {
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
          user_id: userId ?? null,
        });
        if (revErr) { console.error("[chat] reviews insert 실패:", revErr.message); return false; }
      }
      return true;
    } catch (err) {
      console.error("[chat] saveSession 예외:", err.message);
      return false;
    }
  }

  // ── 오늘은 여기까지 ─────────────────────────────────────────────────────────

  async function pauseSession() {
    if (pausing || loading || isComplete || flowStep !== "learning") return;
    const learningMsgs = messages.filter((m) => !m.isFlow);
    if (learningMsgs.length === 0) return;

    setPausing(true);
    setSaveError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;

      const currentScore = learningMsgs.findLast((m) => m.role === "assistant")?.score ?? 0;
      const apiMessages = learningMsgs.map(({ role, content, score, feedback }) => ({
        role,
        content,
        ...(score != null && { score }),
        ...(feedback && { feedback }),
      }));

      // 중단 전 대화 요약 생성
      let pauseSummary = null;
      try {
        const sumRes = await fetch("/api/chat/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });
        if (sumRes.ok) {
          const { summary } = await sumRes.json();
          pauseSummary = summary ?? null;
        }
      } catch (sumErr) {
        console.warn("[pause] 요약 생성 실패 (무시):", sumErr.message);
      }

      let pauseSaved = false;

      if (sessionId) {
        const { error: sessErr } = await supabase
          .from("sessions")
          .update({ score: currentScore, summary: pauseSummary })
          .eq("id", sessionId);
        if (sessErr) { console.error("[pause] sessions 업데이트 실패:", sessErr.message); }
        else {
          const { error: revErr } = await supabase
            .from("reviews")
            .update({ messages: apiMessages })
            .eq("session_id", sessionId);
          if (revErr) console.error("[pause] reviews 업데이트 실패:", revErr.message);
          else pauseSaved = true;
        }
      } else {
        const { data, error: sessErr } = await supabase
          .from("sessions")
          .insert({ category_id: roadmap?.category_id ?? null, title, summary: pauseSummary, score: currentScore, mode: "chat", is_complete: false, user_id: userId, roadmap_id: roadmapId ?? null })
          .select("id")
          .single();
        if (sessErr) { console.error("[pause] sessions insert 실패:", sessErr.message); }
        else {
          const { error: revErr } = await supabase.from("reviews").insert({
            session_id: data.id,
            code: null,
            messages: apiMessages,
            user_id: userId ?? null,
          });
          if (revErr) console.error("[pause] reviews insert 실패:", revErr.message);
          else pauseSaved = true;
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

  // ── 렌더 ────────────────────────────────────────────────────────────────────

  const learningMessages = messages.filter((m) => !m.isFlow);
  const progress = Math.max(0, learningMessages.filter((m) => m.role === "assistant" && m.isDone).length - 1);
  const canPause = flowStep === "learning" && !loading && !streaming && !isComplete && !pausing && learningMessages.length > 0;

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
          {chatMode && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {chatMode === "choice" ? "✅ 선택형" : "💬 대화형"}
            </Badge>
          )}
        </div>

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

        {flowStep === "learning" && progress > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">{progress}문항 학습 중</span>
        )}
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5 bg-muted/30">
        {messages.map((msg, i) => {
          if (msg.role === "user") return <UserMessage key={i} content={msg.content} />;

          const { cleanText, choices } = parseChoices(msg.content);
          const isLastMsg = i === messages.length - 1;
          const showChoices = !msg.isFlow && msg.isDone && isLastMsg && choices.length > 0;
          const showFlowButtons = msg.isFlow && msg.isDone && isLastMsg && msg.flowButtons?.length > 0;

          return (
            <CloyeeMessage
              key={i}
              content={cleanText}
              feedback={msg.feedback}
              choices={showChoices ? choices : []}
              choiceAnswer={showChoices ? (msg.answer ?? -1) : -1}
              onSelect={handleChoiceSelect}
              flowButtons={showFlowButtons ? msg.flowButtons : null}
              onFlowButton={handleFlowButton}
              flowDisabled={loading || streaming}
            />
          );
        })}

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
          placeholder={
            isComplete
              ? "학습이 완료됐습니다."
              : flowStep === "greeting"
              ? "위에서 방식을 선택하거나 직접 입력하세요…"
              : chatMode === "choice"
              ? "직접 질문하거나 답변을 입력하세요…"
              : "메시지를 입력하세요…"
          }
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

// ─── 페이지 (Suspense 래핑) ────────────────────────────────────────────────────

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground text-sm">로딩 중…</div>}>
      <ChatView />
    </Suspense>
  );
}
