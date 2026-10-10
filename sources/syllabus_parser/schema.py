"""JSON schema for Claude structured extraction + normalization into the app's
course shape.

`EXTRACT_SCHEMA` is what Claude is forced to emit (via output_config.format).
`normalize_and_validate` turns that raw extraction into the exact object shape
the Kyber app consumes (see src/data/sampleData.js), filling every required
field with a sensible default so the front end never breaks on a missing key.
"""

import re

# Per-course accent palette, matching the app's SEG_COLORS / sample data.
PALETTE = ["#f97316", "#38bdf8", "#34d399", "#a78bfa", "#f5c451"]

# Grade-component types the app styles.
COMPONENT_TYPES = ["assignment", "exam", "lab", "quiz"]
# Event types the app styles (src/lib/events.js typeClass).
EVENT_TYPES = ["reading", "assignment", "quiz", "exam", "lab"]

# ---------------------------------------------------------------------------
# The schema Claude must fill. Strict structured output requires every object to
# set additionalProperties:false and list all properties in "required", so we
# avoid optional keys and use sentinels (0 / "") that normalization interprets.
# ---------------------------------------------------------------------------
EXTRACT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "code": {"type": "string", "description": "Course code, e.g. 'PSYC 101'. Empty string if unknown."},
        "title": {"type": "string", "description": "Full course title, e.g. 'Intro to Psychology'."},
        "term": {"type": "string", "description": "Term, e.g. 'Fall 2026'. Empty string if unknown."},
        "instructor": {"type": "string", "description": "Instructor name. Empty string if unknown."},
        "targetGrade": {
            "type": "number",
            "description": "The grade goal the syllabus states, else 85.",
        },
        "subjects": {
            "type": "array",
            "description": "The topics / units the course covers, in schedule order.",
            "items": {"type": "string"},
        },
        "tips": {
            "type": "array",
            "description": "Short, concrete things a student should know to do well (exam style, workload quirks, what's weighted heavily).",
            "items": {"type": "string"},
        },
        "studyMethod": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "name": {"type": "string", "description": "A study approach that fits how this course is graded."},
                "why": {"type": "string", "description": "One sentence on why it fits."},
            },
            "required": ["name", "why"],
        },
        "gradeComponents": {
            "type": "array",
            "description": "Every graded component with its weight.",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "weight": {"type": "number", "description": "Percent of final grade (0-100)."},
                    "type": {"type": "string", "enum": COMPONENT_TYPES},
                    "count": {"type": "integer", "description": "Number of individual items (e.g. 12 quizzes). 1 if a single item or unknown."},
                    "dropLowest": {"type": "integer", "description": "How many lowest items are dropped. 0 if none."},
                },
                "required": ["name", "weight", "type", "count", "dropLowest"],
            },
        },
        "events": {
            "type": "array",
            "description": "Every dated deadline, exam, lab, quiz, or assigned reading.",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "type": {"type": "string", "enum": EVENT_TYPES},
                    "title": {"type": "string"},
                    "date": {"type": "string", "description": "ISO date YYYY-MM-DD. Empty string if no date is given."},
                    "weight": {"type": "number", "description": "Percent of grade; 0 for readings."},
                    "component": {"type": "string", "description": "The gradeComponents name this belongs to, or empty string."},
                },
                "required": ["type", "title", "date", "weight", "component"],
            },
        },
        "policies": {
            "type": "array",
            "description": "Notable syllabus policies as label/value pairs (late penalty, attendance, drops, exam format).",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "label": {"type": "string"},
                    "value": {"type": "string"},
                },
                "required": ["label", "value"],
            },
        },
    },
    "required": [
        "code", "title", "term", "instructor", "targetGrade",
        "subjects", "tips", "studyMethod", "gradeComponents", "events", "policies",
    ],
}

ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def slugify(text, fallback="item"):
    s = re.sub(r"[^a-z0-9]+", "", (text or "").lower())
    return s or fallback


def _num(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def normalize_and_validate(raw, color=PALETTE[0], today=None):
    """Turn a raw extraction dict into the app's course object, filling all
    required fields. Pure — no I/O. `color` is the accent hex; `today` (ISO)
    only affects currentTopic selection when a schedule is present.
    """
    raw = raw or {}
    code = (raw.get("code") or "").strip() or "COURSE"
    title = (raw.get("title") or "").strip() or code
    cid = slugify(code, "course")

    # --- grade components ---
    seen_ids = set()
    components = []
    for c in raw.get("gradeComponents") or []:
        name = (c.get("name") or "").strip()
        if not name:
            continue
        comp_id = slugify(name, f"comp{len(components)}")
        while comp_id in seen_ids:
            comp_id += "x"
        seen_ids.add(comp_id)
        ctype = c.get("type") if c.get("type") in COMPONENT_TYPES else "assignment"
        count = c.get("count")
        try:
            count = max(int(count), 1)
        except (TypeError, ValueError):
            count = 1
        comp = {
            "id": comp_id,
            "name": name,
            "weight": round(_num(c.get("weight")), 2),
            "type": ctype,
            "scores": [None] * count,  # syllabi never contain the student's scores
        }
        drop = c.get("dropLowest")
        try:
            drop = int(drop)
        except (TypeError, ValueError):
            drop = 0
        if drop > 0:
            comp["dropLowest"] = drop
        components.append(comp)

    # Map a component name (as referenced by an event) to its id.
    name_to_id = {c["name"].lower(): c["id"] for c in components}

    # --- events ---
    events = []
    for i, e in enumerate(raw.get("events") or []):
        date = (e.get("date") or "").strip()
        if not ISO_DATE.match(date):
            continue  # the app's date math needs a real ISO date
        etype = e.get("type") if e.get("type") in EVENT_TYPES else "assignment"
        ev = {
            "id": f"{cid}-e{i}",
            "type": etype,
            "title": (e.get("title") or "Untitled").strip(),
            "date": date,
            "weight": round(_num(e.get("weight")), 2),
        }
        comp_name = (e.get("component") or "").strip().lower()
        if comp_name and comp_name in name_to_id:
            ev["component"] = name_to_id[comp_name]
        events.append(ev)
    events.sort(key=lambda e: e["date"])

    # --- subjects / current topic ---
    subjects = [s.strip() for s in (raw.get("subjects") or []) if s and s.strip()]
    current_topic = _pick_current_topic(subjects, title)

    # --- study method ---
    sm = raw.get("studyMethod") or {}
    study_method = {
        "name": (sm.get("name") or "Active recall + spaced practice").strip(),
        "why": (sm.get("why") or "A reliable default for most courses — short, spaced review sessions.").strip(),
    }

    # --- target grade ---
    target = _num(raw.get("targetGrade"), 85)
    if not (50 <= target <= 100):
        target = 85

    tips = [t.strip() for t in (raw.get("tips") or []) if t and t.strip()]
    policies = [
        {"label": (p.get("label") or "").strip(), "value": (p.get("value") or "").strip()}
        for p in (raw.get("policies") or [])
        if (p.get("label") or "").strip() and (p.get("value") or "").strip()
    ]

    return {
        "id": cid,
        "code": code,
        "title": title,
        "term": (raw.get("term") or "").strip() or "This term",
        "instructor": (raw.get("instructor") or "").strip() or "Instructor",
        "color": color,
        "targetGrade": int(round(target)),
        "currentTopic": current_topic,
        "studyMethod": study_method,
        "gradeComponents": components,
        "events": events,
        "policies": policies,
        # additive fields the app surfaces if present
        "subjects": subjects,
        "tips": tips,
    }


def _pick_current_topic(subjects, title):
    if subjects:
        return subjects[0]
    return title
