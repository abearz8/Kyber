"""Orchestration: file bytes/paths -> validated course objects the app consumes."""

import os

from .extract import extract, extract_text_from_string
from .llm import extract_with_claude
from .schema import PALETTE, normalize_and_validate


def parse_bytes(data, filename="", color=PALETTE[0], model=None, client=None):
    extracted = extract(data, filename)
    raw = extract_with_claude(extracted, model=model, client=client)
    course = normalize_and_validate(raw, color=color)
    # Fall back to the filename for a course code if extraction found none.
    if course["code"] == "COURSE" and filename:
        course["code"] = os.path.splitext(os.path.basename(filename))[0][:24]
    return course


def parse_text(text, color=PALETTE[0], model=None, client=None):
    extracted = extract_text_from_string(text)
    raw = extract_with_claude(extracted, model=model, client=client)
    return normalize_and_validate(raw, color=color)


def parse_file(path, color=PALETTE[0], model=None, client=None):
    with open(path, "rb") as f:
        data = f.read()
    return parse_bytes(data, filename=os.path.basename(path), color=color, model=model, client=client)


def parse_many(paths, model=None, client=None):
    """Parse several files into the app's `{courses: [...]}` shape, assigning a
    distinct accent color to each and de-duplicating course ids."""
    from anthropic import Anthropic

    client = client or Anthropic()  # reuse one client across the batch (cache-friendly)
    courses = []
    seen = set()
    for i, path in enumerate(paths):
        color = PALETTE[i % len(PALETTE)]
        course = parse_file(path, color=color, model=model, client=client)
        base = course["id"]
        while course["id"] in seen:
            course["id"] += "x"
        seen.add(course["id"])
        courses.append(course)
    return {"courses": courses}
