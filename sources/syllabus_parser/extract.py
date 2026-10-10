"""Turn raw file bytes into something Claude can read.

Two paths:
  - Text PDFs / .txt: extract text locally (cheap), clean it, send as a text block.
  - Scanned PDFs (little/no text layer): send the raw PDF as a base64 document
    block so Claude reads it with its native PDF/vision support. No OCR engine
    needed — which is what keeps this working on Vercel serverless.

`extract()` returns a dict describing how to feed the content to the LLM:
  {"kind": "text", "text": ...}                 -> text block
  {"kind": "pdf",  "data_b64": ..., "note": ...} -> document block
"""

import base64
import io

from .clean import clean_text

# Below this many extracted characters we assume the PDF is scanned/image-only.
_MIN_TEXT_CHARS = 200
# Bound token cost on pathological inputs. Real syllabi sit well under these.
_MAX_TEXT_CHARS = 60_000   # ~15k tokens of text
_MAX_PDF_PAGES = 20        # scanned pages sent to vision


def _cap_text(text):
    if len(text) > _MAX_TEXT_CHARS:
        return text[:_MAX_TEXT_CHARS]
    return text


def _cap_pdf_pages(data):
    """Trim a scanned PDF to the first N pages so vision cost stays bounded.
    Grading + schedule info is almost always in the opening pages."""
    try:
        from pypdf import PdfReader, PdfWriter

        reader = PdfReader(io.BytesIO(data))
        if len(reader.pages) <= _MAX_PDF_PAGES:
            return data
        writer = PdfWriter()
        for page in reader.pages[:_MAX_PDF_PAGES]:
            writer.add_page(page)
        buf = io.BytesIO()
        writer.write(buf)
        return buf.getvalue()
    except Exception:
        return data


def _looks_like_pdf(data):
    return data[:5] == b"%PDF-"


def extract_pdf_text(data):
    """Best-effort local text extraction. Returns "" if the layer is empty or
    pdfplumber is unavailable."""
    try:
        import pdfplumber
    except ImportError:
        return ""
    text_parts = []
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
    except Exception:
        return ""
    return "\n".join(text_parts)


def extract(data, filename=""):
    name = (filename or "").lower()

    # Plain text / pasted content.
    if name.endswith(".txt") or not _looks_like_pdf(data):
        try:
            text = data.decode("utf-8", errors="replace")
        except Exception:
            text = ""
        return {"kind": "text", "text": _cap_text(clean_text(text))}

    # PDF: try a cheap local text pass first (text is far cheaper than vision).
    raw_text = extract_pdf_text(data)
    cleaned = clean_text(raw_text)
    if len(cleaned) >= _MIN_TEXT_CHARS:
        return {"kind": "text", "text": _cap_text(cleaned)}

    # Sparse/no text layer -> treat as scanned; hand the (page-capped) PDF to Claude.
    capped = _cap_pdf_pages(data)
    return {
        "kind": "pdf",
        "data_b64": base64.standard_b64encode(capped).decode("ascii"),
        "note": "scanned/image PDF — no usable text layer",
    }


def extract_text_from_string(text):
    """Convenience for the /api/parse `{text}` path."""
    return {"kind": "text", "text": clean_text(text or "")}
