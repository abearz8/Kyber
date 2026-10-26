/**
 * Single Claude API call that forces structured output via tool use.
 * Port of sources/syllabus_parser/llm.py
 */

import Anthropic from "@anthropic-ai/sdk";
import { EXTRACT_SCHEMA, type RawExtraction } from "./schema";
import type { ExtractedContent } from "./extract";

// Cost-minimized model selection:
// - Text-layer syllabi (the common case) use Haiku — the cheapest model that
//   reliably extracts structured data. This covers nearly every real upload.
// - Only scanned/image PDFs fall back to Sonnet's vision, where the extra
//   accuracy on OCR-quality pages is worth the cost. This path is rare.
const TEXT_MODEL = process.env.KYBER_PARSER_MODEL || "claude-haiku-4-5";
const VISION_MODEL =
  process.env.KYBER_PARSER_VISION_MODEL || "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a university course syllabus parser. Extract structured course information from the provided syllabus. Be thorough and accurate.

DATES
- Always use ISO format YYYY-MM-DD, using the year printed in the syllabus (do not shift years yourself).
- Extract EVERY dated deadline, exam, quiz, lab, and reading you can find, including ones in weekly schedule tables.
- Exams are often NOT given an exact date (e.g. "the final is scheduled by the registrar within the Dec 10–22 exam period"). Do NOT leave these out. Instead, set the event's \`date\` to the START of the stated period (e.g. 2024-12-10), set \`dateConfirmed\` to false, and put the exact wording in \`dateNote\` (e.g. "Registrar-scheduled; exam period Dec 10–22"). Only leave \`date\` empty when the syllabus gives no date AND no period/range at all.
- For a date you read exactly as written, set \`dateConfirmed\` to true and leave \`dateNote\` empty.

SCHEDULE HONESTY
- Many syllabi contain NO dates at all (the schedule is distributed separately or posted on the LMS). In that case the correct answer is an EMPTY \`events\` array with \`scheduleFound\` = false. Never invent, guess, or assume a "typical" date. A missing date is far better than a wrong one.
- Never derive a date from a week number ("Week 5", "Lecture 7") unless the syllabus itself prints the week-to-date mapping. If it does not, leave that event's \`date\` empty.
- Set \`scheduleFound\` = true only when at least one event has a date read from the document (exact, or the start of a stated period). When it is false, put a one-sentence explanation in \`scheduleNote\` (e.g. "Schedule is posted on the LMS; the outline lists no dates"). Leave \`scheduleNote\` empty otherwise.

GRADES
- Capture every graded component with its weight as a percentage (0–100). Weights should sum to about 100.`;

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_syllabus",
  description: "Extract structured course information from a syllabus.",
  input_schema: EXTRACT_SCHEMA as Anthropic.Tool["input_schema"],
};

export async function extractWithClaude(
  content: ExtractedContent,
  client: Anthropic
): Promise<RawExtraction> {
  const model = content.kind === "pdf" ? VISION_MODEL : TEXT_MODEL;

  // Use any[] for user content to accommodate both text and document blocks
  // (the SDK types are stricter than the API supports for document/PDF blocks)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userContent: any[] =
    content.kind === "text"
      ? [{ type: "text", text: `Parse this syllabus:\n\n${content.text}` }]
      : [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: content.mediaType,
              data: content.dataBase64,
            },
          },
          {
            type: "text",
            text: "Extract all course information from this syllabus PDF.",
          },
        ];

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "any" },
    messages: [{ role: "user", content: userContent }],
  });

  // Find the tool use block
  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === "extract_syllabus") {
      return block.input as RawExtraction;
    }
  }

  throw new Error("Claude did not call the extract_syllabus tool");
}
