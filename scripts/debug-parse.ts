#!/usr/bin/env tsx
/**
 * Syllabus parser inspection harness.
 *
 * Runs the real sample syllabi through the parser and surfaces every stage so
 * we can see WHERE a wrong date comes from — the LLM misreading the PDF, or the
 * academic-year anchoring/window-filter mangling a correct date.
 *
 * For each syllabus it writes, under debug/parser/<name>/ (gitignored):
 *   cleaned.txt   the exact text the LLM saw (or a note for scanned/vision PDFs)
 *   raw.json      the raw LLM extraction — dates BEFORE anchoring
 *   course.json   the final normalized Course — dates AFTER anchoring + filter
 * and prints a per-event date-trace table plus a drop summary.
 *
 * With --check it also diffs output against scripts/ground-truth.ts and scores
 * each syllabus (✅ matched / ❌ missing / 🗓️ wrong-date / ⚠️ extra).
 *
 * Usage (reads ANTHROPIC_API_KEY from .env.local automatically):
 *   npx tsx scripts/debug-parse.ts --all
 *   npx tsx scripts/debug-parse.ts --all --check
 *   npx tsx scripts/debug-parse.ts --group ds-s1
 *   npx tsx scripts/debug-parse.ts "BUS3303"      # substring match on filename
 */

import * as fs from "fs";
import * as path from "path";
import { loadEnvConfig } from "@next/env";
import { parseBytesDebug } from "../src/lib/parser/index";
import { traceEventDates } from "../src/lib/parser/trace";
import { GROUND_TRUTH } from "./ground-truth";

const ROOT = path.resolve(__dirname, "..");
loadEnvConfig(ROOT);
const SOURCES = path.join(ROOT, "sources", "Sylabus examples");
const OUT_DIR = path.join(ROOT, "debug", "parser");

// Same grouping as scripts/generate-fixtures.ts — the real sample syllabi.
const GROUPS: Record<string, string[]> = {
  "hba1-s1": [
    "HBA1/First semester/HBA Course Outline 2025-2026 BUS3303 Sec 3&4.pdf",
    "HBA1/First semester/3302 Outline 2025-2026 Updated 8272025.pdf",
    "HBA1/First semester/HBA Course Outline AFF 2025-2026.pdf",
    "HBA1/First semester/3316 Course Outline 2025.pdf",
    "HBA1/First semester/Course Outline LPO 2025.pdf",
  ],
  "hba1-s2": [
    "HBA1/Second Semester/3304 Operations Course Outline.pdf",
    "HBA1/Second Semester/BUS 3301 HBA Course Outline.pdf",
    "HBA1/Second Semester/HBA Course Outline 2025-2026 LIT.pdf",
    "HBA1/Second Semester/3300 - HBA Course Outline 2025-2026.pdf",
  ],
  "ds-s1": [
    "Data Science/First semester/MATH1600A.pdf",
    "Data Science/First semester/2022-CS1026-a.pdf",
    "Data Science/First semester/Film1020E-002.pdf",
    "Data Science/First semester/CALC1000A.pdf",
  ],
  "ds-s2": [
    "Data Science/Second Semester/CALC1501B-2023.pdf",
    "Data Science/Second Semester/CS_1027B_FW24.pdf",
    "Data Science/Second Semester/DS1000---S2023-Course-Outline.pdf",
  ],
};

const ALL = Object.values(GROUPS).flat();

// ── tiny formatting helpers ──────────────────────────────────────────────
const BOLD = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;
const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));
const monthDay = (iso: string) => iso.slice(5); // "YYYY-MM-DD" -> "MM-DD"

// Loose title match: case-insensitive, alphanumeric-only, substring either way.
function titleMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

