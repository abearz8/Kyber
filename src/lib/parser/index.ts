/**
 * Public parser API.
 * Port of sources/syllabus_parser/pipeline.py
 */

import Anthropic from "@anthropic-ai/sdk";
import { extractContent } from "./extract";
import { extractWithClaude } from "./llm";
import { normalize, PALETTE } from "./schema";
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
  const client = getClient();
  const content = await extractContent(data, filename);
  const raw = await extractWithClaude(content, client);
  return normalize(raw, color ?? PALETTE[0]);
}

/** Parse multiple files, assigning palette colors round-robin. */
export async function parseMany(
  files: Array<{ data: Buffer; filename: string }>
): Promise<Course[]> {
  const results: Course[] = [];
  for (let i = 0; i < files.length; i++) {
    const color = PALETTE[i % PALETTE.length];
    const course = await parseBytes(files[i].data, files[i].filename, color);
    results.push(course);
  }
  return results;
}
