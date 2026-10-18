/**
 * Hand-verified "correct answers" for a few sample syllabi, read directly from
 * the source PDFs. The debug harness (scripts/debug-parse.ts --check) diffs the
 * parser's output against these to produce an accuracy report.
 *
 * Keyed by PDF *basename* (the filename, not the full path).
 *
 * Dates here are the TRUE ISO dates as printed in the syllabus, including the
 * document's original year. The harness anchors away the year before comparing,
 * so what actually gets checked is the month + day (and, optionally, year drift
 * reported separately). This is deliberate: the parser is *supposed* to rewrite
 * the year to the current academic year, but it must preserve month/day exactly.
 *
 * HOW TO ADD A SYLLABUS:
 *   1. Open the PDF under sources/Sylabus examples/.
 *   2. Record the code, every dated deadline/exam, and the grade weights.
 *   3. Add an entry below keyed by the exact filename.
 * Syllabi without an entry are simply skipped in --check scoring.
 */

export interface ExpectedEvent {
  /** Human label — matched loosely (case/substring) against parsed titles. */
  title: string;
  /** True ISO date from the syllabus (original year). "" if the syllabus gives no exact date. */
  date: string;
}

export interface ExpectedComponent {
  name: string;
  weight: number;
}

export interface GroundTruth {
  code?: string;
  expectedEvents: ExpectedEvent[];
  expectedComponents?: ExpectedComponent[];
  /** Free-text notes for the human — e.g. dates the syllabus leaves as a range. */
  notes?: string;
}

export const GROUND_TRUTH: Record<string, GroundTruth> = {
  // ── HBA1 / First semester ──────────────────────────────────────────────
  "HBA Course Outline 2025-2026 BUS3303 Sec 3&4.pdf": {
    code: "BUSINESS 3303",
    expectedComponents: [
      { name: "Class Contribution", weight: 30 },
      { name: "Midterm Exam", weight: 30 },
      { name: "Final Exam", weight: 40 },
    ],
    expectedEvents: [
      { title: "Midterm Exam", date: "2025-10-22" },
      { title: "Final Exam", date: "2025-12-12" },
    ],
    notes:
      "Only two dated events in the whole outline (p.3). Everything else is policy prose.",
  },

  // ── Data Science / First semester ──────────────────────────────────────
  "2022-CS1026-a.pdf": {
    code: "CS 1026A",
    expectedComponents: [
      { name: "Assignments", weight: 37 },
      { name: "Labs", weight: 8 },
      { name: "Midterm Test", weight: 20 },
      { name: "Final Exam", weight: 35 },
    ],
    expectedEvents: [
      { title: "Assignment 1", date: "2022-10-05" },
      { title: "Assignment 2", date: "2022-10-26" },
      { title: "Assignment 3", date: "2022-11-16" },
      { title: "Assignment 4", date: "2022-12-07" },
      { title: "Midterm Test", date: "2022-10-14" },
    ],
    notes:
      "Final exam has NO exact date — University-scheduled within the Dec 10–22 exam period, so it is intentionally omitted here. Labs 1–10 are weekly ranges, not single dates. A good parser should surface the 4 assignments + midterm.",
  },

  // ── Template for the remaining syllabi (fill in from the PDFs) ──────────
  // "MATH1600A.pdf": {
  //   code: "",
  //   expectedComponents: [],
  //   expectedEvents: [{ title: "", date: "YYYY-MM-DD" }],
  // },
};
