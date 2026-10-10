"""Standalone CLI / test scaffolding.

    export ANTHROPIC_API_KEY=sk-ant-...
    python -m syllabus_parser "/path/to/syllabi/*.pdf" --out out --combined out/courses.json -v

Parses each file, writes one JSON per file (and an optional combined
{"courses": [...]}), and prints a per-file report so you can eyeball quality
across a folder of real syllabi. Nothing about the source files is committed —
they stay wherever they live on your disk.
"""

import argparse
import glob
import json
import os
import sys

from .pipeline import parse_file
from .schema import PALETTE


def _expand(patterns):
    paths = []
    for p in patterns:
        matches = sorted(glob.glob(os.path.expanduser(p)))
        if matches:
            paths.extend(matches)
        elif os.path.exists(os.path.expanduser(p)):
            paths.append(os.path.expanduser(p))
        else:
            print(f"  ! no files matched: {p}", file=sys.stderr)
    return paths


def _report(course):
    n_dates = len(course["events"])
    n_comps = len(course["gradeComponents"])
    n_pol = len(course["policies"])
    n_sub = len(course.get("subjects", []))
    weight_sum = sum(c["weight"] for c in course["gradeComponents"])
    warns = []
    if not course["events"]:
        warns.append("no dated deadlines found")
    if not course["gradeComponents"]:
        warns.append("no grade components found")
    elif abs(weight_sum - 100) > 5:
        warns.append(f"weights sum to {weight_sum:.0f}% (expected ~100)")
    print(f"  {course['code']} — {course['title']}")
    print(f"    {n_comps} components ({weight_sum:.0f}%) · {n_dates} dates · {n_pol} policies · {n_sub} subjects")
    for w in warns:
        print(f"    ! {w}")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="syllabus_parser", description="Parse syllabi into Kyber course JSON.")
    ap.add_argument("paths", nargs="+", help="files or globs (PDF / .txt)")
    ap.add_argument("--out", help="directory to write one <name>.json per file")
    ap.add_argument("--combined", help="write a single {courses:[...]} JSON here")
    ap.add_argument("--model", help="override KYBER_PARSER_MODEL")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args(argv)

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY is not set — the parser needs it to call Claude.", file=sys.stderr)
        return 2

    paths = _expand(args.paths)
    if not paths:
        print("No input files.", file=sys.stderr)
        return 2

    if args.out:
        os.makedirs(args.out, exist_ok=True)

    from anthropic import Anthropic

    client = Anthropic()
    courses, seen = [], set()
    for i, path in enumerate(paths):
        color = PALETTE[i % len(PALETTE)]
        print(f"[{i + 1}/{len(paths)}] {os.path.basename(path)}")
        try:
            course = parse_file(path, color=color, model=args.model, client=client)
        except Exception as e:  # keep going through the batch
            print(f"    ! failed: {e}", file=sys.stderr)
            continue
        while course["id"] in seen:
            course["id"] += "x"
        seen.add(course["id"])
        courses.append(course)
        _report(course)
        if args.out:
            dst = os.path.join(args.out, f"{course['id']}.json")
            with open(dst, "w") as f:
                json.dump(course, f, indent=2, ensure_ascii=False)
        if args.verbose:
            print(json.dumps(course, indent=2, ensure_ascii=False))

    if args.combined:
        os.makedirs(os.path.dirname(os.path.abspath(args.combined)), exist_ok=True)
        with open(args.combined, "w") as f:
            json.dump({"courses": courses}, f, indent=2, ensure_ascii=False)
        print(f"\nWrote {len(courses)} course(s) -> {args.combined}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
