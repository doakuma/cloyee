"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
  { value: "bug",        label: "버그 신고", emoji: "🐛" },
  { value: "suggestion", label: "개선 제안", emoji: "💡" },
  { value: "other",      label: "기타",      emoji: "💬" },
];

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("suggestion");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("feedback")
      .insert({ user_id: user?.id ?? null, category, content: trimmed });

    setSubmitting(false);

    if (error) {
      toast.error("저장에 실패했어요. 다시 시도해주세요.");
      return;
    }

    toast.success("소중한 의견 감사해요 🙏");
    setOpen(false);
    setCategory("suggestion");
    setContent("");
  }

  function handleOpenChange(val) {
    setOpen(val);
    if (!val) { setCategory("suggestion"); setContent(""); }
  }

  return (
    <>
      {/* FAB */}
      <div className="group fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* 툴팁 */}
        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
          뭐 불편한 건 없으신지...?
        </span>
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full bg-neutral-900 text-white shadow-lg hover:bg-neutral-700 transition-colors flex items-center justify-center"
          aria-label="피드백 보내기"
        >
          <MessageCircle size={22} />
        </button>
      </div>

      {/* 모달 */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>피드백 보내기</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              {CATEGORIES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    category === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="자유롭게 적어주세요 😊"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="w-full"
          >
            {submitting ? "전달 중..." : "전달하기"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
