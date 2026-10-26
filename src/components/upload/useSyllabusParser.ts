"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import { track } from "@/lib/analytics";

export type FileStatus = "idle" | "parsing" | "done" | "error";

export interface FileState {
  file: File;
  status: FileStatus;
  course?: Course;
  error?: string;
}

export const ACCEPT = ".pdf,.txt,.docx";

export function isAcceptedFile(f: File): boolean {
  return f.type === "application/pdf" || /\.(pdf|txt|docx)$/i.test(f.name);
}

/** Owns the per-file parse lifecycle: pick files → parse each in parallel → results. */
export function useSyllabusParser() {
  const [files, setFiles] = useState<FileState[]>([]);
  const [stage, setStage] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function pick(picked: File[]) {
    const accepted = picked.filter(isAcceptedFile);
    setFiles((prev) => {
      const names = new Set(prev.map((p) => p.file.name));
      return [...prev, ...accepted.filter((f) => !names.has(f.name)).map((file) => ({ file, status: "idle" as const }))];
    });
    setError(null);
  }

  function remove(name: string) {
    setFiles((prev) => prev.filter((p) => p.file.name !== name));
  }

  function reset() {
    setFiles([]);
    setStage("idle");
    setError(null);
  }

  /** Parse every file concurrently; resolves with the successfully parsed courses. */
  async function start(): Promise<Course[]> {
    if (!files.length) return [];
    track.syllabusUploadStarted(files.length);
    setStage("parsing");
    setError(null);
    setFiles((prev) => prev.map((p) => ({ ...p, status: "parsing" as const, course: undefined, error: undefined })));

    const results: Array<Course | null> = new Array(files.length).fill(null);
    let firstError: string | null = null;

    await Promise.all(
      files.map(async (entry, i) => {
        try {
          const formData = new FormData();
          formData.append("files", entry.file);
          formData.append("colorIndex", String(i));
          const res = await fetch("/api/parse", { method: "POST", body: formData });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}`);
          }
          const { courses } = (await res.json()) as { courses: Course[] };
          const course = courses[0] ?? null;
          results[i] = course;
          setFiles((prev) => prev.map((p, j) => (j === i ? { ...p, status: "done", course: course ?? undefined } : p)));
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Parse failed";
          firstError = firstError ?? msg;
          setFiles((prev) => prev.map((p, j) => (j === i ? { ...p, status: "error", error: msg } : p)));
        }
      })
    );

    const courses = results.filter((c): c is Course => c !== null);
    if (courses.length) {
      track.syllabusUploadCompleted(courses.length);
      setStage("done");
    } else {
      const msg = firstError || "Parsing failed";
      track.syllabusUploadFailed(msg);
      setError(msg);
      setStage("error");
    }
    return courses;
  }

  return { files, stage, error, pick, remove, reset, start };
}
