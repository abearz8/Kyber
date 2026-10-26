"use client";

import { useState } from "react";
import type { PersonalEvent, PersonalEventKind, Course, CourseEvent, EventType } from "@/lib/types";
import { isoToday } from "@/lib/dates";
import { useScreenTime } from "@/hooks/useScreenTime";
import { BottomSheet, Card, ChevronRight, OutlineButton, PrimaryButton, MiniSegmented, TextLink } from "@/components/shared/ui";

type OptionKey = PersonalEventKind | "syllabus";

const KINDS: { key: OptionKey; label: string; description: string }[] = [
  { key: "class",       label: "Class or lecture",       description: "Lecture, tutorial or office hours" },
  { key: "deadline",    label: "Assignment or deadline", description: "Paper, quiz or a date we missed" },
  { key: "study_block", label: "Study block",            description: "Solo or with a group" },
  { key: "fun",         label: "Something fun",          description: "Social, sport or an event" },
  { key: "syllabus",    label: "Another syllabus",       description: "Upload a PDF or photo" },
];

interface Props {
  defaultDate: string;
  onAdd: (event: PersonalEvent) => void;
  onCancel: () => void;
  /** Open straight on a type (and optionally a course) — used by "Add deadlines". */
  preset?: { kind: PersonalEventKind; courseId?: string };
  /** When provided, a deadline can be attached to a course and becomes a real CourseEvent. */
  courses?: Course[];
  onAddCourseEvent?: (courseId: string, event: CourseEvent) => void;
  /** Shows the "Another syllabus" option. */
  onAddSyllabus?: () => void;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `pe-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }
}

export default function AddToPlanSheet({ defaultDate, onAdd, onCancel, preset, courses, onAddCourseEvent, onAddSyllabus }: Props) {
  useScreenTime("add_to_plan"); // mounted only while open
  const [kind, setKind] = useState<PersonalEventKind | null>(preset?.kind ?? null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate || isoToday());
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("19:00");
  const [courseId, setCourseId] = useState<string>(preset?.courseId ?? "");
  const [eventType, setEventType] = useState<EventType>("assignment");
  const [weight, setWeight] = useState("");

  const selected = KINDS.find((k) => k.key === kind);
  const canAttach = kind === "deadline" && !!courses?.length && !!onAddCourseEvent;
  const attached = canAttach && courseId !== "";
  const options = KINDS.filter((k) => k.key !== "syllabus" || onAddSyllabus);

  function submit() {
    if (!kind || !title.trim()) return;
    if (attached && onAddCourseEvent) {
      const w = weight.trim() === "" ? 0 : Math.max(0, Math.min(100, Number(weight) || 0));
      onAddCourseEvent(courseId, {
        id: `${courseId}-m-${newId()}`,
        type: eventType,
        title: title.trim(),
        date,
        weight: w,
        courseId,
        manual: true,
      });
      return;
    }
    onAdd({ id: newId(), kind, title: title.trim(), date, start, end });
  }

  return (
    <BottomSheet
      onClose={onCancel}
      zIndex={40}
      title={!kind ? "Add to your plan" : selected?.label}
      subtitle={!kind ? <>Add anything. Kyber <span className="hi">plans your study around it</span>.</> : undefined}
    >
      {!kind ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            {options.map((k) => (
              <Card
                key={k.key}
                pad="12px 14px"
                onClick={() => (k.key === "syllabus" ? onAddSyllabus?.() : setKind(k.key))}
                style={{ display: "flex", alignItems: "center", gap: 14, borderRadius: 16 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17.5, fontWeight: 700, color: "var(--ink)" }}>{k.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", marginTop: 2 }}>{k.description}</div>
                </div>
                <ChevronRight />
              </Card>
            ))}
          </div>
          <OutlineButton label="Cancel" onClick={onCancel} height={52} style={{ width: "100%", marginTop: 16 }} />
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -30, marginBottom: 6 }}>
            <TextLink label="Change type" onClick={() => setKind(null)} size={15} color="var(--amber-deep)" underline={false} />
          </div>

          {canAttach && (
            <>
              <label style={labelStyle}>Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={inputStyle}>
                <option value="">Not tied to a course</option>
                {courses!.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} · {c.title}</option>
                ))}
              </select>
            </>
          )}

          <label style={labelStyle}>Title</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === "class" ? "e.g. MATH 1600A lecture" :
              kind === "deadline" ? "e.g. Assignment 3" :
              kind === "study_block" ? "e.g. Study for midterm" :
              "e.g. Movie night, gym"
            }
            style={inputStyle} />

          {attached && (
            <>
              <label style={labelStyle}>Type</label>
              <MiniSegmented<EventType>
                value={eventType}
                onChange={setEventType}
                options={[{ value: "assignment", label: "Assignment" }, { value: "quiz", label: "Quiz" }, { value: "exam", label: "Exam" }]}
              />
            </>
          )}

          <label style={labelStyle}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />

          {attached ? (
            <>
              <label style={labelStyle}>Weight (% of grade, optional)</label>
              <input type="number" inputMode="decimal" min={0} max={100} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 20" style={inputStyle} />
            </>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Starts</label>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Ends</label>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}

          <PrimaryButton label={attached ? "Add deadline" : "Add to plan"} onClick={submit} disabled={!title.trim()} style={{ marginTop: 20 }} />
          <OutlineButton label="Cancel" onClick={onCancel} height={48} style={{ width: "100%", marginTop: 10 }} />
        </>
      )}
    </BottomSheet>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: "14px 0 6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%", borderRadius: 14, border: "1.5px solid var(--line)", background: "var(--surface)",
  padding: "12px 14px", fontSize: 17, fontWeight: 500, color: "var(--ink)", outline: "none",
};
