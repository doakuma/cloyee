import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    // service role으로 모든 프로필 조회 (RLS 우회)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles?.length) {
      return NextResponse.json([]);
    }

    // auth.users에서 이메일 조회
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Auth list error:", authError);
      // 이메일 조회 실패해도 프로필은 반환 (이메일 없이)
    }

    const emailMap = {};
    authUsers?.users?.forEach((user) => {
      emailMap[user.id] = user.email;
    });

    // 완료 세션 수 집계
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("user_id")
      .eq("is_complete", true)
      .in("user_id", profiles.map((p) => p.id));

    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    const sessionCountMap = {};
    sessions?.forEach(({ user_id }) => {
      sessionCountMap[user_id] = (sessionCountMap[user_id] ?? 0) + 1;
    });

    const users = profiles.map((p) => ({
      ...p,
      email: emailMap[p.id] ?? "—",
      session_count: sessionCountMap[p.id] ?? 0,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
