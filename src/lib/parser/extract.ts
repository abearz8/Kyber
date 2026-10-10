/**
 * Convert a file buffer into LLM-ready content.
 * Port of sources/syllabus_parser/extract.py
 *
 * For text PDFs / .txt files: extract the text locally.
 * For scanned PDFs (sparse text layer): send the PDF as base64 to Claude's vision.
 */

const MAX_TEXT_CHARS = 60_000;
const MAX_PDF_PAGES = 20;

export type ExtractedContent =
  | { kind: "text"; text: string }
  | { kind: "pdf"; dataBase64: string; mediaType: "application/pdf" };

export async function extractContent(
  data: Buffer,
  filename: string
): Promise<ExtractedContent> {
  const ext = filename.toLowerCase().split(".").pop() ?? "";

  if (ext === "txt") {
    const text = data.toString("utf-8").slice(0, MAX_TEXT_CHARS);
    return { kind: "text", text };
  }

  if (ext === "pdf") {
    return await extractPdf(data);
  }

  // Fallback: treat as text
  const text = data.toString("utf-8").slice(0, MAX_TEXT_CHARS);
  return { kind: "text", text };
}

async function extractPdf(data: Buffer): Promise<ExtractedContent> {
  try {
    // pdf-parse is CommonJS — use require() to avoid ESM .default issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer, opts?: { max?: number }) => Promise<{ text: string }>;
    const result = await pdfParse(data, { max: MAX_PDF_PAGES });
    const text = result.text || "";

    // If there's meaningful text (>200 chars), use text path (cheaper)
    if (text.trim().length > 200) {
      const { cleanText } = await import("./clean");
      const cleaned = cleanText(text).slice(0, MAX_TEXT_CHARS);
      return { kind: "text", text: cleaned };
    }
  } catch {
    // pdf-parse failed — fall through to vision path
  }

  // Scanned PDF: send raw bytes to Claude's native PDF reader
  const base64 = data.toString("base64");
  return { kind: "pdf", dataBase64: base64, mediaType: "application/pdf" };
}
