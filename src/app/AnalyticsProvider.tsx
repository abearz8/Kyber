"use client";

import { useEffect } from "react";
import { initAnalytics, track } from "@/lib/analytics";

interface Props {
  posthogKey: string;
  posthogHost: string;
  children: React.ReactNode;
}

export default function AnalyticsProvider({ posthogKey, posthogHost, children }: Props) {
  useEffect(() => {
    if (posthogKey) {
      initAnalytics(posthogKey, posthogHost);
      track.appOpened();
    }
  }, [posthogKey, posthogHost]);

  return <>{children}</>;
}
