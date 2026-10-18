"use client";

import type { PlanItem } from "@/lib/plan";
import { useScreenTime } from "@/hooks/useScreenTime";

const STUDY_TIPS: Record<string, string> = {
  "Review lecture notes": "Go through your lecture slides and handouts. Highlight key concepts and rewrite them in your own words — this forces active recall.",
  "Work through practice problems": "Attempt each problem independently before checking the solution. Note exactly where you get stuck; those gaps are your priority.",
  "Do a past exam under time": "Set a timer for the real exam duration and treat it as the actual test. After, mark it strictly and review every mistake.",
  "Build a one-page summary sheet": "Condense the most important formulas, definitions, and concepts onto one page. The act of summarising is itself active recall.",
  "Outline and gather sources": "Map your main argument and structure before writing. Collect all supporting evidence so you can focus on writing later.",
  "Draft the main sections": "Write without self-editing — get every idea down first. Speed and momentum beat perfection in the draft phase.",
  "Revise and finalise": "Read your work aloud to catch awkward phrasing. Verify all citations and that your argument flows clearly from start to finish.",
};

export default function PlanItemSheet({ item, onClose }: { item: PlanItem; onClose: () => void }) {
  // Mounted only while open, so mount = enter and unmount = dwell. Covers both
  // the Now and Plan callers.
  useScreenTime(`plan_item:${item.kind}`);
  const isStudy = item.kind === "study";
  const isCourse = item.kind === "course";
  const isAi = item.kind === "ai";
  const tip = STUDY_TIPS[item.title];
  const timeParts = item.timeLabel.split(" · ");
  const duration = timeParts.length > 1 ? timeParts[1] : null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", zIndex: 50 }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 51,
        background: "var(--bg)", borderRadius: "20px 20px 0 0",
        padding: "0 0 48px",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--line)" }} />
        </div>

        <div style={{ padding: "14px 20px 0" }}>
          <div className="flex items-start justify-between gap-3" style={{ marginBottom: 14 }}>
            <div className="flex items-start gap-3">
              <div style={{
                width: 10, height: 10, borderRadius: isStudy ? 2 : "50%",
                background: item.color, flexShrink: 0, marginTop: 6,
              }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: item.color, marginBottom: 3 }}>
                  {isStudy ? "Study block" : isAi ? "AI Suggestion ✦" : isCourse ? (item.eventType === "exam" ? "Exam" : "Deadline") : "Personal"}
                </div>
                <h2 style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 20, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
                  {item.title}
                </h2>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "var(--cream-deep)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {item.courseCode && (
              <span style={{ background: `${item.color}18`, color: item.color, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "4px 10px" }}>
                {item.courseCode}
              </span>
            )}
            {duration ? (
              <span style={{ background: "var(--cream-deep)", color: "var(--text-2)", fontSize: 12, fontWeight: 600, borderRadius: 999, padding: "4px 10px" }}>
                {duration}
              </span>
            ) : (
              <span style={{ background: "var(--cream-deep)", color: "var(--text-2)", fontSize: 12, fontWeight: 600, borderRadius: 999, padding: "4px 10px" }}>
                {item.timeLabel.replace("Due ", "")}
              </span>
            )}
          </div>

          {tip && (
            <div style={{ background: "var(--cream-deep)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                How to approach it
              </div>
              <p style={{ fontSize: 14, color: "var(--ink)", margin: 0, lineHeight: 1.55 }}>{tip}</p>
            </div>
          )}

          {isAi && item.aiDescription && (
            <div style={{ background: "var(--cream-deep)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                What to do
              </div>
              <p style={{ fontSize: 14, color: "var(--ink)", margin: 0, lineHeight: 1.55 }}>{item.aiDescription}</p>
            </div>
          )}

          {isCourse && !tip && (
            <div style={{ background: "var(--cream-deep)", borderRadius: 14, padding: "14px 16px" }}>
              <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
                {item.eventType === "exam"
                  ? "Exam day — review your summary sheet the night before and confirm the room and start time."
                  : "Submission deadline — confirm upload requirements and leave buffer time for any technical issues."}
              </p>
              {item.estimated && (
                <p style={{ fontSize: 12, color: "var(--text-3)", margin: "8px 0 0", fontStyle: "italic" }}>
                  {item.dateNote || "Date estimated from course schedule."}
                </p>
              )}
            </div>
          )}

          {item.kind === "personal" && item.subtitle && (
            <div style={{ background: "var(--cream-deep)", borderRadius: 14, padding: "14px 16px" }}>
              <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0 }}>{item.subtitle}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
