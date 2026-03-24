import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/categories", label: "카테고리" },
  { href: "/admin/feedback", label: "피드백" },
  { href: "/admin/docs", label: "문서" },
];

export default async function AdminLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* 상단 네비 */}
      <header className="border-b border-border bg-white dark:bg-neutral-900 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-sm tracking-tight">Cloyee Admin</span>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
