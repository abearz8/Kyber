"use client";

import { useState } from "react";
import type { Course, CourseEvent, EventType } from "@/lib/types";
import { daysUntil, relativeLabel, fmtShort } from "@/lib/dates";
import { typeLabel } from "@/lib/events";
import {
  submittedProgress,
  projectWithAssumptions,
  defaultAssumption,
  letterGrade,
} from "@/lib/grades";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";
import InsightCards from "./InsightCards";
import GradeCalculator from "./GradeCalculator";

interface Props {
  course: Course;
  onBack: () => void;
  onDelete: () => void;
}

const SEG_COLORS = ["#e9a319", "#5aa6e6", "#3faf76", "#9a938a", "#987be8", "#e0564a"];

const EVENT_DOT: Record<EventType, string> = {
  reading: "#3faf76",
  quiz: "#e9a319",
  assignment: "#5aa6e6",
  lab: "#987be8",
  exam: "#e0564a",
};

const STUDY_TILES = [
  { key: "summary", title: "Summary", caption: "Key ideas in plain language", icon: <DocIcon /> },
  { key: "practice", title: "Practice Qs", caption: "Exam-style Q&A with key", icon: <BoltIcon /> },
  { key: "flashcards", title: "Flashcards", caption: "Quick-fire recall of terms", icon: <CardsIcon /> },
  { key: "teachback", title: "Teach-back", caption: "Explain it, get probed", icon: <SpeakerIcon /> },
];

function buildStudyPrompt(course: Course, kind: string): string {
  const subjects = course.subjects.join(", ");
  const components = course.gradeComponents.map((g) => `${g.name} (${g.weight}%)`).join(", ");

  switch (kind) {
    case "summary":
      return `I'm studying ${course.title} (${course.code}), taught by ${course.instructor}. The current topic is "${course.currentTopic}".

Course subjects: ${subjects}

Please provide a comprehensive summary of "${course.currentTopic}" that includes:
- Core concepts and definitions in plain language
- Key frameworks, models, or processes
- How this topic connects to the broader course
- The 3–5 most exam-critical ideas

Keep it clear and student-friendly.`;

    case "practice":
      return `I'm preparing for exams in ${course.title} (${course.code}), taught by ${course.instructor}. Current topic: "${course.currentTopic}".

Grade breakdown: ${components}
Course subjects: ${subjects}

Generate 10 university-level practice questions for "${course.currentTopic}". For each:
1. Write the question clearly
2. Provide a detailed model answer
3. Note which concept it tests

Include a mix of short-answer, multiple-choice, and applied/case questions.`;

    case "flashcards":
      return `Create 20 flashcards for ${course.title} (${course.code}), topic: "${course.currentTopic}".

Course subjects: ${subjects}

Format each as:
CARD [#]:
Front: [term, concept, or question]
Back: [clear, concise definition or answer]

Cover key terms, formulas, frameworks, and concepts. Make each back memorable and specific.`;

    case "teachback":
      return `I'm a student in ${course.title} (${course.code}) learning "${course.currentTopic}" and I want to test my understanding by teaching it.

Recommended study method: ${course.studyMethod.name} — ${course.studyMethod.why}

Your role: Act as a rigorous professor. Start by asking me to explain one specific concept from "${course.currentTopic}". After my response, ask 2–3 targeted follow-up questions that expose gaps in my understanding. Guide me until I demonstrate real mastery. Begin now.`;

    default:
      return "";
  }
}

