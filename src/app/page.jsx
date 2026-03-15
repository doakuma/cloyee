import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import GoogleLoginButton from "@/components/landing/GoogleLoginButton";

// 로그인된 유저는 대시보드로 리다이렉트
export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 max-w-3xl mx-auto">
        <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">Cloyee</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
          나의 성장을 함께 기록하는<br />AI 스터디메이트
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mb-10">
          소크라테스식 대화로 배우고, 코드 리뷰로 성장하고,<br className="hidden sm:block" />
          기록으로 쌓아가세요
        </p>
        <GoogleLoginButton className="flex items-center justify-center gap-3 rounded-xl bg-foreground text-background px-8 py-3.5 text-sm font-semibold hover:opacity-85 transition-opacity" />
      </section>

      {/* ── 기능 소개 ── */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              emoji: "🗺",
              title: "로드맵 기반 학습",
              desc: "나에게 맞는 학습 경로를 설정하고 체계적으로 성장하세요",
            },
            {
              emoji: "💬",
              title: "소크라테스식 대화",
              desc: "일방적인 강의 대신, Cloyee와 대화하며 진짜 이해에 도달하세요",
            },
            {
              emoji: "📈",
              title: "성장 시각화",
              desc: "레벨, streak, 카테고리별 학습량으로 나의 성장을 한눈에 확인하세요",
            },
          ].map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-muted/30 px-6 py-7 text-left"
            >
              <span className="text-3xl mb-4 block">{emoji}</span>
              <p className="font-semibold text-base mb-2">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 pb-20 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-10">이렇게 사용해요</h2>
        <div className="space-y-6">
          {[
            {
              step: "1",
              title: "로드맵 설정",
              desc: "직군, 경력, 목표를 입력하면 맞춤 학습 경로 생성",
            },
            {
              step: "2",
              title: "Cloyee와 대화",
              desc: "소크라테스식 문답으로 개념을 깊게 이해",
            },
            {
              step: "3",
              title: "성장 확인",
              desc: "누적된 학습이 레벨과 기록으로 시각화",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-5">
              <div className="shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {step}
              </div>
              <div className="pt-1">
                <p className="font-semibold text-sm mb-0.5">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 하단 CTA ── */}
      <section className="px-6 pb-24 text-center">
        <p className="text-muted-foreground text-sm mb-5">지금 바로 시작해보세요</p>
        <GoogleLoginButton className="inline-flex items-center justify-center gap-3 rounded-xl bg-foreground text-background px-8 py-3.5 text-sm font-semibold hover:opacity-85 transition-opacity" />
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-border py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Cloyee</span>
        <div className="flex gap-4">
          <a href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</a>
          <a href="/terms" className="hover:text-foreground transition-colors">이용약관</a>
        </div>
      </footer>

    </div>
  );
}
