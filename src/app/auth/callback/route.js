import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[auth/callback] exchangeCodeForSession:", error ? `❌ ${error.message}` : "✅ 성공");
    if (!error) {
      const user = exchangeData.user;
      if (user) {
        // exchangeCodeForSession에서 받은 user를 직접 사용 (getUser() 재호출 불필요)
        const { data: firstProfile } = await supabase
          .from("profiles")
          .select("onboarding_done")
          .eq("id", user.id)
          .maybeSingle();

        // null이면 트리거가 아직 row 생성 중일 수 있음 — 한 번 재시도
        let profile = firstProfile;
        if (profile === null) {
          await new Promise((r) => setTimeout(r, 600));
          const { data: retryProfile } = await supabase
            .from("profiles")
            .select("onboarding_done")
            .eq("id", user.id)
            .maybeSingle();
          profile = retryProfile;
        }

        // onboarding_done이 명시적으로 true일 때만 홈으로 이동
        return NextResponse.redirect(
          profile?.onboarding_done === true ? `${origin}${next}` : `${origin}/onboarding`
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  console.log("[auth/callback] ❌ code 파라미터 없음");
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
