import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Sidebar from "@/components/common/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cloyee",
  description: "AI 기반 코딩 학습 도우미",
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const hideSidebar =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding");

  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex min-h-screen bg-background">
          {!hideSidebar && <Sidebar />}
          <main className={`flex-1 overflow-y-auto ${hideSidebar ? "" : "pb-16 md:pb-0"}`}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
