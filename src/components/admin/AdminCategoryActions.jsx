"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";

// deleteMode=false → "+ 기본 카테고리 추가" 버튼
// deleteMode=true  → 삭제 버튼 (행 내)
export default function AdminCategoryActions({ categoryId, categoryName, deleteMode = false }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [icon, setIcon] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    const trimmedName = name.trim();
    if (!trimmedName) { setError("카테고리 이름을 입력해주세요."); return; }
    setSaving(true);
    setError("");
    const { error: dbErr } = await supabase
      .from("categories")
      .insert({ name: trimmedName, icon: icon.trim() || null, user_id: null, is_default: true });
    setSaving(false);
    if (dbErr) { setError("저장에 실패했습니다."); return; }
    setAddOpen(false);
    setIcon("");
    setName("");
    router.refresh();
  }

  async function handleDelete() {
    await supabase.from("categories").delete().eq("id", categoryId);
    setDeleteOpen(false);
    router.refresh();
  }

  if (deleteMode) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={14} />
        </Button>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>카테고리를 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{categoryName}</strong> 카테고리를 삭제합니다. 복구할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="flex items-center gap-1.5 text-xs"
        onClick={() => setAddOpen(true)}
      >
        <Plus size={13} /> 기본 카테고리 추가
      </Button>

      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) { setIcon(""); setName(""); setError(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>기본 카테고리 추가</DialogTitle>
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
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>취소</Button>
            <Button onClick={handleAdd} disabled={saving || !name.trim()}>
              {saving ? "저장 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
