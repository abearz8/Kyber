/**
 * Single Claude API call that forces structured output via tool use.
 * Port of sources/syllabus_parser/llm.py
 */

import Anthropic from "@anthropic-ai/sdk";
import { EXTRACT_SCHEMA, type RawExtraction } from "./schema";
import type { ExtractedContent } from "./extract";

const TEXT_MODEL = process.env.KYBER_PARSER_MODEL || "claude-haiku-4-5";
const VISION_MODEL =
  process.env.KYBER_PARSER_VISION_MODEL || "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a university course syllabus parser. Extract structured course information from the provided syllabus. Be thorough and accurate. For dates, always use ISO format YYYY-MM-DD. For grade weights, use percentages (0-100).`;

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
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // Prompt caching — reduces cost for batch parsing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cache_control: { type: "ephemeral" } as any,
      },
    ],
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
