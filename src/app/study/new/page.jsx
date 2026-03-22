"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, X, Star, Loader2, ChevronDown } from "lucide-react";

const DURATIONS = ["1주", "2주", "1개월", "3개월", "직접입력"];
const DIFFICULTIES = ["입문", "초급", "중급", "고급"];

export default function NewRoadmapPage() {
  const router = useRouter();

  // 폼 상태
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

  // 카테고리 목록
  const [categories, setCategories] = useState([]);

  // 선택 설정 펼침 상태
  const [showOptional, setShowOptional] = useState(false);

  // 저장 상태
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, icon")
      .is("user_id", null)
      .order("name")
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  function addUrl() {
    setReferenceUrls((prev) => [...prev, ""]);
  }

  function removeUrl(i) {
    setReferenceUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateUrl(i, val) {
    setReferenceUrls((prev) => prev.map((u, idx) => (idx === i ? val : u)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!topic.trim()) return;

    setSaving(true);
    setSaveError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const finalDuration = duration === "직접입력" ? customDuration.trim() : duration;
    const urls = referenceUrls.map((u) => u.trim()).filter(Boolean);

    const { error } = await supabase.from("roadmaps").insert({
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

    if (error) {
      console.error("[study/new] 저장 실패:", error.message);
      setSaveError("저장에 실패했습니다. 다시 시도해주세요.");
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  }

  const canSubmit = topic.trim().length > 0 && !saving;

  return (
    <div className="p-8 max-w-lg mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold">학습 로드맵 추가</h1>
        <p className="text-muted-foreground text-sm mt-1">무엇을 배우고 싶으세요?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 주제 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            학습 주제 <span className="text-destructive">*</span>
          </label>
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
          <label className="text-sm font-medium">카테고리</label>
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

        {/* 선택 설정 — 토글 */}
        <div>
          <button
            type="button"
            onClick={() => setShowOptional((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2"
          >
            <ChevronDown size={15} className={`transition-transform ${showOptional ? "rotate-180" : ""}`} />
            더 설정하기 (선택)
          </button>
          {showOptional && <div className="space-y-6 pt-4">

            {/* 관심도 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">관심도</label>
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
                <label className="text-sm font-medium">현재 지식 수준</label>
                <input
                  type="text"
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  placeholder="예: useState만 알아요"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">목표 지식 수준</label>
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
              <label className="text-sm font-medium">참고 문서 / 사이트</label>
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
              <label className="text-sm font-medium">학습 기간</label>
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
              <label className="text-sm font-medium">학습 난이도</label>
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

            {/* 기타 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">기타 메모</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="추가로 AI에게 전달하고 싶은 내용을 자유롭게 적어주세요"
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
              />
            </div>

          </div>}
        </div>

        {saveError && (
          <p className="text-sm text-destructive text-center">{saveError}</p>
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            취소
          </button>
          <Button type="submit" disabled={!canSubmit}>
            {saving && <Loader2 size={15} className="animate-spin mr-1.5" />}
            {saving ? "저장 중…" : "저장하기"}
          </Button>
        </div>

      </form>
    </div>
  );
}
