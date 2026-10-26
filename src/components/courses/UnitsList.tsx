"use client";

import type { Course } from "@/lib/types";
import type { UnitsInfo } from "@/lib/units";
import { fmtShort } from "@/lib/dates";
import { Card, HighlightCard, Label, ChevronLeft, CheckIcon } from "@/components/shared/ui";

interface Props {
  course: Course;
  info: UnitsInfo;
  onBack: () => void;
}

export default function UnitsList({ course, info, onBack }: Props) {
  const c = course.color;
  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <div style={{ padding: "14px 16px 8px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 2, fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>
          <ChevronLeft /> Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "6px 16px calc(var(--tab-height) + 24px + var(--safe-bottom))" }}>
        <Label>{course.code}</Label>
        <h1 style={{ margin: "4px 0 2px", fontSize: 28, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--ink)" }}>All units</h1>
        <p style={{ margin: "0 0 16px", fontSize: 16, color: "var(--text-2)", fontWeight: 500 }}>
          {info.total} units{info.anchored ? ` · ${fmtShort(info.termStart)} to ${fmtShort(info.termEnd)}` : " · spread across the term"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {info.units.map((u) => {
            const status = u.index < info.currentIndex ? "done" : u.index === info.currentIndex ? "current" : "upcoming";
            const body = (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: status === "done" ? c : status === "current" ? "var(--surface)" : "var(--cream-deep)",
                  color: status === "done" ? "#fff" : "var(--ink)", fontWeight: 700, fontSize: 17.5,
                }}>
                  {status === "done" ? <CheckIcon size={20} /> : u.index + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {status === "current" && <Label>This week</Label>}
                  <div style={{ fontSize: 17.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.25 }}>{u.title}</div>
                  <div style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 500, marginTop: 2 }}>
                    {info.anchored ? `${fmtShort(u.start)} · ` : ""}
                    {u.readings} reading{u.readings === 1 ? "" : "s"}
                    {u.steps > 0 ? ` · ${u.steps} step${u.steps === 1 ? "" : "s"}` : ""}
                  </div>
                </div>
                {u.onFinal && (
                  <span style={{ background: status === "current" ? "var(--amber)" : "var(--amber-light)", color: "var(--ink)", borderRadius: 8, padding: "4px 9px", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    On the final
                  </span>
                )}
              </div>
            );
            return status === "current"
              ? <HighlightCard key={u.index}>{body}</HighlightCard>
              : <Card key={u.index} style={{ opacity: status === "done" ? 0.85 : 1 }}>{body}</Card>;
          })}
        </div>
      </div>
    </div>
  );
}
