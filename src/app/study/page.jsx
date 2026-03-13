import Link from "next/link";

const categories = [
  { id: "javascript", label: "JavaScript" },
  { id: "react", label: "React" },
  { id: "nextjs", label: "Next.js" },
  { id: "algorithm", label: "알고리즘" },
  { id: "database", label: "데이터베이스" },
  { id: "etc", label: "기타" },
];

export default function StudyPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">학습 주제 선택</h1>
      <p className="text-zinc-500 mb-8">어떤 주제로 학습할까요?</p>

      <div className="grid grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/study/chat?category=${cat.id}`}
            className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100 hover:border-zinc-300 transition-colors"
          >
            <div className="font-semibold">{cat.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/study/review"
          className="inline-block bg-zinc-900 text-white px-6 py-3 rounded-lg text-sm"
        >
          코드 리뷰 요청하기
        </Link>
      </div>
    </div>
  );
}
