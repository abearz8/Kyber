"use client";

import type { Course } from "@/lib/types";
import type { NowItem } from "@/lib/now";
import { track } from "@/lib/analytics";

interface Props {
  item: NowItem;
  course: Course | undefined;
  onDone: () => void;
  onClose: () => void;
}

export default function SummarySheet({ item, course, onDone, onClose }: Props) {
  const checklist = (course?.tips ?? []).slice(0, 3);
  const method = course?.studyMethod;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--cream)", minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div>
            <div className="eyebrow">{item.courseCode}</div>
            <h2 style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 18, color: "var(--ink)", margin: 0 }}>
              {item.title}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: 16 }}>
       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Intro card */}
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ fontSize: 13, color: "var(--ink2)", margin: 0, lineHeight: 1.5 }}>
            {item.kind === "study"
              ? `Generated from your syllabus. ${item.note}. Start it now, or add it to your plan.`
              : `${item.note}. Give it a focused block and check it off when it's in.`}
          </p>
        </div>

        {/* What this course looks for */}
        {checklist.length > 0 && (
          <section>
            <div className="eyebrow" style={{ marginBottom: 8 }}>What {item.courseCode} looks for</div>
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "6px 14px" }}>
              {checklist.map((tip, i) => (
                <div key={i} className="flex gap-2.5" style={{ padding: "8px 0", borderBottom: i < checklist.length - 1 ? "1px solid var(--track)" : "none" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M2 7.5l3 3 7-7" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.45 }}>{tip}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-3)", margin: "6px 0 0" }}>Pulled from the syllabus and grading rubric.</p>
          </section>
        )}

        {method && (
          <section>
            <div className="eyebrow" style={{ marginBottom: 6 }}>How to approach it</div>
            <p style={{ fontSize: 13, color: "var(--ink2)", margin: 0, lineHeight: 1.5 }}>
              <b style={{ color: "var(--ink)" }}>{method.name}.</b> {method.why}
            </p>
          </section>
        )}
       </div>
      </div>

      {/* Actions */}
      <div style={{ padding: 16, borderTop: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <button
          onClick={() => { track.nowTaskCompleted(item.kind); onDone(); }}
          className="w-full rounded-xl py-3"
          style={{ background: "var(--amber)", color: "var(--ink)", fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer" }}
        >
          Done — check it off
        </button>
        <button
          onClick={onClose}
          className="w-full"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", fontSize: 13, fontWeight: 600, marginTop: 10 }}
        >
          Add to my plan instead
        </button>
      </div>
    </div>
  );
}
