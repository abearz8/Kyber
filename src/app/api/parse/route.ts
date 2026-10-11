import { NextRequest, NextResponse } from "next/server";
import { parseBytes, parseMany } from "@/lib/parser";
import { PALETTE } from "@/lib/types";

export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB total

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const fileEntries = formData.getAll("files");

      if (!fileEntries.length) {
        return NextResponse.json({ error: "No files provided" }, { status: 400 });
      }

      let totalBytes = 0;
      const files: Array<{ data: Buffer; filename: string }> = [];

      for (const entry of fileEntries) {
        if (!(entry instanceof File)) continue;
        const arrayBuffer = await entry.arrayBuffer();
        totalBytes += arrayBuffer.byteLength;
        if (totalBytes > MAX_BYTES) {
          return NextResponse.json(
            { error: "Total file size exceeds 12 MB" },
            { status: 413 }
          );
        }
        files.push({
          data: Buffer.from(arrayBuffer),
          filename: entry.name,
        });
      }

      if (!files.length) {
        return NextResponse.json({ error: "No valid files" }, { status: 400 });
      }

      // The client parses files concurrently — one request per file — so it can
      // show per-course progress. Each request carries its colorIndex to keep
      // palette colors distinct and stable across those parallel requests.
      const colorIndexRaw = formData.get("colorIndex");
      if (colorIndexRaw != null && files.length === 1) {
        const idx = Number(colorIndexRaw);
        const color = PALETTE[(Number.isFinite(idx) ? idx : 0) % PALETTE.length];
        const course = await parseBytes(files[0].data, files[0].filename, color);
        return NextResponse.json({ courses: [course] });
      }

      const courses = await parseMany(files);
      return NextResponse.json({ courses });
    }

    // JSON body: { files: [{ filename, contentBase64 }] }
    const body = await req.json();
    if (Array.isArray(body.files)) {
      const files = body.files.map(
        (f: { filename: string; contentBase64: string }) => ({
          data: Buffer.from(f.contentBase64, "base64"),
          filename: f.filename,
        })
      );
      const courses = await parseMany(files);
      return NextResponse.json({ courses });
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse failed";
    console.error("[parse] Error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
