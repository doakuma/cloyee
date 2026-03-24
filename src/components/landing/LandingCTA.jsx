"use client";

import Link from "next/link";
import GoogleLoginButton from "@/components/landing/GoogleLoginButton";
import { useInAppBrowser } from "@/hooks/useInAppBrowser";

export default function LandingCTA({ className }) {
  const { isInApp, isIOS, openInChrome } = useInAppBrowser();

  if (isInApp) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
        {isIOS ? (
          <>
            <p className="font-medium text-yellow-800">
              앱 내 브라우저에서는 Google 로그인을 사용할 수 없어요.
            </p>
            <p className="mt-1 text-yellow-700">
              Safari에서 열거나 아래 버튼으로 로그인해주세요.
            </p>
            <Link
              href="/login"
              className="mt-2 block w-full rounded-md border border-yellow-300 bg-yellow-100 px-3 py-2 text-center font-medium text-yellow-800 transition-colors hover:bg-yellow-200"
            >
              이메일 링크로 로그인 →
            </Link>
          </>
        ) : (
          <>
            <p className="font-medium text-yellow-800">
              앱 내 브라우저에서는 Google 로그인이 제한됩니다.
            </p>
            <button
              onClick={openInChrome}
              className="mt-2 w-full rounded-md border border-yellow-300 bg-yellow-100 px-3 py-2 font-medium text-yellow-800 transition-colors hover:bg-yellow-200"
            >
              Chrome에서 열기 →
            </button>
          </>
        )}
      </div>
    );
  }

  return <GoogleLoginButton className={className} />;
}
