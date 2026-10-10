"""Kyber syllabus parser — turns real syllabi into the app's course JSON via Claude.

Public API:
    parse_file(path)        -> one course dict
    parse_bytes(data, name) -> one course dict
    parse_text(text)        -> one course dict
    parse_many(paths)       -> {"courses": [...]}

Standalone CLI:  python -m syllabus_parser <path|glob...> [--out DIR] [--combined FILE]
"""

from .pipeline import parse_bytes, parse_file, parse_many, parse_text
from .schema import normalize_and_validate, PALETTE

__all__ = [
    "parse_bytes",
    "parse_file",
    "parse_many",
    "parse_text",
    "normalize_and_validate",
    "PALETTE",
]