export default function CourseDetail({ course, onBack, onDelete }: Props) {
  const { dispatch } = useStore();
  const [calcOpen, setCalcOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const c = course.color;
  const progress = submittedProgress(course);
  const assumptions = Object.fromEntries(
    course.gradeComponents.map((gc) => [gc.id, defaultAssumption(course, gc)])
  );
  const projected = projectWithAssumptions(course, assumptions);
  const sortedEvents = [...course.events].sort((a, b) => a.date.localeCompare(b.date));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function copyPrompt(kind: string, title: string) {
    const prompt = buildStudyPrompt(course, kind);
    try {
      await navigator.clipboard.writeText(prompt);
      showToast(`✦ ${title} prompt copied`);
    } catch {
      showToast("Copy failed — try long-pressing");
    }
    track.courseSectionViewed(course.code, `study_${kind}`);
  }

  function addEvent(e: CourseEvent) {
    dispatch({
      type: "ADD_PERSONAL_EVENT",
      event: { id: `evt-${e.id}`, kind: "study", title: e.title, date: e.date },
    });
    showToast("✦ Added to your plan");
  }

  function addAll() {
    for (const e of sortedEvents) {
      dispatch({
        type: "ADD_PERSONAL_EVENT",
        event: { id: `evt-${e.id}`, kind: "study", title: e.title, date: e.date },
      });
    }
    showToast(`✦ Added ${sortedEvents.length} dates to your plan`);
  }

  if (calcOpen) {
    return <GradeCalculator course={course} onBack={() => setCalcOpen(false)} />;
  }

  return (
    <div className="flex flex-col h-full" style={{ position: "relative", minHeight: 0 }}>
      {/* Back */}
      <div style={{ padding: "14px 16px 4px", flexShrink: 0 }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1"
          style={{
            background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)",
            borderRadius: 999, padding: "7px 14px 7px 10px", cursor: "pointer", color: c, fontWeight: 600, fontSize: 15,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Courses
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "8px 16px 120px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Header card */}
          <Card>
            <div className="eyebrow">{course.code}</div>
            <h1 style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em", color: "var(--ink)", margin: "4px 0 4px" }}>
              {course.title}
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-2)", margin: "0 0 16px" }}>
              {course.instructor} · {course.term}
            </p>
            <div className="flex items-center gap-3">
              <div style={{ flex: 1, height: 8, borderRadius: 8, background: "#ece2d1", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: c, borderRadius: 8 }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: c, flexShrink: 0 }}>{progress}% submitted</span>
            </div>
          </Card>

          {/* Grade breakdown */}
          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Grade breakdown</div>
            <div style={{ height: 10, borderRadius: 6, overflow: "hidden", display: "flex", marginBottom: 16 }}>
              {course.gradeComponents.map((gc, i) => (
                <div key={gc.id} style={{ width: `${gc.weight}%`, background: SEG_COLORS[i % SEG_COLORS.length] }} />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {course.gradeComponents.map((gc, i) => (
                <div key={gc.id} className="flex items-center gap-3">
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: SEG_COLORS[i % SEG_COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 16, color: "var(--ink)" }}>{gc.name}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{gc.weight}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Grade calculator */}
          <button
            onClick={() => { track.gradeCalculatorUsed(course.code); setCalcOpen(true); }}
            className="w-full text-left flex items-center justify-between"
            style={{ background: "var(--surface)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "16px 18px", border: "none", cursor: "pointer" }}
          >
            <span>
              <span style={{ display: "block", fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>
                Grade calculator
              </span>
              <span style={{ display: "block", fontSize: 14, color: "var(--green)", marginTop: 2 }}>
                Projected: {projected.toFixed(1)}% · {letterGrade(projected)}
              </span>
            </span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Insights */}
          <InsightCards course={course} />

          {/* Things to know */}
          {course.tips.length > 0 && (
            <Card>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Things to know</div>
              <div className="flex flex-col gap-3">
                {course.tips.map((tip, i) => (
                  <div key={i} className="flex gap-3" style={{ alignItems: "flex-start" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, flexShrink: 0, marginTop: 8 }} />
                    <span style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.45 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Study with */}
          <Card>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Study with AI</div>
            <p style={{ fontSize: 15, color: "var(--text-2)", margin: "0 0 14px", lineHeight: 1.5 }}>
              Tap a button to copy a ready-made prompt for{" "}
              <b style={{ color: "var(--ink)" }}>{course.currentTopic}</b>{" "}
              — paste it into ChatGPT, Claude, or any AI to start studying.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {STUDY_TILES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => copyPrompt(t.key, t.title)}
                  style={{
                    background: "var(--cream-deep)", borderRadius: 16, padding: "14px 14px 16px",
                    border: `1.5px solid transparent`, cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "border-color .15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${c}60`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
                >
                  <div style={{ color: c, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3, lineHeight: 1.35 }}>{t.caption}</div>
                  <div style={{ fontSize: 11, color: c, marginTop: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy prompt
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Important dates */}
          {sortedEvents.length > 0 && (
            <Card>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <span className="eyebrow">Important dates</span>
                <button
                  onClick={addAll}
                  className="flex items-center gap-1.5"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--orange-cta)", fontSize: 15, fontWeight: 600 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Add all
                </button>
              </div>
              <div className="flex flex-col">
                {sortedEvents.map((e, i) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3"
                    style={{ padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--line)" }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: EVENT_DOT[e.type], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: 0, lineHeight: 1.25 }}>{e.title}</p>
                      <p style={{ fontSize: 13, color: "var(--text-2)", margin: "2px 0 0" }}>
                        {typeLabel(e.type)} · {fmtShort(e.date)}{e.weight > 0 ? ` · ${e.weight}%` : ""}
                      </p>
                    </div>
                    <span style={{ fontSize: 14, color: daysUntil(e.date) < 0 ? "var(--text-3)" : "var(--text-2)", flexShrink: 0 }}>
                      {relativeLabel(e.date).toLowerCase()}
                    </span>
                    <button
                      onClick={() => addEvent(e)}
                      aria-label={`Add ${e.title}`}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--orange-cta)", padding: 0, flexShrink: 0, display: "flex" }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Remove */}
          <button
            onClick={() => { if (confirm(`Remove ${course.code}?`)) onDelete(); }}
            style={{ alignSelf: "center", background: "none", border: "none", cursor: "pointer", color: "#d1544b", fontSize: 16, fontWeight: 600, padding: "6px 0" }}
          >
            Remove this course
          </button>
        </div>
      </div>

      {toast && (
        <div style={{
          position: "absolute", left: "50%", bottom: 96, transform: "translateX(-50%)",
          background: "var(--ink)", color: "#fff", padding: "10px 18px", borderRadius: 24,
          fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.25)", zIndex: 20,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "18px" }}>
      {children}
    </div>
  );
}

function DocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z" /></svg>
  );
}
function CardsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="7" width="16" height="13" rx="2" /><path d="M7 7V5a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
function SpeakerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
    </svg>
  );
}
