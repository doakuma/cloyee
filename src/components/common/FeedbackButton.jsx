"use client";

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, X } from "lucide-react";

const CATEGORIES = [
  { value: "bug",        label: "버그 신고", emoji: "🐛" },
  { value: "suggestion", label: "개선 제안", emoji: "💡" },
  { value: "other",      label: "기타",      emoji: "💬" },
];

export default function FeedbackButton() {
  const pathname = usePathname();
  const fileInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("suggestion");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      toast.error("최대 3장까지 첨부 가능합니다");
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("파일 크기는 5MB 이하여야 합니다");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, { file, preview: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });

    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = "";
  }

  function removeImage(index) {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // 이전 preview blob URL 해제
      URL.revokeObjectURL(prev[index].preview);
      return newImages;
    });
  }

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    let imageUrls = [];
    try {
      // 이미지 업로드 — 서버 API 경유 (타입·크기·매직바이트 검증)
      if (images.length > 0) {
        imageUrls = await Promise.all(
          images.map(async ({ file }) => {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: form });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              console.error("이미지 업로드 실패:", data.error);
              return null;
            }
            const { url } = await res.json();
            return url;
          })
        );
        // null 값 제거 (업로드 실패한 이미지)
        imageUrls = imageUrls.filter(Boolean);
      }
    } catch (err) {
      console.error("이미지 처리 중 오류:", err);
      toast.error("이미지 업로드 중 오류가 발생했습니다. 텍스트만 저장합니다.");
    }

    const { error } = await supabase
      .from("feedback")
      .insert({
        user_id: user?.id ?? null,
        category,
        content: trimmed,
        images: imageUrls,
      });

    setSubmitting(false);

    if (error) {
      toast.error("저장에 실패했어요. 다시 시도해주세요.");
      return;
    }

    toast.success("소중한 의견 감사해요 🙏");
    setOpen(false);
    setCategory("suggestion");
    setContent("");
    setImages([]);
  }

  function handleOpenChange(val) {
    setOpen(val);
    if (!val) {
      setCategory("suggestion");
      setContent("");
      // 미리보기 URL 정리
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
    }
  }

  return (
    <>
      {/* 책갈피 스타일 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-20 right-0 z-50 bg-neutral-900 text-white px-4 py-2 rounded-l-lg hover:bg-neutral-700 transition-colors shadow-lg font-medium text-xs tracking-widest"
        aria-label="피드백 보내기"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        FEEDBACK
      </button>

      {/* 모달 */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md gap-2 rounded-[12px]">
          <DialogHeader>
            <DialogTitle>피드백 보내기</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">뭐 불편한 건 없으신지...?</p>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <div className="flex gap-2">
              {CATEGORIES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                    category === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            <div>
              <Textarea
                placeholder="자유롭게 적어주세요 😊"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={500}
                rows={4}
                className="resize-none rounded-lg"
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= 3}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="이미지 첨부"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>이미지 첨부</span>
                </button>
                <span className={`text-xs ${
                  content.length >= 490 ? 'text-red-500 font-semibold' :
                  content.length >= 400 ? 'text-orange-500' :
                  'text-muted-foreground'
                }`}>
                  {content.length}/500
                </span>
              </div>
            </div>

            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img.preview}
                      alt={`첨부 이미지 ${i + 1}`}
                      className="w-16 h-16 object-cover rounded-md border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-black text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="이미지 제거"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="w-full rounded-sm"
            size="lg"
          >
            {submitting ? "전달 중..." : "전달하기"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
