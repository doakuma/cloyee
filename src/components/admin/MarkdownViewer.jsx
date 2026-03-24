"use client";

import ReactMarkdown from "react-markdown";

export default function MarkdownViewer({ content }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none
      prose-headings:font-bold
      prose-h1:text-2xl prose-h1:mb-4
      prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
      prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
      prose-p:text-sm prose-p:leading-relaxed
      prose-li:text-sm
      prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
      prose-pre:bg-neutral-950 prose-pre:text-neutral-100 prose-pre:text-xs prose-pre:rounded-lg prose-pre:overflow-x-auto
      prose-table:text-sm
      prose-th:bg-muted/50 prose-th:text-xs prose-th:font-semibold
      prose-td:text-xs prose-td:py-2
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:text-sm
      prose-strong:font-semibold
    ">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
