"use client";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  async function handleGoogleLogin() {
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* 로고 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Cloyee</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            AI와 함께하는 소크라테스식 코딩 학습<br />
            질문에 답하며 스스로 성장하세요
          </p>
        </div>

        {/* 기능 소개 */}
        <div className="w-full space-y-2.5">
          {[
            { emoji: "💬", title: "대화형 학습", desc: "AI가 질문을 통해 개념을 이끌어냅니다" },
            { emoji: "🔍", title: "코드 리뷰", desc: "내 코드를 대화하며 개선해나갑니다" },
            { emoji: "📈", title: "성장 기록", desc: "학습 기록과 통계로 성장을 확인합니다" },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <span className="text-lg">{emoji}</span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-background hover:bg-accent px-4 py-3 text-sm font-medium transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Google로 시작하기
        </button>

        <p className="text-xs text-muted-foreground text-center">
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
        </p>
      </div>
    </div>
  );
}
