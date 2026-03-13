"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, ClipboardList, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "홈", icon: LayoutDashboard },
  { href: "/study", label: "학습", icon: BookOpen },
  { href: "/history", label: "기록", icon: ClipboardList },
  { href: "/growth", label: "성장", icon: TrendingUp },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
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

      {/* 하단 */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">Cloyee v0.1</p>
      </div>
    </aside>
  );
}
