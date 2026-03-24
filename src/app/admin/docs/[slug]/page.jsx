import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import MarkdownViewer from "@/components/admin/MarkdownViewer";

const DOCS_DIR = path.join(process.cwd(), "docs");

export default async function AdminDocPage({ params }) {
  const { slug: rawSlug } = await params;
  const fileName = decodeURIComponent(rawSlug).replace(/-/g, " ");
  const filePath = path.join(DOCS_DIR, `${fileName}.md`);

  if (!fs.existsSync(filePath)) notFound();

  const content = fs.readFileSync(filePath, "utf-8");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/docs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={15} />
        문서 목록으로
      </Link>

      <div className="rounded-lg border border-border bg-white dark:bg-neutral-900 px-8 py-8">
        <MarkdownViewer content={content} />
      </div>
    </div>
  );
}
