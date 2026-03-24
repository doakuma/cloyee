import fs from "fs";
import path from "path";
import Link from "next/link";
import { FileText } from "lucide-react";

const DOCS_DIR = path.join(process.cwd(), "docs");

const DOC_META = {
  "cloyee_prd": { label: "PRD", desc: "Product Requirements Document" },
  "cloyee_tech_stack": { label: "기술 스택", desc: "프레임워크, 패키지, 구조 설명" },
  "cloyee_db": { label: "DB 설계", desc: "테이블 구조, RLS, 마이그레이션" },
  "cloyee_api": { label: "API 설계", desc: "Claude API, SSE 스트리밍 방식" },
  "cloyee_issues": { label: "이슈 트래커", desc: "해결 완료 / 미해결 이슈 목록" },
  "user-journey": { label: "유저 여정", desc: "전체 사용자 플로우 정의" },
  "작업로그": { label: "작업 로그", desc: "날짜별 작업 내역" },
  "cloyee_multiuser_roadmap": { label: "멀티유저 로드맵", desc: "다중 사용자 기능 계획" },
  "cloyee_v2_ideas": { label: "v2 아이디어", desc: "향후 기능 아이디어 정리" },
  "AI 토큰 비용 및 최적화 전략": { label: "AI 토큰 최적화", desc: "비용 분석 및 최적화 전략" },
};

function getDocs() {
  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const meta = DOC_META[slug] ?? { label: slug, desc: "" };
    const stat = fs.statSync(path.join(DOCS_DIR, file));
    return { slug, file, ...meta, updatedAt: stat.mtime };
  });
}

export default function AdminDocsPage() {
  const docs = getDocs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">프로젝트 문서</h1>
        <p className="text-sm text-muted-foreground mt-1">총 {docs.length}개</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docs.map(({ slug, label, desc, updatedAt }) => (
          <Link
            key={slug}
            href={`/admin/docs/${encodeURIComponent(slug)}`}
            className="flex items-start gap-3 rounded-lg border border-border bg-white dark:bg-neutral-900 px-4 py-3.5 hover:bg-muted/40 transition-colors"
          >
            <FileText size={18} className="text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{label}</p>
              {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                {updatedAt.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
