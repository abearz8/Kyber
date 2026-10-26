"use client";

import type { PlanItem } from "@/lib/plan";
import { useScreenTime } from "@/hooks/useScreenTime";
import { BottomSheet, Label, Pill } from "@/components/shared/ui";

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
  const kindLabel = isStudy ? "Study block" : isAi ? "AI suggestion ✦" : isCourse ? (item.eventType === "exam" ? "Exam" : "Deadline") : (item.subtitle ?? "Personal");

  return (
    <BottomSheet onClose={onClose} zIndex={52}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ width: 12, height: 12, borderRadius: isStudy || isAi ? 3 : "50%", background: item.color, flexShrink: 0, marginTop: 8 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Label>{kindLabel}</Label>
          <h2 style={{ fontWeight: 700, fontSize: 24, letterSpacing: "-0.3px", color: "var(--ink)", margin: "4px 0 0", lineHeight: 1.2 }}>
            {item.title}
          </h2>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0 16px" }}>
        {item.courseCode && <Pill text={item.courseCode} bg={`${item.color}26`} />}
        <Pill text={duration ?? item.timeLabel} bg="var(--cream-deep)" />
      </div>

      {tip && (
        <div style={{ background: "var(--soft)", borderRadius: 14, padding: "14px 16px" }}>
          <Label style={{ display: "block", marginBottom: 6 }}>How to approach it</Label>
          <p style={{ fontSize: 16, color: "var(--ink)", margin: 0, lineHeight: 1.55, fontWeight: 500 }}>{tip}</p>
        </div>
      )}

      {isAi && item.aiDescription && (
        <div style={{ background: "var(--soft)", borderRadius: 14, padding: "14px 16px" }}>
          <Label style={{ display: "block", marginBottom: 6 }}>What to do</Label>
          <p style={{ fontSize: 16, color: "var(--ink)", margin: 0, lineHeight: 1.55, fontWeight: 500 }}>{item.aiDescription}</p>
        </div>
      )}

      {isCourse && !tip && (
        <div style={{ background: "var(--soft)", borderRadius: 14, padding: "14px 16px" }}>
          <p style={{ fontSize: 16, color: "var(--ink)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            {item.eventType === "exam"
              ? "Exam day — review your summary sheet the night before and confirm the room and start time."
              : "Submission deadline — confirm upload requirements and leave buffer time for any technical issues."}
          </p>
          {item.estimated && (
            <p style={{ fontSize: 14.5, color: "var(--text-2)", margin: "8px 0 0", fontStyle: "italic" }}>
              {item.dateNote || "Date estimated from course schedule."}
            </p>
          )}
        </div>
      )}

      {item.kind === "personal" && (
        <div style={{ background: "var(--soft)", borderRadius: 14, padding: "14px 16px" }}>
          <p style={{ fontSize: 16, color: "var(--ink)", margin: 0, fontWeight: 500 }}>
            {item.personalKind === "class" ? "Kyber never schedules study on top of a class." :
             item.personalKind === "fun" ? "Protected. Study blocks are planned around it." :
             item.personalKind === "study_block" ? "Your own study block." : "Added by you."}
            {item.timeLabel ? ` · ${item.timeLabel}` : ""}
          </p>
        </div>
      )}
    </BottomSheet>
  );
}
