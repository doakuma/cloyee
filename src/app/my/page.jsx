"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const avatarUrl = user?.user_metadata?.avatar_url;
  const name = user?.user_metadata?.full_name ?? user?.email ?? "사용자";
  const email = user?.email ?? "";

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">마이페이지</h1>

      <Card className="mb-4">
        <CardContent className="flex items-center gap-4 pt-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User size={28} className="text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-lg truncate">{name}</p>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
        onClick={handleLogout}
      >
        <LogOut size={15} />
        로그아웃
      </Button>
    </div>
  );
}