// ── argument parsing ─────────────────────────────────────────────────────
function resolveTargets(argv: string[]): string[] {
  const positional = argv.filter((a) => !a.startsWith("--"));
  const groupFlagIdx = argv.indexOf("--group");

  if (argv.includes("--all")) return ALL;

  if (groupFlagIdx !== -1) {
    const name = argv[groupFlagIdx + 1];
    const group = GROUPS[name];
    if (!group) {
      console.error(`Unknown group "${name}". Known: ${Object.keys(GROUPS).join(", ")}`);
      process.exit(1);
    }
    return group;
  }

  if (positional.length) {
    // Substring match against the relative paths.
    const matched = ALL.filter((rel) =>
      positional.some((q) => rel.toLowerCase().includes(q.toLowerCase()))
    );
    if (!matched.length) {
      console.error(`No syllabus matched: ${positional.join(", ")}`);
      process.exit(1);
    }
    return matched;
  }

  return [];
}

// ── per-syllabus report ──────────────────────────────────────────────────
interface Scored {
  filename: string;
  matched: number;
  missing: number;
  wrongDate: number;
  extra: number;
}

async function reportOne(rel: string, check: boolean): Promise<Scored | null> {
  const absPath = path.join(SOURCES, rel);
  const filename = path.basename(absPath);

  if (!fs.existsSync(absPath)) {
    console.warn(`  WARN: not found: ${absPath}`);
    return null;
  }

  const data = fs.readFileSync(absPath);
  const { content, raw, course } = await parseBytesDebug(data, filename);

  // Dump artifacts.
  const dir = path.join(OUT_DIR, filename.replace(/\.[^.]+$/, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "cleaned.txt"),
    content.kind === "text"
      ? content.text
      : "[scanned/image PDF — sent to the vision model as a document, no extracted text]"
  );
  fs.writeFileSync(path.join(dir, "raw.json"), JSON.stringify(raw, null, 2));
  fs.writeFileSync(path.join(dir, "course.json"), JSON.stringify(course, null, 2));

  // Header.
  const weightSum = course.gradeComponents.reduce((s, c) => s + c.weight, 0);
  const weightFlag = Math.abs(weightSum - 100) > 0.5 ? `  ⚠️ sum=${weightSum}` : "";
  console.log("");
  console.log(BOLD(`━━ ${filename}`));
  console.log(`   ${course.code} — ${course.title}  ${DIM(`(${course.term})`)}`);
  console.log(
    `   path: ${content.kind === "text" ? "text" : "VISION"}   ` +
      `components: ${course.gradeComponents.length} (weights=${weightSum}%${weightFlag})`
  );

  // Date trace.
  const trace = traceEventDates(raw);
  console.log(
    `   events: ${trace.extracted} extracted → ${course.events.length} in course` +
      `   ${DIM(`[no-date dropped: ${trace.droppedNoDate}, resurrected out-of-window: ${trace.resurrected}]`)}`
  );
  if (trace.rows.length) {
    console.log(
      DIM(`   ${pad("title", 34)} ${pad("raw(LLM)", 12)} ${pad("anchored", 12)} win  verdict`)
    );
    for (const r of trace.rows) {
      const win = r.inWindow == null ? " — " : r.inWindow ? "yes" : "no ";
      const icon =
        r.reason === "kept" ? "✅" : r.reason === "resurrected" ? "♻️ " : "🗑️ ";
      console.log(
        `   ${pad(r.title, 34)} ${pad(r.rawDate || "(none)", 12)} ` +
          `${pad(r.anchoredDate || "—", 12)} ${win}  ${icon} ${r.reason}`
      );
    }
  }
  if (course.events.length > trace.kept) {
    console.log(
      DIM(`   + ${course.events.length - trace.kept} event(s) from recurring-assignment expansion`)
    );
  }

  // Accuracy check.
  if (!check) return null;
  const gt = GROUND_TRUTH[filename];
  if (!gt) {
    console.log(DIM("   (no ground truth — skipped in --check)"));
    return null;
  }

  console.log(BOLD("   ── accuracy vs ground truth ──"));
  let matched = 0;
  let missing = 0;
  let wrongDate = 0;
  const usedParsed = new Set<string>();

  for (const exp of gt.expectedEvents) {
    const hit = course.events.find(
      (e) => !usedParsed.has(e.id) && titleMatch(e.title, exp.title)
    );
    if (!hit) {
      missing++;
      console.log(`   ❌ MISSING  ${pad(exp.title, 28)} expected ${monthDay(exp.date)}`);
      continue;
    }
    usedParsed.add(hit.id);
    if (exp.date && monthDay(hit.date) !== monthDay(exp.date)) {
      wrongDate++;
      console.log(
        `   🗓️ WRONG    ${pad(exp.title, 28)} expected ${monthDay(exp.date)}  got ${monthDay(hit.date)}`
      );
    } else {
      matched++;
      console.log(`   ✅ OK       ${pad(exp.title, 28)} ${monthDay(hit.date)}`);
    }
  }

  // Extra dated events the parser produced that aren't in ground truth.
  const extraEvents = course.events.filter(
    (e) => !usedParsed.has(e.id) && !e.recurringPattern
  );
  const extra = extraEvents.length;
  if (extra) {
    console.log(DIM(`   ⚠️ ${extra} extra parsed event(s) not in ground truth (may be legit):`));
    for (const e of extraEvents.slice(0, 8)) {
      console.log(DIM(`       ${pad(e.title, 40)} ${e.date}`));
    }
    if (extra > 8) console.log(DIM(`       … and ${extra - 8} more`));
  }

  // Component weight check.
  if (gt.expectedComponents) {
    for (const ec of gt.expectedComponents) {
      const pc = course.gradeComponents.find((c) => titleMatch(c.name, ec.name));
      if (!pc) console.log(`   ❌ component MISSING: ${ec.name} (${ec.weight}%)`);
      else if (Math.abs(pc.weight - ec.weight) > 0.5)
        console.log(`   🗓️ component weight: ${ec.name} expected ${ec.weight}% got ${pc.weight}%`);
    }
  }

  const total = gt.expectedEvents.length;
  console.log(
    BOLD(`   score: ${matched}/${total} dates correct`) +
      `  (${missing} missing, ${wrongDate} wrong-date, ${extra} extra)`
  );
  return { filename, matched, missing, wrongDate, extra };
}

