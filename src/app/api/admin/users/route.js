import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  try {
    const { data: profiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles?.length) {
      return NextResponse.json([]);
    }

    const { data: authUsers, error: authError } = await serviceClient.auth.admin.listUsers();

    if (authError) {
      console.error("Auth list error:", authError);
    }

    const emailMap = {};
    authUsers?.users?.forEach((user) => {
      emailMap[user.id] = user.email;
    });

    const { data: sessions, error: sessionsError } = await serviceClient
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

/**
 * PATCH /api/admin/users
 * Body: { userId: string, is_admin: boolean }
 * Toggle admin status for a user.
 */
export async function PATCH(request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { user, serviceClient } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, is_admin } = body;
  if (!userId || typeof is_admin !== "boolean") {
    return NextResponse.json({ error: "userId and is_admin required" }, { status: 400 });
  }

  // Prevent self-demotion
  if (userId === user.id && !is_admin) {
    return NextResponse.json({ error: "Cannot remove your own admin privileges" }, { status: 400 });
  }

  const { error } = await serviceClient
    .from("profiles")
    .update({ is_admin })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(serviceClient, user.id, "user.toggle_admin", {
    targetType: "user",
    targetId: userId,
    details: { is_admin },
  });

  return NextResponse.json({ ok: true });
}
