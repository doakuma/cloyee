"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function DownloadButton({ session, review }) {
  function handleDownload() {
    const dateStr = new Date(session.created_at).toLocaleDateString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
    }).replace(/\. /g, ".").replace(".", "").replace(/\.$/, "");

    const isReview = session.mode === "review";
    const categoryName = session.categories?.name ?? session.category_id ?? "—";

    let content = `# ${session.title ?? "학습 세션"}\n`;
    content += `- 날짜: ${new Date(session.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}\n`;
    content += `- 카테고리: ${categoryName}\n`;
    if (session.score != null) content += `- 이해도 점수: ${session.score}점\n`;
    content += "\n";

    if (session.summary) {
      content += `## 학습 요약\n${session.summary}\n\n`;
    }

    if (isReview && review?.code) {
      content += `## 리뷰한 코드\n\`\`\`\n${review.code}\n\`\`\`\n\n`;
    }

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (session.title ?? "세션").replace(/[\\/:*?"<>|]/g, "_").slice(0, 40);
    a.href = url;
    a.download = `cloyee_${safeName}_${dateStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} className="shrink-0 gap-1.5">
      <Download size={14} />
      문서로 저장
    </Button>
  );
}
