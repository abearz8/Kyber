/**
 * Per-event date trace for the debug harness.
 *
 * Given the raw events the LLM returned and a reference date, this reproduces
 * exactly what normalize() + anchorAndFilterDates() do to each date and reports
 * one row per raw event: the LLM date, what anchoring turned it into, whether it
 * survived the window filter, and — crucially — *why* it was kept or dropped.
 *
 * This is pure/read-only and uses the same helpers the real pipeline uses
 * (anchorToAcademicYear, withinWindow), so the verdict always matches behavior.
 */

import { anchorToAcademicYear, withinWindow } from "../academicCalendar";
import type { RawExtraction } from "./schema";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type TraceReason =
  | "kept" //            valid ISO date, inside the window
  | "no-iso-date" //     dropped at schema.ts:237 — LLM gave no parseable date
  | "out-of-window" //   anchored date fell outside [-60d, +8mo] and was dropped
  | "resurrected"; //    out of window, but kept because the filter would have
//                       emptied the course (academicCalendar.ts:81 fallback)

export interface DateTraceRow {
  title: string;
  rawDate: string; //           exactly what the LLM returned ("" if blank)
  anchoredDate: string | null; // null when the raw date wasn't valid ISO
  inWindow: boolean | null; //  null when there was nothing to anchor
  kept: boolean;
  reason: TraceReason;
}

export interface DateTrace {
  rows: DateTraceRow[];
  extracted: number; //      total raw events the LLM returned
  kept: number; //           events that survive into the course
  droppedNoDate: number; //  dropped for lacking a valid ISO date
  resurrected: number; //    out-of-window events kept only by the fallback
}

/**
 * Trace the date fate of every raw event. Mirrors normalize()'s event loop
 * (ISO check) followed by anchorAndFilterDates() (anchor → window → fallback).
 * Does not account for recurring-assignment expansion — those are reported
 * separately by the harness.
 */
export function traceEventDates(
  raw: RawExtraction,
  ref: Date = new Date()
): DateTrace {
  const rawEvents = raw.events ?? [];

  // Stage 1: ISO validity — anything without a YYYY-MM-DD date is dropped.
  const prelim = rawEvents.map((e) => {
    const rawDate = (e.date || "").trim();
    const title = (e.title || "Untitled").trim();
    if (!ISO_DATE.test(rawDate)) {
      return { title, rawDate, anchoredDate: null as string | null, valid: false };
    }
    return { title, rawDate, anchoredDate: anchorToAcademicYear(rawDate, ref), valid: true };
  });

  // Stage 2: window filter with the "never empty the course" fallback.
  const validRows = prelim.filter((r) => r.valid);
  const anyInWindow = validRows.some(
    (r) => r.anchoredDate != null && withinWindow(r.anchoredDate, ref)
  );

  const rows: DateTraceRow[] = prelim.map((r) => {
    if (!r.valid) {
      return {
        title: r.title,
        rawDate: r.rawDate,
        anchoredDate: null,
        inWindow: null,
        kept: false,
        reason: "no-iso-date",
      };
    }
    const inWindow = withinWindow(r.anchoredDate!, ref);
    let kept: boolean;
    let reason: TraceReason;
    if (inWindow) {
      kept = true;
      reason = "kept";
    } else if (anyInWindow) {
      kept = false;
      reason = "out-of-window";
    } else {
      // Nothing was in window → fallback keeps the whole anchored list.
      kept = true;
      reason = "resurrected";
    }
    return { title: r.title, rawDate: r.rawDate, anchoredDate: r.anchoredDate, inWindow, kept, reason };
  });

  return {
    rows,
    extracted: rows.length,
    kept: rows.filter((r) => r.kept).length,
    droppedNoDate: rows.filter((r) => r.reason === "no-iso-date").length,
    resurrected: rows.filter((r) => r.reason === "resurrected").length,
  };
}
