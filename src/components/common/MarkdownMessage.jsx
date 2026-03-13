import ReactMarkdown from "react-markdown";

const components = {
  // 코드 블록
  pre({ children }) {
    return (
      <pre className="bg-muted font-mono rounded-lg p-3 text-xs overflow-x-auto my-2">
        {children}
      </pre>
    );
  },
  // 인라인 코드
  code({ inline, children, ...props }) {
    if (inline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
          {children}
        </code>
      );
    }
    return <code className="font-mono text-xs" {...props}>{children}</code>;
  },
  // 굵게
  strong({ children }) {
    return <strong className="font-semibold">{children}</strong>;
  },
  // 이탤릭
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
  // 단락
  p({ children }) {
    return <p className="mb-3 last:mb-0">{children}</p>;
  },
  // 순서 없는 목록
  ul({ children }) {
    return <ul className="list-disc list-outside pl-5 space-y-1 mb-3">{children}</ul>;
  },
  // 순서 있는 목록
  ol({ children }) {
    return <ol className="list-decimal list-outside pl-5 space-y-1 mb-3">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  // 링크
  a({ href, children }) {
    return (
      <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

export default function MarkdownMessage({ content }) {
  return (
    <ReactMarkdown components={components}>
      {content}
    </ReactMarkdown>
  );
}
