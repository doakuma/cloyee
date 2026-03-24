"use client";

import { useEffect, useState } from "react";

export function useInAppBrowser() {
  const [inAppInfo, setInAppInfo] = useState({
    isInApp: false,
    isIOS: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isInApp =
      /KAKAOTALK|Instagram|NAVER|Line|FB_IAB|FB4A|FBIOS|NaverApp/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    if (isInApp) {
      setInAppInfo({ isInApp: true, isIOS });
    }
  }, []);

  const openInChrome = () => {
    window.location.href = `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end`;
    setTimeout(() => {
      window.location.href = window.location.href;
    }, 1500);
  };

  return { ...inAppInfo, openInChrome };
}
