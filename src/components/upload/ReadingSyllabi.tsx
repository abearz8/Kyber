"use client";

import { summarizeCourseEvents } from "@/lib/events";
import Icon from "@/components/shared/Icon";
import { CheckIcon } from "@/components/shared/ui";
import type { FileState } from "./useSyllabusParser";

interface Props {
  files: FileState[];
}

function titleFor(f: FileState): string {
  if (f.course) return `${f.course.code} · ${f.course.title}`;
  return f.file.name.replace(/\.(pdf|txt|docx)$/i, "");
}

function subFor(f: FileState): string {
  if (f.status === "done" && f.course) return summarizeCourseEvents(f.course);
  if (f.status === "error") return f.error ? `Couldn't read this one — ${f.error}` : "Couldn't read this one";
  if (f.status === "parsing") return "Reading now";
  return "Up next";
}

/** Live per-file progress while syllabi are parsed. */
export default function ReadingSyllabi({ files }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--ink)" }}>Reading your syllabi</h1>
        <span style={{ display: "inline-flex", gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", animation: `kyberPulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
          ))}
        </span>
      </div>
      <p style={{ margin: "10px 0 0", textAlign: "center", fontSize: 16, fontWeight: 400, color: "var(--ink)" }}>This can take a minute.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {files.map((f, i) => {
          const done = f.status === "done";
          const now = f.status === "parsing";
          const failed = f.status === "error";
          const noDates = done && f.course?.noDeadlines;
          return (
            <div
              key={f.file.name}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16,
                background: done ? "var(--soft)" : "var(--surface)",
                border: `1.5px solid ${failed ? "var(--pink)" : done || now ? "var(--amber)" : "var(--line)"}`,
                animation: `fadeUp .45s ${i * 0.12}s ease both`,
              }}
            >
              <span style={{ width: 56, height: 56, borderRadius: "50%", background: done ? "var(--amber-light)" : "var(--soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="reading" size={28} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>{titleFor(f)}</div>
                <div style={{ fontSize: 15.5, fontWeight: 500, color: noDates ? "var(--amber-ink)" : "var(--ink)", marginTop: 3 }}>{subFor(f)}</div>
              </div>
              {done ? (
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: noDates ? "var(--amber)" : "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {noDates ? <span style={{ color: "var(--ink)", fontWeight: 800, fontSize: 16 }}>!</span> : <CheckIcon size={15} />}
                </span>
              ) : now ? (
                <span aria-label="Reading" style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid rgba(233,163,25,.25)", borderTopColor: "var(--amber)", animation: "kyberSpin .9s linear infinite", flexShrink: 0 }} />
              ) : failed ? (
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--pink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, color: "var(--ink)" }}>×</span>
              ) : (
                <span style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--line)", flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
