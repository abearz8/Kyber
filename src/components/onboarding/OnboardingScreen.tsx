"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import { track } from "@/lib/analytics";
import SyllabusUploader from "@/components/upload/SyllabusUploader";

interface Props {
  onLoad: (courses: Course[]) => void;
}

export default function OnboardingScreen({ onLoad }: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

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
    <div className="flex flex-col h-full px-6 pt-16 pb-10">
      {/* Logo + headline */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "#e9a319",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>

        <div>
          <h1
            style={{
              fontFamily: "Quicksand, sans-serif",
              fontWeight: 700,
              fontSize: 28,
              color: "var(--text)",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Kyber
          </h1>
          <p
            style={{
              color: "var(--text-2)",
              fontSize: 15,
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            Your semester. One clear plan.
          </p>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {["Courses", "Deadlines", "Now", "Plan"].map((label) => (
            <span
              key={label}
              style={{
                background: "var(--surface-2)",
                color: "var(--text-2)",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Demo options */}
      <div className="flex flex-col gap-3 mt-8">
        <p style={{ color: "var(--text-3)", fontSize: 12, textAlign: "center", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Try a demo year
        </p>

        <DemoButton
          label="HBA1"
          sub="9 courses · both semesters"
          color="#e9a319"
          loading={loading === "hba1"}
          onClick={() => loadDemo("hba1")}
        />
        <DemoButton
          label="Data Science — 1st Year"
          sub="7 courses · both semesters"
          color="#38bdf8"
          loading={loading === "data_science"}
          onClick={() => loadDemo("data_science")}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "4px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ color: "var(--text-3)", fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button
          onClick={() => {
            track.onboardingStarted();
            setShowUpload(true);
          }}
          className="rounded-xl py-3 transition-opacity"
          style={{
            background: "var(--surface-2)",
            color: "var(--text)",
            fontFamily: "Quicksand, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            border: "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          Upload my own syllabi
        </button>
      </div>

      <p style={{ color: "var(--text-3)", fontSize: 11, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
        Beta · anonymous analytics · no account needed
      </p>
    </div>
  );
}

function DemoButton({
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
      className="flex items-center gap-3 rounded-xl p-4 transition-opacity text-left"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      <div className="flex-1 min-w-0">
        <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", margin: 0 }}>
          {loading ? "Loading…" : label}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>{sub}</p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}
