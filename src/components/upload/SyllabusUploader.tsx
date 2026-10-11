"use client";

import { useState, useRef } from "react";
import type { Course } from "@/lib/types";
import { track } from "@/lib/analytics";

interface Props {
  onDone: (courses: Course[]) => void;
  onCancel?: () => void;
}

type Stage = "idle" | "parsing" | "done" | "error";
type FileStatus = "parsing" | "done" | "error";

export default function SyllabusUploader({ onDone, onCancel }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".txt")
    );
    setFiles(picked);
    setStatuses([]);
    setError(null);
  }

  async function handleUpload() {
    if (!files.length) return;
    track.syllabusUploadStarted(files.length);

    setStage("parsing");
    setError(null);
    setStatuses(files.map(() => "parsing"));

    // Parse every file concurrently — one request per syllabus — so each
    // course's spinner resolves the moment that syllabus finishes, instead of
    // waiting on the slowest one in a single batch.
    const results: Array<Course | null> = new Array(files.length).fill(null);
    let firstError: string | null = null;

    await Promise.all(
      files.map(async (file, i) => {
        try {
          const formData = new FormData();
          formData.append("files", file);
          formData.append("colorIndex", String(i));
          const res = await fetch("/api/parse", { method: "POST", body: formData });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}`);
          }
          const { courses } = (await res.json()) as { courses: Course[] };
          results[i] = courses[0] ?? null;
          setStatuses((prev) => prev.map((s, j) => (j === i ? "done" : s)));
        } catch (err) {
          firstError = firstError ?? (err instanceof Error ? err.message : "Parse failed");
          setStatuses((prev) => prev.map((s, j) => (j === i ? "error" : s)));
        }
      })
    );

    const courses = results.filter((c): c is Course => c !== null);
    if (courses.length) {
      track.syllabusUploadCompleted(courses.length);
      setStage("done");
      onDone(courses);
    } else {
      const msg = firstError || "Parsing failed";
      track.syllabusUploadFailed(msg);
      setError(msg);
      setStage("error");
    }
  }

  const isLoading = stage === "parsing";

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text)" }}>
          Upload Syllabi
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{ color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Drop zone */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors"
        style={{
          borderColor: files.length ? "#e9a319" : "var(--border)",
          background: files.length ? "#fff7ed" : "var(--surface-2)",
          cursor: isLoading ? "default" : "pointer",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={files.length ? "#e9a319" : "var(--text-3)"} strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        {files.length === 0 ? (
          <>
            <p style={{ fontWeight: 600, color: "var(--text)", fontSize: 15 }}>
              Tap to add PDFs
            </p>
            <p style={{ color: "var(--text-3)", fontSize: 13 }}>
              PDF or .txt — one file per course
            </p>
          </>
        ) : (
          <div className="text-center">
            <p style={{ fontWeight: 600, color: "#e9a319", fontSize: 15 }}>
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={f.name} className="flex items-center justify-center gap-1.5">
                  <StatusIcon status={statuses[i]} />
                  <span style={{ color: "var(--text-2)", fontSize: 12 }}>{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </button>

      {/* Hidden file input — ph-no-capture prevents PostHog recording filename */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        multiple
        className="hidden ph-no-capture"
        onChange={handleFileChange}
      />

      {error && (
        <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12, textAlign: "center" }}>
          {error}
        </p>
      )}

      {stage === "parsing" && (
        <p style={{ color: "var(--text-2)", fontSize: 13, marginTop: 12, textAlign: "center" }}>
          Parsing all syllabi in parallel with Claude…
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={!files.length || isLoading}
        className="mt-4 rounded-xl py-3 transition-opacity"
        style={{
          background: "#e9a319",
          color: "#fff",
          fontFamily: "Manrope, sans-serif",
          fontWeight: 600,
          fontSize: 16,
          border: "none",
          cursor: !files.length || isLoading ? "not-allowed" : "pointer",
          opacity: !files.length || isLoading ? 0.5 : 1,
        }}
      >
        {isLoading ? "Parsing…" : `Parse ${files.length || ""} syllab${files.length === 1 ? "us" : "i"}`}
      </button>

      <p style={{ color: "var(--text-3)", fontSize: 11, marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>
        This beta uses anonymous analytics to help improve the product. Syllabus content is processed securely and not stored.
      </p>
    </div>
  );
}

/** Per-course parse status: spinner while parsing, check when done, x on error. */
function StatusIcon({ status }: { status?: FileStatus }) {
  if (status === "parsing") {
    return (
      <span
        className="animate-spin"
        aria-label="Parsing"
        style={{
          width: 13,
          height: 13,
          borderRadius: "9999px",
          border: "2px solid rgba(233,163,25,0.25)",
          borderTopColor: "#e9a319",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
    );
  }
  if (status === "done") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3faf76" strokeWidth="3" style={{ flexShrink: 0 }} aria-label="Parsed">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" style={{ flexShrink: 0 }} aria-label="Failed">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  // idle (selected but not yet parsing) — small neutral dot
  return (
    <span style={{ width: 5, height: 5, borderRadius: "9999px", background: "var(--text-3)", display: "inline-block", flexShrink: 0 }} />
  );
}
