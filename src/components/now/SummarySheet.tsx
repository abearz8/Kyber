"use client";

import type { Course } from "@/lib/types";
import type { NowItem } from "@/lib/now";
import { track } from "@/lib/analytics";
import { Card, Label, ChevronLeft, PrimaryButton, TextLink, CheckIcon } from "@/components/shared/ui";

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
      <div style={{ padding: "14px 16px 8px", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 2, fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>
          <ChevronLeft /> Today
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "6px 16px 16px" }}>
        <Label>{item.courseCode}</Label>
        <h2 style={{ fontWeight: 700, fontSize: 28, letterSpacing: "-0.4px", color: "var(--ink)", margin: "4px 0 4px", lineHeight: 1.15 }}>
          {item.title}
        </h2>
        <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-2)", margin: "0 0 16px" }}>
          {item.minutes > 0 ? `${item.minutes} min · ` : ""}{item.note}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <p style={{ fontSize: 16, color: "var(--ink)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
              {item.kind === "study"
                ? `Generated from your syllabus. ${item.note}. Start it now, then check it off when you're done.`
                : `${item.note}. Give it a focused block and check it off when it's in.`}
            </p>
          </Card>

          {checklist.length > 0 && (
            <section>
              <Label style={{ display: "block", marginBottom: 8 }}>What {item.courseCode} looks for</Label>
              <Card pad="4px 16px">
                {checklist.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < checklist.length - 1 ? "1px solid var(--track)" : "none" }}>
                    <span style={{ marginTop: 3 }}><CheckIcon size={16} color="var(--amber-deep)" /></span>
                    <span style={{ fontSize: 16, color: "var(--ink)", lineHeight: 1.45, fontWeight: 500 }}>{tip}</span>
                  </div>
                ))}
              </Card>
              <p style={{ fontSize: 14, color: "var(--text-3)", margin: "6px 0 0", fontWeight: 500 }}>Pulled from the syllabus and grading rubric.</p>
            </section>
          )}

          {method && (
            <section>
              <Label style={{ display: "block", marginBottom: 6 }}>How to approach it</Label>
              <p style={{ fontSize: 16, color: "var(--ink)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                <b>{method.name}.</b> {method.why}
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "12px 16px calc(16px + var(--safe-bottom))", borderTop: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
        <PrimaryButton label="Done — check it off" onClick={() => { track.nowTaskCompleted(item.kind); onDone(); }} />
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <TextLink label="Not now" onClick={onClose} size={16} color="var(--text-2)" />
        </div>
      </div>
    </div>
  );
}
