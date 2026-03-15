"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

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
  const [jobRole, setJobRole] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [experience, setExperience] = useState("");
  const [level, setLevel] = useState("");
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, icon")
      .is("user_id", null)
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  function toggleCategory(id) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleComplete() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase
      .from("profiles")
      .update({
        job_role: jobRole,
        experience,
        level,
        onboarding_done: true,
        category_order: selectedCategories,
      })
      .eq("id", user.id);

    if (error) {
      console.error("[onboarding] 저장 실패:", error.message);
      setSaving(false);
      return;
    }

    router.push("/study");
  }

  const canNext =
    (step === 1 && !!jobRole) ||
    (step === 2 && selectedCategories.length > 0) ||
    (step === 3 && !!experience && !!level);

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

        {/* Step 2 — 카테고리 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">관심 분야를 선택해주세요</h1>
              <p className="text-muted-foreground text-sm mt-1">
                선택한 순서대로 홈에 표시됩니다 · 복수 선택 가능
              </p>
            </div>
            {categories.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">불러오는 중…</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categories.map(({ id, name, icon }) => {
                  const rank = selectedCategories.indexOf(id);
                  const selected = rank !== -1;
                  return (
                    <button
                      key={id}
                      onClick={() => toggleCategory(id)}
                      className={`rounded-xl border-2 p-4 text-left transition-all relative ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary-foreground">{rank + 1}</span>
                        </div>
                      )}
                      <span className="text-xl">{icon}</span>
                      <p className="font-medium text-sm mt-1.5">{name}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — 경력/레벨 */}
        {step === 3 && (
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
  );
}
