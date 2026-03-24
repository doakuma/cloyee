"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useInAppBrowser } from "@/hooks/useInAppBrowser";

function LoginContent() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [tab, setTab] = useState("oauth"); // "oauth" | "email" | "magic"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: "error"|"success", text }
  const { isInApp, isIOS, openInChrome } = useInAppBrowser();

  useEffect(() => {
    if (isInApp && isIOS) setTab("magic");
  }, [isInApp, isIOS]);

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleGitHubLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleEmailLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // 계정 없으면 회원가입 시도
      if (error.message.includes("Invalid login credentials")) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setMessage({ type: "error", text: signUpError.message });
        } else {
          setMessage({ type: "success", text: "가입 확인 이메일을 보냈어요. 메일을 확인해주세요!" });
        }
      } else {
        setMessage({ type: "error", text: error.message });
      }
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "로그인 링크를 이메일로 보냈어요. 메일을 확인해주세요!" });
    }
    setLoading(false);
  }

  const tabs = [
    { id: "oauth", label: "소셜" },
    { id: "email", label: "이메일" },
    { id: "magic", label: "링크" },
  ];

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

        {/* 인앱 브라우저 경고 배너 */}
        {isInApp && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
            {isIOS ? (
              <>
                <p className="font-medium text-yellow-800">
                  앱 내 브라우저에서는 Google 로그인을 사용할 수 없어요.
                </p>
                <p className="mt-1 text-yellow-700">
                  아래 이메일 링크로 로그인하거나, Safari에서 직접 열어주세요.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-yellow-800">
                  앱 내 브라우저에서는 Google 로그인이 제한됩니다.
                </p>
                <button
                  onClick={openInChrome}
                  className="mt-2 w-full rounded-md border border-yellow-300 bg-yellow-100 px-3 py-2 font-medium text-yellow-800 transition-colors hover:bg-yellow-200"
                >
                  Chrome에서 열기 →
                </button>
              </>
            )}
          </div>
        )}

        {/* 탭 */}
        <div className="w-full">
          <div className="flex rounded-xl border border-border overflow-hidden mb-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setMessage(null); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 에러/성공 메시지 */}
          {(authError || message) && (
            <p className={`text-sm text-center mb-3 ${
              message?.type === "success" ? "text-green-600" : "text-destructive"
            }`}>
              {authError ? `로그인 실패: ${authError}` : message?.text}
            </p>
          )}

          {/* 소셜 탭 */}
          {tab === "oauth" && (
            <div className="flex flex-col gap-3">
              {!isInApp ? (
                <>
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
                  <button
                    onClick={handleGitHubLogin}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-background hover:bg-accent px-4 py-3 text-sm font-medium transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    GitHub으로 시작하기
                  </button>
                </>
              ) : (
                <p className="text-sm text-center text-muted-foreground py-2">
                  인앱 브라우저에서는 소셜 로그인을 사용할 수 없어요.<br />
                  <span className="text-xs">이메일 또는 링크 탭을 이용해주세요.</span>
                </p>
              )}

              {/* 게스트 모드 */}
              <div className="relative flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">또는</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <a
                href="/dashboard"
                className="w-full text-center rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                게스트로 둘러보기 <span className="text-xs">(저장 안 됨)</span>
              </a>
            </div>
          )}

          {/* 이메일+비번 탭 */}
          {tab === "email" && (
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "처리 중..." : "로그인 / 회원가입"}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                계정이 없으면 자동으로 가입돼요
              </p>
            </form>
          )}

          {/* Magic Link 탭 */}
          {tab === "magic" && (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "전송 중..." : "로그인 링크 받기"}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                비밀번호 없이 이메일 링크로 로그인해요
              </p>
            </form>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          로그인 시{" "}
          <a href="/terms" className="underline underline-offset-2 hover:text-foreground">이용약관</a>
          {" "}및{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">개인정보처리방침</a>
          에 동의합니다
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
