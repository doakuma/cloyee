"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function AddRoadmapButton({ label = "새 로드맵 추가", variant = "default" }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  async function handleClick() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowModal(true);
      return;
    }
    router.push("/study/new");
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={
          variant === "primary"
            ? "shrink-0 whitespace-nowrap flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            : "flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        }
      >
        <Plus size={15} /> {label}
      </button>

      <AlertDialog open={showModal} onOpenChange={setShowModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그인이 필요해요</AlertDialogTitle>
            <AlertDialogDescription>
              학습 로드맵을 저장하려면 로그인이 필요해요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/login?redirect=/study/new")}>
              로그인하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
