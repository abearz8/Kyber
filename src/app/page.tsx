"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import MobileShell from "@/components/shared/MobileShell";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import SemesterReveal from "@/components/onboarding/SemesterReveal";
import type { Course } from "@/lib/types";

export default function Home() {
  const { state, loadCourses, dispatch } = useStore();
  const router = useRouter();
  // Hold freshly-loaded courses locally so we can show the reveal before
  // committing them to the store (committing would trigger the /app redirect).
  const [pending, setPending] = useState<Course[] | null>(null);

  // If a semester is already loaded (returning user), skip straight to the app.
  useEffect(() => {
    if (state.courses.length > 0 && state.hasOnboarded) {
      router.replace("/app");
    }
  }, [state.courses.length, state.hasOnboarded, router]);

  function handleLoad(courses: Course[]) {
    setPending(courses);
  }

  function enterApp() {
    if (!pending) return;
    loadCourses(pending);
    dispatch({ type: "SET_ONBOARDED", value: true });
    router.push("/app");
  }

  if (state.courses.length > 0 && state.hasOnboarded) return null; // redirecting

  return (
    <MobileShell>
      {pending ? (
        <SemesterReveal courses={pending} onEnter={enterApp} />
      ) : (
        <OnboardingScreen onLoad={handleLoad} />
      )}
    </MobileShell>
  );
}
