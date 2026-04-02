import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/categories
 * Body: { name: string, icon?: string }
 * Create a default (is_default=true) category. Admin only.
 */
export async function POST(request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { user, serviceClient } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.length > 20) {
    return NextResponse.json({ error: "name must be 20 characters or fewer" }, { status: 400 });
  }

  const icon = body.icon?.trim() || null;

  const { data, error } = await serviceClient
    .from("categories")
    .insert({ name, icon, user_id: null, is_default: true })
    .select("id, name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(serviceClient, user.id, "category.create", {
    targetType: "category",
    targetId: data.id,
    details: { name, icon },
  });

  return NextResponse.json(data, { status: 201 });
}

/**
 * DELETE /api/admin/categories?id=<categoryId>
 * Delete a category by ID. Admin only.
 */
export async function DELETE(request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { user, serviceClient } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
  }

  // Fetch name for audit record before deleting
  const { data: cat } = await serviceClient
    .from("categories")
    .select("name, is_default")
    .eq("id", id)
    .single();

  const { error } = await serviceClient
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(serviceClient, user.id, "category.delete", {
    targetType: "category",
    targetId: id,
    details: { name: cat?.name, is_default: cat?.is_default },
  });

  return NextResponse.json({ ok: true });
}
