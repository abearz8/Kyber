/**
 * Public parser API.
 * Port of sources/syllabus_parser/pipeline.py
 */

import Anthropic from "@anthropic-ai/sdk";
import { extractContent, type ExtractedContent } from "./extract";
import { extractWithClaude } from "./llm";
import { normalize, PALETTE, type RawExtraction } from "./schema";
import type { Course } from "../types";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _client;
}

/** Parse a single file buffer into a Course. */
export async function parseBytes(
  data: Buffer,
  filename: string,
  color?: string
): Promise<Course> {
  const { course } = await parseBytesDebug(data, filename, color);
  return course;
}

/**
 * Every intermediate artifact the pipeline produces, kept for inspection.
 * `parseBytes` throws all of these away except `course`; the debug harness
 * (scripts/debug-parse.ts) uses them to see where a date was born vs. mangled.
 */
export interface ParseDebug {
  filename: string;
  /** What the LLM actually saw. For text PDFs this is the cleaned text. */
  content: ExtractedContent;
  /** Raw LLM extraction — dates BEFORE academic-year anchoring/filtering. */
  raw: RawExtraction;
  /** Final normalized course — dates AFTER anchoring + window filtering. */
  course: Course;
}

/** Same pipeline as parseBytes, but returns the intermediate stages too. */
export async function parseBytesDebug(
  data: Buffer,
  filename: string,
  color?: string
): Promise<ParseDebug> {
  const client = getClient();
  const content = await extractContent(data, filename);
  const raw = await extractWithClaude(content, client);
  const course = normalize(raw, color ?? PALETTE[0]);
  return { filename, content, raw, course };
}

/**
 * Parse multiple files concurrently, assigning palette colors round-robin.
 * Promise.all preserves input order, so colors stay deterministic.
 */
export async function parseMany(
  files: Array<{ data: Buffer; filename: string }>
): Promise<Course[]> {
  return Promise.all(
    files.map((f, i) => parseBytes(f.data, f.filename, PALETTE[i % PALETTE.length]))
  );
}
