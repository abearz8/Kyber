"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import { track } from "@/lib/analytics";
import OnboardingFrame from "./OnboardingFrame";
import SyllabusDropzone from "@/components/upload/SyllabusDropzone";
import ReadingSyllabi from "@/components/upload/ReadingSyllabi";
import { useSyllabusParser } from "@/components/upload/useSyllabusParser";
import { PrimaryButton, TextLink, Card, ChevronRight } from "@/components/shared/ui";

export type LoadSource = "demo" | "upload";

interface Props {
  onLoad: (courses: Course[], source: LoadSource) => void;
  onBack?: () => void;
}

/** Last onboarding step: add syllabi (or try a sample semester). */
export default function OnboardingScreen({ onLoad, onBack }: Props) {
  const parser = useSyllabusParser();
  const [loading, setLoading] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const parsing = parser.stage === "parsing";

  async function loadDemo(program: "hba1" | "data_science") {
    setLoading(program);
    track.onboardingStarted();
    track.demoSemesterSelected(program, "both");

    let s1: Course[];
    let s2: Course[];
    if (program === "hba1") {
      s1 = (await import("@/data/fixtures/hba1-s1")).hba1S1;
      s2 = (await import("@/data/fixtures/hba1-s2")).hba1S2;
    } else {
      s1 = (await import("@/data/fixtures/ds-s1")).dsS1;
      s2 = (await import("@/data/fixtures/ds-s2")).dsS2;
    }

    // Tag each course with its semester so the Courses page can switch between them
    const courses: Course[] = [
      ...s1.map((c) => ({ ...c, semester: 1 as const })),
      ...s2.map((c) => ({ ...c, semester: 2 as const })),
    ];

    track.semesterLoaded("demo", courses.length);
    onLoad(courses, "demo");
    setLoading(null);
  }

  async function build() {
    track.onboardingStarted();
    const courses = await parser.start();
    if (courses.length) {
      track.semesterLoaded("upload", courses.length);
      onLoad(courses, "upload");
    }
  }

  if (parsing) {
    return (
      <OnboardingFrame>
        <ReadingSyllabi files={parser.files} />
      </OnboardingFrame>
    );
  }

  return (
    <OnboardingFrame
      lastStep
      stepName="Your syllabi"
      onBack={onBack}
      title="Add your syllabi."
      sub={<>Kyber finds <span className="hi">every deadline, exam and grade weight</span>.</>}
      footer={<PrimaryButton label="Build my semester" onClick={build} disabled={!parser.files.length || !!loading} />}
    >
      <div style={{ marginTop: 22 }}>
        <SyllabusDropzone files={parser.files} onPick={parser.pick} onRemove={parser.remove} />
      </div>

      {parser.error && (
        <p style={{ color: "#B23B3B", fontSize: 15, marginTop: 14, textAlign: "center", fontWeight: 500 }}>{parser.error}</p>
      )}

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        {showSamples ? (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            <SampleButton label="HBA1 — Business" sub="9 courses · both semesters" loading={loading === "hba1"} onClick={() => loadDemo("hba1")} />
            <SampleButton label="Data Science — 1st Year" sub="7 courses · both semesters" loading={loading === "data_science"} onClick={() => loadDemo("data_science")} />
          </div>
        ) : (
          <TextLink label="No syllabus handy? Try a sample" onClick={() => setShowSamples(true)} />
        )}
      </div>
    </OnboardingFrame>
  );
}

function SampleButton({ label, sub, loading, onClick }: { label: string; sub: string; loading: boolean; onClick: () => void }) {
  return (
    <Card pad="12px 14px" onClick={loading ? undefined : onClick} style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 16, opacity: loading ? 0.7 : 1 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>{loading ? "Loading…" : label}</div>
        <div style={{ fontSize: 15.5, fontWeight: 500, color: "var(--text-2)", marginTop: 2 }}>{sub}</div>
      </div>
      <ChevronRight />
    </Card>
  );
}
