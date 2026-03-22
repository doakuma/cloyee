import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import GoogleLoginButton from "@/components/landing/GoogleLoginButton";
import { Brain, BarChart2, TrendingUp, Map, MessageSquare, BookOpen, GraduationCap, Briefcase, Code2 } from "lucide-react";

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
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          또는 이메일 / 게스트로 시작하기
        </Link>
      </section>

      {/* ── 기능 소개 ── */}
      <section id="features" className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-10">핵심 기능</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: Brain,
              title: "소크라테스식 학습",
              desc: "AI가 답을 주는 게 아니라 질문으로 스스로 생각하게 유도해요",
            },
            {
              icon: BarChart2,
              title: "이해도 점수 측정",
              desc: "대화가 끝나면 0~100점 이해도 점수를 자동으로 산출해요",
            },
            {
              icon: TrendingUp,
              title: "성장 시각화",
              desc: "레벨, streak, 카테고리별 학습량을 대시보드에서 한눈에 확인해요",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-muted/30 px-6 py-7 text-left"
            >
              <Icon size={28} className="text-primary mb-4" />
              <p className="font-semibold text-base mb-2">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="px-6 pb-20 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-10">이렇게 사용해요</h2>
        <div className="space-y-6">
          {[
            {
              step: "1",
              icon: Map,
              title: "카테고리 선택",
              desc: "React, Next.js, 알고리즘 등 배우고 싶은 주제를 선택하세요",
            },
            {
              step: "2",
              icon: MessageSquare,
              title: "AI와 대화 학습",
              desc: "소크라테스식 질문으로 개념을 직접 이끌어내며 진짜 이해에 도달해요",
            },
            {
              step: "3",
              icon: BookOpen,
              title: "기록 & 복습",
              desc: "학습 내용이 자동으로 저장되고 대시보드에서 성장을 확인해요",
            },
          ].map(({ step, icon: Icon, title, desc }, idx, arr) => (
            <div key={step}>
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {step}
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon size={15} className="text-muted-foreground" />
                    <p className="font-semibold text-sm">{title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div className="ml-4 mt-2 mb-0 w-px h-5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-10">이런 분들께 맞아요</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: GraduationCap,
              title: "부트캠프 수강생",
              desc: "강의만 듣고 끝내지 말고, AI와 대화하며 진짜 이해로 넘어가세요",
            },
            {
              icon: Briefcase,
              title: "취준 개발자",
              desc: "면접 전 개념 정리를 AI 튜터와 함께. 말로 설명할 수 있어야 진짜 실력이에요",
            },
            {
              icon: Code2,
              title: "현직 개발자",
              desc: "새 기술 스택을 빠르게 내 것으로. 소크라테스식 문답으로 단단하게 쌓아요",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-muted/30 px-6 py-7 text-left"
            >
              <Icon size={28} className="text-primary mb-4" />
              <p className="font-semibold text-base mb-2">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 하단 CTA ── */}
      <section className="px-6 pb-24 text-center">
        <p className="text-muted-foreground text-sm mb-5">지금 바로 시작해보세요</p>
        <GoogleLoginButton className="inline-flex items-center justify-center gap-3 rounded-xl bg-foreground text-background px-8 py-3.5 text-sm font-semibold hover:opacity-85 transition-opacity" />
        <div className="mt-3">
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          >
            또는 이메일 / 게스트로 시작하기
          </Link>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-border py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Cloyee</span>
        <div className="flex gap-4">
          <a href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</a>
          <a href="/terms" className="hover:text-foreground transition-colors">이용약관</a>
        </div>
        <span>© 2026 Cloyee. All rights reserved.</span>
      </footer>

    </div>
  );
}
