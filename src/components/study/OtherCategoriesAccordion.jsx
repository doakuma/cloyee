"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

export default function OtherCategoriesAccordion({ categories }) {
  const [open, setOpen] = useState(false);

  if (categories.length === 0) return null;

  return (
    <div className="mt-10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
        다른 분야도 학습해볼까요?
        <span className="text-xs text-muted-foreground/60">({categories.length}개)</span>
      </button>

      {open && (
        <div className="mt-4 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/study/chat?category=${cat.id}&title=${encodeURIComponent(cat.name)}`}
              >
                <Card className="cursor-pointer hover:ring-primary/40 transition-shadow h-full opacity-80 hover:opacity-100">
                  <CardHeader>
                    {cat.icon && <span className="text-2xl mb-1">{cat.icon}</span>}
                    <CardTitle>{cat.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/study/review?category=${cat.id}`}
                className="inline-flex items-center gap-1.5 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name} 코드 리뷰
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
