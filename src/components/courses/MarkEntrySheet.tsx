"use client";

import { useState } from "react";
import type { Course, GradeComponent } from "@/lib/types";
import { enteredMark } from "@/lib/grades";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";
import { BottomSheet, PrimaryButton, OutlineButton, TextLink } from "@/components/shared/ui";

interface Props {
  course: Course;
  component: GradeComponent;
  onClose: () => void;
}

/** Enter / edit the mark for one grade component (stored as the component's aggregate score). */
export default function MarkEntrySheet({ course, component, onClose }: Props) {
  const { dispatch } = useStore();
  const existing = enteredMark(component);
  const [value, setValue] = useState(existing === null ? "" : String(existing));
  const num = Number(value);
  const valid = value.trim() !== "" && !isNaN(num) && num >= 0 && num <= 100;

  function save() {
    if (!valid) return;
    dispatch({ type: "SET_COMPONENT_MARK", courseId: course.id, componentId: component.id, mark: Math.round(num * 10) / 10 });
    track.gradeMarkEntered(course.code);
    onClose();
  }

  function clear() {
    dispatch({ type: "SET_COMPONENT_MARK", courseId: course.id, componentId: component.id, mark: null });
    onClose();
  }

  return (
    <BottomSheet onClose={onClose} title={component.name} subtitle={`${component.weight}% of your grade`} zIndex={55}>
      <label htmlFor="mark-input" style={{ display: "block", fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: "20px 0 8px" }}>
        Your mark
      </label>
      <div style={{ position: "relative" }}>
        <input
          id="mark-input"
          autoFocus
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={0.5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="e.g. 78"
          style={{
            width: "100%", background: "var(--surface)", border: "1.5px solid var(--line)", borderRadius: 16,
            padding: "14px 48px 14px 16px", fontSize: 22, fontWeight: 700, color: "var(--ink)", outline: "none",
          }}
        />
        <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 20, fontWeight: 600, color: "var(--text-2)" }}>%</span>
      </div>
      <p style={{ fontSize: 15, color: "var(--text-2)", margin: "10px 0 0", lineHeight: 1.4 }}>
        Kyber locks this in and projects the rest of your grade around it.
      </p>
      <PrimaryButton label="Save mark" onClick={save} disabled={!valid} style={{ marginTop: 20 }} />
      <OutlineButton label="Cancel" onClick={onClose} height={48} style={{ width: "100%", marginTop: 10 }} />
      {existing !== null && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <TextLink label="Clear this mark" onClick={clear} size={16} color="var(--text-2)" />
        </div>
      )}
    </BottomSheet>
  );
}
