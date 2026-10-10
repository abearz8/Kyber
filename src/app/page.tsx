"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import MobileShell from "@/components/shared/MobileShell";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import type { Course } from "@/lib/types";

export default function Home() {
  const { state, loadCourses } = useStore();
  const router = useRouter();

  // If courses already loaded, skip onboarding
  useEffect(() => {
    if (state.courses.length > 0) {
      router.replace("/app");
    }
  }, [state.courses.length, router]);

  function handleLoad(courses: Course[]) {
    loadCourses(courses);
    router.push("/app");
  }

  if (state.courses.length > 0) return null; // redirecting

  return (
    <MobileShell>
      <OnboardingScreen onLoad={handleLoad} />
    </MobileShell>
  );
}
