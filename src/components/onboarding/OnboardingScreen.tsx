"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import { track } from "@/lib/analytics";
import SyllabusUploader from "@/components/upload/SyllabusUploader";
import KyberLogo from "@/components/shared/KyberLogo";

interface Props {
  onLoad: (courses: Course[]) => void;
}

export default function OnboardingScreen({ onLoad }: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);

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
    onLoad(courses);
    setLoading(null);
  }

  if (showUpload) {
    return (
      <SyllabusUploader
        onDone={(courses) => {
          track.semesterLoaded("upload", courses.length);
          onLoad(courses);
        }}
        onCancel={() => setShowUpload(false)}
      />
    );
  }

  return (
    <div
      className="flex flex-col h-full px-6 pt-14 pb-8"
      style={{ background: "var(--bg-gradient)" }}
    >
      {/* Wordmark */}
      <KyberLogo size={34} wordmark wordmarkSize={24} />

      {/* Headline */}
      <div style={{ marginTop: 34 }}>
        <h1
          style={{
            fontFamily: "var(--ios-font)",
            fontWeight: 800,
            fontSize: 40,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Let&apos;s build your semester.
        </h1>
        <p
          style={{
            color: "var(--text-2)",
            fontSize: 17,
            lineHeight: 1.45,
            margin: "16px 0 0",
          }}
        >
          Drop in your syllabi and Kyber handles the rest. No deadlines missed, no surprises.
        </p>
      </div>

      {/* Drop zone */}
      <button
        onClick={() => {
          track.onboardingStarted();
          setShowUpload(true);
        }}
        className="w-full text-center"
        style={{
          marginTop: 40,
          background: "#f6ead6",
          border: "none",
          borderRadius: 24,
          padding: "40px 24px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "#f0dcbc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--orange-cta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M12 18v-6" />
            <path d="M9 15l3-3 3 3" />
          </svg>
        </span>
        <span>
          <span style={{ display: "block", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
            Drop your syllabi here
          </span>
          <span style={{ display: "block", fontSize: 14, color: "var(--text-2)", marginTop: 6 }}>
            or tap to browse, add as many as you have
          </span>
        </span>
      </button>

      {/* Sample link / options */}
      <div className="flex-1 flex flex-col items-center justify-end" style={{ gap: 12 }}>
        {showSamples ? (
          <div className="w-full flex flex-col gap-2" style={{ maxWidth: 320, margin: "0 auto" }}>
            <SampleButton
              label="HBA1 — Business"
              sub="9 courses · both semesters"
              color="var(--c1)"
              loading={loading === "hba1"}
              onClick={() => loadDemo("hba1")}
            />
            <SampleButton
              label="Data Science — 1st Year"
              sub="7 courses · both semesters"
              color="var(--c2)"
              loading={loading === "data_science"}
              onClick={() => loadDemo("data_science")}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowSamples(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--orange-cta)",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "underline",
              textUnderlineOffset: 3,
              padding: 8,
            }}
          >
            test with a sample
          </button>
        )}
      </div>
    </div>
  );
}

function SampleButton({
  label,
  sub,
  color,
  loading,
  onClick,
}: {
  label: string;
  sub: string;
  color: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-3 text-left"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: "14px 16px",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span className="flex-1" style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
          {loading ? "Loading…" : label}
        </span>
        <span style={{ display: "block", fontSize: 13, color: "var(--text-3)" }}>{sub}</span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}
