"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import MobileShell from "@/components/shared/MobileShell";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import OnboardingQuestionnaire from "@/components/onboarding/OnboardingQuestionnaire";
import SemesterReveal from "@/components/onboarding/SemesterReveal";
import type { Course, UserProfile, PersonalEvent, PersonalEventKind } from "@/lib/types";

type Phase = "questionnaire" | "upload";

// Map commitment type ids to PersonalEventKind
function commitmentKind(typeId: string): PersonalEventKind {
  if (typeId === "work") return "work";
  if (typeId === "sports") return "sport";
  if (typeId === "appointments") return "appointment";
  return "personal";
}

// Parse "9:00 AM" → "09:00", "11:30 PM" → "23:30"
function parseTime(s: string): string {
  const m = s.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return "09:00";
  let h = parseInt(m[1]);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

// Parse "1 hr", "30 min", "1.5 hr" → minutes
function parseDuration(s: string): number {
  const hrMatch = s.match(/^(\d+(?:\.\d+)?)\s*hr/);
  if (hrMatch) return Math.round(parseFloat(hrMatch[1]) * 60);
  const minMatch = s.match(/^(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1]);
  if (s.startsWith("3+")) return 210;
  return 60;
}

// Add HH:MM + minutes → HH:MM
function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// ISO date string for a weekday (0=Mon…6=Sun) within the next 28 days
function datesForWeekday(dayIndex: number, weeksAhead: number): string[] {
  const today = new Date();
  const results: string[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // JS getDay: 0=Sun,1=Mon…6=Sat; our index: 0=Mon…6=Sun
    const jsDay = d.getDay();
    const ourDay = jsDay === 0 ? 6 : jsDay - 1;
    if (ourDay === dayIndex) results.push(d.toISOString().slice(0, 10));
  }
  return results.slice(0, weeksAhead);
}

// Derive target grade from goals
function targetGradeFromGoals(goals: string[]): number | null {
  if (goals.includes("strong") || goals.includes("protect")) return 85;
  if (goals.includes("improve")) return 75;
  return null;
}

export default function Home() {
  const { state, loadCourses, dispatch } = useStore();
  const router = useRouter();

  // Derive initial phase from stored profile
  const [phase, setPhase] = useState<Phase>(() =>
    state.userProfile ? "upload" : "questionnaire"
  );

  // Hold freshly-loaded courses locally so we can show the reveal before
  // committing them to the store (committing would trigger the /app redirect).
  const [pending, setPending] = useState<Course[] | null>(null);

  // Re-derive phase once the store hydrates (state.userProfile starts null from SSR default)
  useEffect(() => {
    if (phase === "questionnaire" && state.userProfile) {
      setPhase("upload");
    }
  }, [state.userProfile, phase]);

  // If a semester is already loaded (returning user), skip straight to the app.
  useEffect(() => {
    if (state.courses.length > 0 && state.hasOnboarded) {
      router.replace("/app");
    }
  }, [state.courses.length, state.hasOnboarded, router]);

  function handleProfileComplete(profile: UserProfile) {
    dispatch({ type: "SET_USER_PROFILE", profile });
    setPhase("upload");
  }

  function handleLoad(courses: Course[]) {
    const profile = state.userProfile;
    let mapped = courses;

    if (profile) {
      const palette = profile.palette;
      const targetGrade = targetGradeFromGoals(profile.goals);

      // Apply palette colors and goal-based target grades
      mapped = courses.map((c, i) => ({
        ...c,
        color: palette.length ? palette[i % palette.length] : c.color,
        ...(targetGrade !== null ? { targetGrade } : {}),
      }));
    }

    setPending(mapped);
  }

  function enterApp() {
    if (!pending) return;
    const profile = state.userProfile;

    // Convert commitments with full details to PersonalEvents for the next 4 weeks
    if (profile?.commitments) {
      for (const c of profile.commitments) {
        if (!c.days.length || !c.startTime || !c.duration) continue;
        const startHHMM = parseTime(c.startTime);
        const durMins = parseDuration(c.duration);
        const endHHMM = addMinutes(startHHMM, durMins);
        const kind = commitmentKind(c.type);

        for (const dayIdx of c.days) {
          const dates = datesForWeekday(dayIdx, 4);
          for (const date of dates) {
            const event: PersonalEvent = {
              id: `commitment-${c.type}-${dayIdx}-${date}`,
              kind,
              title: c.title,
              date,
              start: startHHMM,
              end: endHHMM,
            };
            dispatch({ type: "ADD_PERSONAL_EVENT", event });
          }
        }
      }
    }

    loadCourses(pending);
    dispatch({ type: "SET_ONBOARDED", value: true });
    router.push("/app");
  }

  if (state.courses.length > 0 && state.hasOnboarded) return null; // redirecting

  return (
    <MobileShell>
      {pending ? (
        <SemesterReveal courses={pending} onEnter={enterApp} />
      ) : phase === "questionnaire" ? (
        <OnboardingQuestionnaire onComplete={handleProfileComplete} />
      ) : (
        <OnboardingScreen onLoad={handleLoad} />
      )}
    </MobileShell>
  );
}
