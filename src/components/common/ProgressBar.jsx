"use client";

import { AppProgressBar } from "next-nprogress-bar";

export default function ProgressBar() {
  return (
    <AppProgressBar
      height="2px"
      color="hsl(var(--primary))"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
