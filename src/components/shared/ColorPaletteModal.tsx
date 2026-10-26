"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";
import { BottomSheet, Card, Label, CheckIcon } from "./ui";

interface Props {
  courses: Course[];
  onClose: () => void;
  /** Show this course's swatch row first (course page "Course colour"). */
  focusCourseId?: string;
}

const SCHOOL_PALETTES = [
  { name: "Western University", short: "Western", colors: ["#4F2683", "#D4C169", "#005FAD", "#A8A9AD"] },
  { name: "Queen's University", short: "Queen's", colors: ["#9E1B32", "#002452", "#C69214", "#6E6E6E"] },
  { name: "McMaster University", short: "McMaster", colors: ["#7A003C", "#FDBF57", "#8DC8E8", "#5E6A71"] },
  { name: "University of Toronto", short: "U of T", colors: ["#002A5C", "#1D6FA5", "#E31837", "#DAA520"] },
  { name: "Laurier University", short: "Laurier", colors: ["#6F1D78", "#E2AE33", "#003DA5", "#5E6A71"] },
  { name: "Waterloo", short: "Waterloo", colors: ["#FFC72C", "#1C1C1C", "#6E6E6E", "#E06030"] },
  { name: "University of Ottawa", short: "uOttawa", colors: ["#8F001A", "#5C6BC0", "#B5B5B5", "#607D8B"] },
  { name: "Carleton University", short: "Carleton", colors: ["#BF112B", "#E6A817", "#1C1C1C", "#607D8B"] },
  { name: "McGill University", short: "McGill", colors: ["#ED1B2F", "#B5B5B5", "#002147", "#DAA520"] },
  { name: "UBC", short: "UBC", colors: ["#002145", "#FFD100", "#0055B7", "#6EC4E8"] },
];

const INDIVIDUAL_COLORS = [
  "#4F2683", "#8A5FBF", "#B48CFF", "#8FB3E0", "#8ECDF8", "#1AA9A0",
  "#9CC5A1", "#5BC98C", "#FFC857", "#FF6A00", "#FF8A7A", "#FFAAA5",
  "#E8784A", "#9E1B32", "#002A5C", "#A7A9AC",
];

export default function ColorPaletteModal({ courses, onClose, focusCourseId }: Props) {
  const { dispatch } = useStore();
  const [appliedSchool, setAppliedSchool] = useState<string | null>(null);

  const ordered = focusCourseId
    ? [...courses].sort((a, b) => (a.id === focusCourseId ? -1 : b.id === focusCourseId ? 1 : 0))
    : courses;

  function applySchoolPalette(palette: typeof SCHOOL_PALETTES[0]) {
    courses.forEach((course, i) => {
      dispatch({ type: "UPDATE_COURSE_COLOR", courseId: course.id, color: palette.colors[i % palette.colors.length] });
    });
    setAppliedSchool(palette.name);
    track.appearanceCustomized("palette");
    setTimeout(() => setAppliedSchool(null), 1800);
  }

  function setCourseColor(courseId: string, color: string) {
    dispatch({ type: "UPDATE_COURSE_COLOR", courseId, color });
    track.appearanceCustomized("palette");
  }

  return (
    <BottomSheet onClose={onClose} zIndex={56} title={focusCourseId ? "Course colour" : "Course colours"} subtitle={focusCourseId ? "Pick a colour for this course." : "Apply a school palette or pick individual colours."}>
      {/* Per-course colours first when focused */}
      {ordered.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <Label style={{ display: "block", marginBottom: 8 }}>{focusCourseId ? "This course" : "Individual courses"}</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(focusCourseId ? ordered.filter((c) => c.id === focusCourseId) : ordered).map((course) => (
              <Card key={course.id} pad="12px 14px" style={{ borderRadius: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: course.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{course.code}</span>
                  <span style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course.title}</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {INDIVIDUAL_COLORS.map((col) => {
                    const active = course.color.toLowerCase() === col.toLowerCase();
                    return (
                      <button
                        key={col}
                        onClick={() => setCourseColor(course.id, col)}
                        aria-label={`Use ${col}`}
                        style={{
                          width: 32, height: 32, borderRadius: "50%", background: col, border: "none", cursor: "pointer",
                          outline: active ? "2.5px solid var(--ink)" : "none", outlineOffset: 2,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {active && <CheckIcon size={14} />}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 18 }}>
        <Label style={{ display: "block", marginBottom: 8 }}>School palettes</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SCHOOL_PALETTES.map((palette) => {
            const applied = appliedSchool === palette.name;
            return (
              <Card
                key={palette.name}
                pad="12px 14px"
                onClick={() => applySchoolPalette(palette)}
                style={{ borderRadius: 16, display: "flex", alignItems: "center", gap: 12, background: applied ? "var(--soft)" : undefined, borderColor: applied ? "var(--amber)" : undefined }}
              >
                <div style={{ display: "flex", gap: 5 }}>
                  {palette.colors.map((col, i) => (
                    <span key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: col, display: "block" }} />
                  ))}
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", flex: 1 }}>{palette.name}</span>
                {applied && <span style={{ fontSize: 14, color: "var(--amber-deep)", fontWeight: 700 }}>Applied ✓</span>}
              </Card>
            );
          })}
        </div>
      </section>
    </BottomSheet>
  );
}
