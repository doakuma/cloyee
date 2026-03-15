"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Check, Plus, X, Star } from "lucide-react";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const JOB_ROLES = [
  { value: "developer", label: "개발자", emoji: "💻" },
  { value: "planner", label: "기획자", emoji: "📋" },
  { value: "designer", label: "디자이너", emoji: "🎨" },
  { value: "other", label: "기타", emoji: "✨" },
];

const EXPERIENCES = [
  { value: "under1", label: "1년 미만" },
  { value: "1to3", label: "1~3년" },
  { value: "3to5", label: "3~5년" },
  { value: "over5", label: "5년 이상" },
];

const LEVELS = [
  { value: "beginner", label: "입문", desc: "기초 개념을 배우는 중" },
  { value: "elementary", label: "초급", desc: "기본 문법을 알고 있음" },
  { value: "intermediate", label: "중급", desc: "실무 경험이 있음" },
  { value: "advanced", label: "고급", desc: "심화 주제도 다룰 수 있음" },
];

const DURATIONS = ["1주", "2주", "1개월", "3개월", "직접입력"];
const DIFFICULTIES = ["입문", "초급", "중급", "고급"];

// ─── 진행 표시 ────────────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              s <= current
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s < current ? <Check size={14} /> : s}
          </div>
          {s < 3 && (
            <div className={`h-0.5 w-12 transition-colors ${s < current ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 온보딩 페이지 ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Step 1 — 직군
  const [jobRole, setJobRole] = useState("");

  // Step 2 — 경험/레벨
  const [experience, setExperience] = useState("");
  const [level, setLevel] = useState("");

  // Step 3 — 첫 로드맵
  const [categories, setCategories] = useState([]);
  const [topic, setTopic] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [interestLevel, setInterestLevel] = useState(0);
  const [currentLevel, setCurrentLevel] = useState("");
  const [targetLevel, setTargetLevel] = useState("");
  const [referenceUrls, setReferenceUrls] = useState([""]);
  const [duration, setDuration] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, icon")
      .is("user_id", null)
      .order("name")
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  // ─── URL 헬퍼 ───────────────────────────────────────────────────────────────

  function addUrl() {
    setReferenceUrls((prev) => [...prev, ""]);
  }
  function removeUrl(i) {
    setReferenceUrls((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateUrl(i, val) {
    setReferenceUrls((prev) => prev.map((u, idx) => (idx === i ? val : u)));
  }

  // ─── profiles 저장 ──────────────────────────────────────────────────────────

  async function saveProfile(user) {
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        job_role: jobRole,
        experience,
        level,
        onboarding_done: true,
      });
    return error;
  }

  // ─── 완료 (profiles + roadmap) ──────────────────────────────────────────────

  async function handleComplete() {
    setSaving(true);
    setSaveError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const profileError = await saveProfile(user);
    if (profileError) {
      console.error("[onboarding] profiles 저장 실패:", profileError.message);
      setSaveError("저장에 실패했습니다. 다시 시도해주세요.");
      setSaving(false);
      return;
    }

    const finalDuration = duration === "직접입력" ? customDuration.trim() : duration;
    const urls = referenceUrls.map((u) => u.trim()).filter(Boolean);

    const { error: roadmapError } = await supabase.from("roadmaps").insert({
      user_id: user.id,
      topic: topic.trim(),
      category_id: categoryId || null,
      interest_level: interestLevel || null,
      current_level: currentLevel.trim() || null,
      target_level: targetLevel.trim() || null,
      reference_urls: urls.length > 0 ? urls : null,
      duration: finalDuration || null,
      difficulty: difficulty || null,
      notes: notes.trim() || null,
      status: "active",
    });

    if (roadmapError) {
      console.error("[onboarding] roadmaps 저장 실패:", roadmapError.message);
      setSaveError("저장에 실패했습니다. 다시 시도해주세요.");
      setSaving(false);
      return;
    }

    router.push("/");
  }

  // ─── 건너뛰기 (profiles만 저장) ─────────────────────────────────────────────

  async function handleSkip() {
    setSaving(true);
    setSaveError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const profileError = await saveProfile(user);
    if (profileError) {
      console.error("[onboarding] profiles 저장 실패:", profileError.message);
      setSaveError("저장에 실패했습니다. 다시 시도해주세요.");
      setSaving(false);
      return;
    }

    router.push("/");
  }

  // ─── 다음 버튼 활성화 조건 ───────────────────────────────────────────────────

  const canNext =
    (step === 1 && !!jobRole) ||
    (step === 2 && !!experience && !!level) ||
    (step === 3 && !!topic.trim());

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">

        {/* 로고 */}
        <p className="text-center text-sm font-semibold text-muted-foreground mb-6 tracking-wide">Cloyee</p>

        <StepIndicator current={step} />

        {/* Step 1 — 직군 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">어떤 분야에서 일하세요?</h1>
              <p className="text-muted-foreground text-sm mt-1">직군에 맞게 대화 방식을 조정합니다</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {JOB_ROLES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setJobRole(value)}
                  className={`rounded-xl border-2 p-5 text-left transition-all ${
                    jobRole === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <p className="font-medium mt-2">{label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — 경험/레벨 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">현재 레벨을 알려주세요</h1>
              <p className="text-muted-foreground text-sm mt-1">맞춤 난이도로 학습을 제공합니다</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">개발 경력</p>
              <div className="grid grid-cols-2 gap-2">
                {EXPERIENCES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setExperience(value)}
                    className={`rounded-xl border-2 py-3 px-4 text-sm font-medium transition-all ${
                      experience === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">자가 평가 레벨</p>
              <div className="space-y-2">
                {LEVELS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setLevel(value)}
                    className={`w-full rounded-xl border-2 p-3.5 text-left transition-all ${
                      level === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{label}</span>
                      <span className="text-xs text-muted-foreground">{desc}</span>
                      {level === value && <Check size={14} className="ml-auto text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — 첫 로드맵 */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">첫 번째 학습을 설정해볼게요 🎯</h1>
              <p className="text-muted-foreground text-sm mt-1">무엇을 배우고 싶으세요?</p>
            </div>

            {/* 주제 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                학습 주제 <span className="text-destructive">*</span>
              </p>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: React 상태 관리, SQL 기초, 시스템 디자인"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">카테고리</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId("")}
                  className={`rounded-xl border-2 py-2.5 px-3 text-sm font-medium transition-all ${
                    categoryId === ""
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  자유 주제
                </button>
                {categories.map(({ id, name, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategoryId(id)}
                    className={`rounded-xl border-2 py-2.5 px-3 text-sm font-medium transition-all flex items-center gap-2 ${
                      categoryId === id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    {icon && <span>{icon}</span>}
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* 관심도 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">관심도</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setInterestLevel(n === interestLevel ? 0 : n)}
                    className="p-1 transition-colors"
                  >
                    <Star
                      size={24}
                      className={n <= interestLevel ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 현재/목표 지식 수준 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">현재 지식 수준</p>
                <input
                  type="text"
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  placeholder="예: useState만 알아요"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">목표 지식 수준</p>
                <input
                  type="text"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  placeholder="예: 상태 최적화까지"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
            </div>

            {/* 참고 문서/사이트 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">참고 문서 / 사이트</p>
              <div className="space-y-2">
                {referenceUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrl(i, e.target.value)}
                      placeholder="https://..."
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
                    />
                    {referenceUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrl(i)}
                        className="p-3 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addUrl}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus size={14} /> URL 추가
                </button>
              </div>
            </div>

            {/* 학습 기간 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">학습 기간</p>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`rounded-xl border-2 py-2 px-4 text-sm font-medium transition-all ${
                      duration === d
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {duration === "직접입력" && (
                <input
                  type="text"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="예: 6주, 45일"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition mt-2"
                />
              )}
            </div>

            {/* 학습 난이도 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">학습 난이도</p>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`rounded-xl border-2 py-2 px-4 text-sm font-medium transition-all ${
                      difficulty === d
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 기타 메모 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">기타 메모</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="추가로 AI에게 전달하고 싶은 내용을 자유롭게 적어주세요"
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
              />
            </div>
          </div>
        )}

        {/* 저장 오류 메시지 */}
        {saveError && (
          <p className="mt-6 text-sm text-destructive text-center">{saveError}</p>
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} /> 이전
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-4">
            {step === 3 && (
              <button
                onClick={handleSkip}
                disabled={saving}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                나중에 추가할게요
              </button>
            )}

            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                다음 <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={!canNext || saving}>
                {saving ? "저장 중…" : "시작하기"}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
