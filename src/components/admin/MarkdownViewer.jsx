"use client";

import ReactMarkdown from "react-markdown";

export default function MarkdownViewer({ content }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mb-4 pb-2 border-b border-border">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold mt-10 mb-3 pb-2 border-b border-border">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mt-6 mb-2">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold mt-4 mb-1">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-3 text-foreground">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-3 space-y-1 text-sm">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-3 space-y-1 text-sm">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed text-foreground pl-1">{children}</li>
        ),
        code: ({ inline, children }) =>
          inline ? (
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">
              {children}
            </code>
          ) : (
            <code className="block text-xs font-mono leading-relaxed">{children}</code>
          ),
        pre: ({ children }) => (
          <pre className="bg-neutral-950 text-neutral-100 text-xs font-mono rounded-lg px-5 py-4 overflow-x-auto mb-4 leading-relaxed">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/40 pl-4 py-1 mb-3 text-sm text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity" target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        hr: () => <hr className="border-border my-6" />,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse border border-border rounded-lg overflow-hidden">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/60">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-xs font-semibold text-left px-3 py-2 border border-border">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="text-xs px-3 py-2 border border-border">{children}</td>
        ),
        tr: ({ children }) => (
          <tr className="even:bg-muted/20">{children}</tr>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
