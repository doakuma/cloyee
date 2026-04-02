import { createServerClient } from "@supabase/ssr";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Verifies the incoming request is from an authenticated admin.
 * Returns { user, serviceClient } on success.
 * Returns a NextResponse 401/403 on failure — caller must return it immediately.
 *
 * Usage in API route:
 *   const result = await requireAdmin();
 *   if (result instanceof NextResponse) return result;
 *   const { user, serviceClient } = result;
 */
export async function requireAdmin() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceRoleClient();

  return { user, serviceClient };
}

/**
 * Logs an admin action to admin_audit_log via service role.
 * Failures are swallowed (logging must never break the primary action).
 *
 * @param {object} serviceClient - Supabase service role client
 * @param {string} actorId       - auth.users.id of the admin performing the action
 * @param {string} action        - dot-namespaced action string, e.g. 'category.delete'
 * @param {object} [opts]
 * @param {string} [opts.targetType] - e.g. 'category', 'user', 'feedback'
 * @param {string} [opts.targetId]   - id of the affected record
 * @param {object} [opts.details]    - arbitrary extra context (names, before/after values)
 */
export async function logAdminAction(serviceClient, actorId, action, opts = {}) {
  try {
    await serviceClient.from("admin_audit_log").insert({
      actor_id: actorId,
      action,
      target_type: opts.targetType ?? null,
      target_id: opts.targetId ? String(opts.targetId) : null,
      details: opts.details ?? null,
    });
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err?.message);
  }
}
