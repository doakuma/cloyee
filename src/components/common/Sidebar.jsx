"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, ClipboardList, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/", label: "홈", icon: LayoutDashboard },
  { href: "/study", label: "학습", icon: BookOpen },
  { href: "/history", label: "기록", icon: ClipboardList },
  { href: "/growth", label: "성장", icon: TrendingUp },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN") {
        setVisible(true);
      }
      if (event === "SIGNED_OUT") {
        setVisible(false);
        router.push("/login");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (!visible) return null;

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex w-64 min-h-screen flex-col border-r border-border bg-background">
        {/* 로고 */}
        <div className="flex h-16 items-center px-6 border-b border-border">
          <span className="text-lg font-bold tracking-tight">Cloyee</span>
        </div>

        {/* 네비게이션 */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 하단 링크 */}
        <div className="px-4 pb-2 flex items-center gap-3">
          <Link href="/privacy" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            개인정보처리방침
          </Link>
          <span className="text-muted-foreground/40 text-[11px]">·</span>
          <Link href="/terms" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            이용약관
          </Link>
        </div>

        {/* 하단 프로필 */}
        <div className="p-3 border-t border-border">
          <Link
            href="/my"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User size={14} className="text-muted-foreground" />
              </div>
            )}
            <span className="text-sm font-medium truncate">
              {user?.user_metadata?.full_name ?? user?.email ?? "내 프로필"}
            </span>
          </Link>
        </div>
      </aside>

      {/* 모바일 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-border bg-background">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