async function main() {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const targets = resolveTargets(argv);

  if (!targets.length) {
    console.log(
      [
        "Usage:",
        "  npx tsx scripts/debug-parse.ts --all [--check]",
        "  npx tsx scripts/debug-parse.ts --group <hba1-s1|hba1-s2|ds-s1|ds-s2> [--check]",
        '  npx tsx scripts/debug-parse.ts "<filename substring>" [--check]',
      ].join("\n")
    );
    process.exit(0);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY is not set (expected in .env.local).");
    process.exit(1);
  }

  console.log(`Parsing ${targets.length} syllabus/syllabi → artifacts in ${path.relative(ROOT, OUT_DIR)}/`);

  // Parse concurrently but report in input order for stable output.
  const results = await Promise.all(
    targets.map(async (rel) => {
      try {
        return await reportOne(rel, check);
      } catch (err) {
        console.error(`  ✗ ${rel} failed: ${err instanceof Error ? err.message : err}`);
        return null;
      }
    })
  );

  if (check) {
    const scored = results.filter((r): r is Scored => r !== null);
    if (scored.length) {
      const sum = scored.reduce(
        (a, s) => ({
          matched: a.matched + s.matched,
          missing: a.missing + s.missing,
          wrongDate: a.wrongDate + s.wrongDate,
          extra: a.extra + s.extra,
        }),
        { matched: 0, missing: 0, wrongDate: 0, extra: 0 }
      );
      const totalExpected = sum.matched + sum.missing + sum.wrongDate;
      console.log("");
      console.log(BOLD("══ OVERALL ══"));
      console.log(
        `   ${sum.matched}/${totalExpected} dates correct across ${scored.length} checked syllabi` +
          `  (${sum.missing} missing, ${sum.wrongDate} wrong-date, ${sum.extra} extra)`
      );
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
