"use client";

import { useState } from "react";
import type { PersonalEvent, PersonalEventKind } from "@/lib/types";
import { isoToday } from "@/lib/dates";
import { useScreenTime } from "@/hooks/useScreenTime";

const KINDS: { key: PersonalEventKind; label: string; icon: string; description: string }[] = [
  { key: "class",       label: "Class or lecture",      icon: "🎓", description: "Lecture, tutorial, or office hours" },
  { key: "deadline",    label: "Assignment or deadline", icon: "📋", description: "Paper, project, quiz, or submission" },
  { key: "study_block", label: "Study block",            icon: "📖", description: "Focused solo or group study session" },
  { key: "fun",         label: "Something fun",          icon: "🎉", description: "Social, sport, event, or anything you enjoy" },
];

interface Props {
  defaultDate: string;
  onAdd: (event: PersonalEvent) => void;
  onCancel: () => void;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `pe-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }
}

export default function AddToPlanSheet({ defaultDate, onAdd, onCancel }: Props) {
  useScreenTime("add_to_plan"); // mounted only while open
  const [kind, setKind] = useState<PersonalEventKind | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate || isoToday());
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("19:00");

  const selected = KINDS.find((k) => k.key === kind);

  function submit() {
    if (!kind || !title.trim()) return;
    onAdd({ id: newId(), kind, title: title.trim(), date, start, end });
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(39,37,31,0.32)" }} />

      {/* Sheet */}
      <div style={{ position: "relative", background: "var(--paper)", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%", overflowY: "auto" }} className="no-scrollbar">
        <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--track)", margin: "0 auto 14px" }} />

        {!kind ? (
          <>
            <h2 style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 18, color: "var(--ink)", margin: "0 0 4px" }}>Add to your plan</h2>
            <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 14px" }}>Kyber plans your study around it — no study lands on top.</p>
            <div className="flex flex-col gap-1.5">
              {KINDS.map((k) => (
                <button
                  key={k.key}
                  onClick={() => setKind(k.key)}
                  className="w-full text-left flex items-center gap-3"
                  style={{ background: "var(--cream-deep)", border: "none", borderRadius: 12, padding: "14px 14px", cursor: "pointer" }}
                >
                  <span style={{ fontSize: 20 }}>{k.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{k.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{k.description}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              ))}
            </div>
            <button onClick={onCancel} className="w-full" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", fontSize: 13, fontWeight: 600, marginTop: 14 }}>Cancel</button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <h2 style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 18, color: "var(--ink)", margin: 0 }}>
                {selected?.icon} {selected?.label}
              </h2>
              <button onClick={() => setKind(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--amber-ink)", fontSize: 12, fontWeight: 600 }}>Change type</button>
            </div>

            <label style={labelStyle}>Title</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={
                kind === "class" ? "e.g. MATH 1600A lecture" :
                kind === "deadline" ? "e.g. Assignment 3" :
                kind === "study_block" ? "e.g. Study for midterm" :
                "e.g. Movie night, gym"
              }
              style={inputStyle} />

            <label style={labelStyle}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Starts</label>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Ends</label>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <button
              onClick={submit}
              disabled={!title.trim()}
              className="w-full rounded-xl py-3"
              style={{ background: "var(--amber)", color: "var(--ink)", fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 16, border: "none", marginTop: 16, cursor: title.trim() ? "pointer" : "not-allowed", opacity: title.trim() ? 1 : 0.5 }}
            >
              Add to plan
            </button>
            <button onClick={onCancel} className="w-full" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", fontSize: 13, fontWeight: 600, marginTop: 10 }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "var(--amber-ink)",
  textTransform: "uppercase", letterSpacing: "0.04em", margin: "10px 0 4px",
};
const inputStyle: React.CSSProperties = {
  width: "100%", borderRadius: 10, border: "1px solid var(--line)", background: "var(--cream)",
  padding: "10px 12px", fontSize: 14, color: "var(--ink)", fontFamily: "inherit",
};
