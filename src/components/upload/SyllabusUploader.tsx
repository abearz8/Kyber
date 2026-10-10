"use client";

import { useState, useRef } from "react";
import type { Course } from "@/lib/types";
import { track } from "@/lib/analytics";

interface Props {
  onDone: (courses: Course[]) => void;
  onCancel?: () => void;
}

type Stage = "idle" | "uploading" | "parsing" | "done" | "error";

export default function SyllabusUploader({ onDone, onCancel }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".txt")
    );
    setFiles(picked);
    setError(null);
  }

  async function handleUpload() {
    if (!files.length) return;
    track.syllabusUploadStarted(files.length);

    setStage("uploading");
    const formData = new FormData();
    for (const f of files) formData.append("files", f);

    try {
      setStage("parsing");
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const { courses } = await res.json() as { courses: Course[] };
      track.syllabusUploadCompleted(courses.length);
      setStage("done");
      onDone(courses);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      track.syllabusUploadFailed(msg);
      setError(msg);
      setStage("error");
    }
  }

  const isLoading = stage === "uploading" || stage === "parsing";

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
            <div className="mt-2 space-y-0.5">
              {files.map((f) => (
                <p key={f.name} style={{ color: "var(--text-2)", fontSize: 12 }}>
                  {f.name}
                </p>
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
          Parsing with Claude — this takes 15–30 seconds per syllabus…
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
