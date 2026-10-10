"""The single Claude call that turns cleaned syllabus content into the extraction
schema, using forced structured output. Reads ANTHROPIC_API_KEY from the env.
"""

import json
import os

from .schema import EXTRACT_SCHEMA

# Cheap + accurate by default, tiered by difficulty:
#   - clean extracted TEXT (the common case) -> Haiku 4.5: fast and inexpensive,
#     and plenty accurate for structured extraction from text.
#   - SCANNED PDFs sent as images -> Sonnet 4.6: stronger vision for the hard case.
# Both are overridable via env.
TEXT_MODEL = os.environ.get("KYBER_PARSER_MODEL", "claude-haiku-4-5")
VISION_MODEL = os.environ.get("KYBER_PARSER_VISION_MODEL", "claude-sonnet-4-6")

SYSTEM_PROMPT = """You extract structured data from a university course syllabus.

You are given the text (or scanned pages) of ONE syllabus. Ignore boilerplate —
university letterhead, page numbers, accessibility statements, generic academic-
integrity legalese — and pull out only what a student needs to plan the course.

Fill every field of the output schema:
- code, title, term, instructor: from the header. Empty string only if truly absent.
- gradeComponents: every graded component and its weight (percent of final grade).
  Set `count` to the number of individual items (e.g. 12 weekly quizzes -> 12; a
  single final exam -> 1). Set `dropLowest` to how many lowest scores are dropped,
  else 0. Weights should sum to about 100 across components.
- events: every DATED item — exams, quizzes, assignment/project due dates, labs,
  and assigned readings. Use ISO dates (YYYY-MM-DD); infer the year from the term.
  If an item has no date, omit it. `weight` is its percent of the grade (0 for
  readings). `component` is the exact gradeComponents `name` it counts toward, or "".
- subjects: the topics/units the course covers, in the order the schedule lists them.
- tips: a few concrete, specific things that help a student do well in THIS course
  (how exams are structured, what's weighted heavily, workload quirks). No fluff.
- studyMethod: a study approach that fits how this course is actually graded.
- targetGrade: a grade goal if the syllabus states one, otherwise 85.

Be faithful to the document. Do not invent dates, weights, or policies that are
not present. Return only the structured output."""


def _content_blocks(extracted):
    if extracted["kind"] == "pdf":
        return [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": extracted["data_b64"],
                },
            },
            {"type": "text", "text": "Extract the structured syllabus data from this PDF."},
        ]
    return [
        {"type": "text", "text": "Syllabus text:\n\n" + extracted["text"]},
        {"type": "text", "text": "Extract the structured syllabus data above."},
    ]


def extract_with_claude(extracted, model=None, client=None):
    """Call Claude and return the raw extraction dict (matches EXTRACT_SCHEMA).
    Raises on API/parse failure so callers can surface it."""
    from anthropic import Anthropic

    client = client or Anthropic()
    chosen = model or (VISION_MODEL if extracted["kind"] == "pdf" else TEXT_MODEL)
    resp = client.messages.create(
        model=chosen,
        max_tokens=4096,
        thinking={"type": "disabled"},  # structured extraction — keep it fast/deterministic
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},  # static prefix, cached across a batch
            }
        ],
        messages=[{"role": "user", "content": _content_blocks(extracted)}],
        output_config={"format": {"type": "json_schema", "schema": EXTRACT_SCHEMA}},
    )
    text = "".join(getattr(b, "text", "") for b in resp.content if getattr(b, "type", "") == "text")
    return json.loads(text)
