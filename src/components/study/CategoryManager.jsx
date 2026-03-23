"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";

export default function CategoryManager({ initialCategories, userId }) {
  const [categories, setCategories] = useState(initialCategories);
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    const trimmedName = name.trim();
    if (!trimmedName) { setError("카테고리 이름을 입력해주세요."); return; }
    setSaving(true);
    setError("");

    const { data, error: dbErr } = await supabase
      .from("categories")
      .insert({ name: trimmedName, icon: icon.trim() || null, user_id: userId, is_default: false })
      .select("id, name, icon, is_default, user_id")
      .single();

    setSaving(false);
    if (dbErr) { setError("저장에 실패했습니다. 다시 시도해주세요."); return; }

    setCategories((prev) => [...prev, data]);
    setOpen(false);
    setIcon("");
    setName("");
  }

  async function handleDelete(categoryId) {
    const { error: dbErr } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (!dbErr) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    }
  }

  function handleOpenChange(val) {
    setOpen(val);
    if (!val) { setIcon(""); setName(""); setError(""); }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          카테고리
        </h2>
        {userId && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
          >
            <Plus size={13} /> 카테고리 추가
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-sm"
          >
            {cat.icon && <span>{cat.icon}</span>}
            <span className="text-foreground">{cat.name}</span>
            {/* 커스텀 카테고리에만 삭제 버튼 */}
            {!cat.is_default && cat.user_id === userId && (
              <button
                onClick={() => handleDelete(cat.id)}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                aria-label="카테고리 삭제"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 추가 모달 */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>카테고리 추가</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="🎯"
                value={icon}
                onChange={(e) => setIcon([...e.target.value].slice(-1).join(""))}
                className="w-16 text-center text-lg"
                maxLength={2}
              />
              <Input
                placeholder="카테고리 이름 (최대 20자)"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              취소
            </Button>
            <Button onClick={handleAdd} disabled={saving || !name.trim()}>
              {saving ? "저장 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
