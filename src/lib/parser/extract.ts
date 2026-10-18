/**
 * Convert a file buffer into LLM-ready content.
 * Port of sources/syllabus_parser/extract.py
 *
 * For text PDFs / .txt files: extract the text locally.
 * For scanned PDFs (sparse text layer): send the PDF as base64 to Claude's vision.
 */

// ~30k chars ≈ ~8k input tokens — comfortably covers a multi-page course
// outline (grades, policies, and the full weekly schedule) while keeping the
// per-parse input cost low. Raise only if real syllabi get truncated.
const MAX_TEXT_CHARS = 30_000;
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

// pdf-parse v2 exports a `PDFParse` *class* (not a callable). The old
// `pdfParse(buf)` call signature from v1 throws "pdfParse is not a function",
// which previously got swallowed and silently routed EVERY upload to the
// expensive Claude vision path. Type the class locally so we don't depend on the
// stale v1 `@types/pdf-parse` stub, which still declares the function form.
type PdfParseModule = {
  PDFParse: new (opts: { data: Buffer }) => {
    getText(params?: { first?: number }): Promise<{ text: string }>;
    destroy(): Promise<void>;
  };
};

async function extractPdf(data: Buffer): Promise<ExtractedContent> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require("pdf-parse") as PdfParseModule;
    const parser = new PDFParse({ data });
    let text = "";
    try {
      // `first` caps work to the first N pages — a course outline's grades and
      // schedule are always up front, and it bounds cost on huge PDFs.
      const result = await parser.getText({ first: MAX_PDF_PAGES });
      text = result.text || "";
    } finally {
      await parser.destroy();
    }

    // If there's meaningful text (>200 chars), use text path (cheaper + faster)
    if (text.trim().length > 200) {
      const { cleanText } = await import("./clean");
      const cleaned = cleanText(text).slice(0, MAX_TEXT_CHARS);
      return { kind: "text", text: cleaned };
    }
  } catch (err) {
    // Genuinely-scanned PDF, or a real extraction regression — fall back to
    // Claude's native PDF vision. Warn (don't swallow) so a regression here is
    // visible instead of quietly making every parse slow and expensive.
    console.warn(
      `[parser] PDF text extraction failed, using vision path: ${err instanceof Error ? err.message : err}`
    );
  }

  // Scanned PDF: send raw bytes to Claude's native PDF reader
  const base64 = data.toString("base64");
  return { kind: "pdf", dataBase64: base64, mediaType: "application/pdf" };
}
