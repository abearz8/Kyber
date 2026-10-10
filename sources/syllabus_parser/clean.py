"""Text cleanup: strip the repeated headers/footers, page numbers, and other
boilerplate that add noise before the text goes to Claude. Conservative — it
only removes lines that are very likely noise, never real syllabus content.
"""

import re
from collections import Counter

_PAGE_NUM = re.compile(r"^\s*(page\s*)?\d+(\s*(/|of)\s*\d+)?\s*$", re.I)
_URL = re.compile(r"https?://\S+")
_WS = re.compile(r"[ \t]+")


def clean_text(text):
    if not text:
        return ""

    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")

    # Lines that repeat on many pages are almost always running headers/footers.
    stripped = [ln.strip() for ln in lines]
    counts = Counter(s for s in stripped if s)
    total_nonblank = sum(1 for s in stripped if s) or 1
    repeated = {
        s
        for s, n in counts.items()
        # short line that shows up on a large fraction of "pages"
        if n >= 4 and n / total_nonblank > 0.02 and len(s) <= 80
    }

    out = []
    blank_run = 0
    for raw in lines:
        line = _URL.sub("", raw).rstrip()
        s = line.strip()
        if not s:
            blank_run += 1
            if blank_run <= 1:
                out.append("")
            continue
        blank_run = 0
        if _PAGE_NUM.match(s):
            continue
        if s in repeated:
            continue
        out.append(_WS.sub(" ", line))

    return "\n".join(out).strip()
