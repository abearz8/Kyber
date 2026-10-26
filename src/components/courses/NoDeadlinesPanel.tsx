"use client";

import type { Course } from "@/lib/types";
import Icon from "@/components/shared/Icon";
import { OutlineButton } from "@/components/shared/ui";

interface Props {
  course: Course;
  onAdd: () => void;
  compact?: boolean;
}

/** Honest empty state: the parser found no dated deadlines in this syllabus. */
export default function NoDeadlinesPanel({ course, onAdd, compact }: Props) {
  const notes = course.parseNotes ?? [];
  return (
    <div
      role="alert"
      style={{
        background: "var(--soft)", border: "1px solid var(--warn-border)", borderRadius: 14,
        padding: compact ? "14px 14px 14px" : 16, display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Icon name="alert" size={30} style={{ marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.25 }}>No deadlines found</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text-2)", lineHeight: 1.4, marginTop: 2 }}>
            Add dates so Kyber can plan this course.
          </div>
          {!compact && notes.length > 0 && (
            <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 6, lineHeight: 1.4 }}>
              {notes.join(" · ")}
            </div>
          )}
        </div>
      </div>
      <OutlineButton
        label="Add deadlines"
        height={48}
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        style={{ width: "100%" }}
      />
    </div>
  );
}
