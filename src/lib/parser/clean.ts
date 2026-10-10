/**
 * Text pre-processing before sending to Claude.
 * Port of sources/syllabus_parser/clean.py
 */

/** Remove repeated header/footer lines, page numbers, URLs, and extra whitespace. */
export function cleanText(raw: string): string {
  const lines = raw.split("\n");
  const totalPages = Math.max(1, countPageBreaks(lines));

  // Count how often each line appears
  const freq = new Map<string, number>();
  for (const line of lines) {
    const t = line.trim();
    if (t) freq.set(t, (freq.get(t) ?? 0) + 1);
  }

  // A line is a repeated header/footer if it appears on ≥2% of pages and ≥4 times
  const isBoilerplate = (line: string): boolean => {
    const t = line.trim();
    if (!t) return false;
    const count = freq.get(t) ?? 0;
    return count >= 4 && count / totalPages >= 0.02;
  };

  const pageNumRe = /^\s*\d+\s*(\/\s*\d+)?\s*$/;
  const urlRe = /https?:\/\/\S+/g;

  const cleaned = lines
    .filter((l) => !isBoilerplate(l) && !pageNumRe.test(l))
    .map((l) => l.replace(urlRe, "").trimEnd());

  // Collapse multiple consecutive blank lines into one
  const out: string[] = [];
  let prevBlank = false;
  for (const l of cleaned) {
    const blank = l.trim() === "";
    if (blank && prevBlank) continue;
    out.push(l);
    prevBlank = blank;
  }

  return out.join("\n").trim();
}

function countPageBreaks(lines: string[]): number {
  // Form-feed (\f) is a common PDF page separator
  return lines.filter((l) => l.includes("\f")).length || Math.ceil(lines.length / 40);
}
