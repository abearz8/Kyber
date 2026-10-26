"use client";

import { useRef } from "react";
import Icon from "@/components/shared/Icon";
import { CheckIcon } from "@/components/shared/ui";
import { ACCEPT, type FileState } from "./useSyllabusParser";

interface Props {
  files: FileState[];
  onPick: (files: File[]) => void;
  onRemove: (name: string) => void;
  disabled?: boolean;
}

/** Dashed amber drop zone with the picked files as check chips. */
export default function SyllabusDropzone({ files, onPick, onRemove, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); if (!disabled) onPick(Array.from(e.dataTransfer.files)); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        style={{
          border: "2px dashed var(--amber)", borderRadius: 20, background: "var(--soft)",
          padding: "34px 18px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          cursor: disabled ? "default" : "pointer", textAlign: "center",
        }}
      >
        <span style={{ width: 70, height: 70, borderRadius: 18, background: "var(--amber-light)", border: "1.5px solid var(--warn-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="upload" size={38} />
        </span>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>
          {files.length ? "Add another syllabus" : "Upload all your syllabi"}
        </div>
        <div style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>PDF or Word</div>

        {files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 8 }}>
            {files.map((f) => (
              <span
                key={f.file.name}
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface)",
                  border: `1.5px solid ${f.status === "error" ? "var(--pink)" : "var(--amber)"}`, borderRadius: 10, padding: "7px 10px",
                  fontSize: 16, fontWeight: 600, color: "var(--ink)", maxWidth: "100%",
                }}
              >
                <CheckIcon size={14} color={f.status === "error" ? "#B23B3B" : "var(--amber-deep)"} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{f.file.name}</span>
                {!disabled && (
                  <button onClick={() => onRemove(f.file.name)} aria-label={`Remove ${f.file.name}`} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--text-3)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input — ph-no-capture prevents PostHog recording filenames */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden ph-no-capture"
        style={{ display: "none" }}
        onChange={(e) => { onPick(Array.from(e.target.files || [])); e.target.value = ""; }}
      />
    </>
  );
}
