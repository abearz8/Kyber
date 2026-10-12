"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";

interface Props {
  courses: Course[];
  onClose: () => void;
}

const SCHOOL_PALETTES = [
  {
    name: "Western University",
    short: "Western",
    colors: ["#4F2683", "#D4C169", "#005FAD", "#A8A9AD"],
  },
  {
    name: "Queen's University",
    short: "Queen's",
    colors: ["#9E1B32", "#002452", "#C69214", "#6E6E6E"],
  },
  {
    name: "McMaster University",
    short: "McMaster",
    colors: ["#7A003C", "#FDBF57", "#8DC8E8", "#5E6A71"],
  },
  {
    name: "University of Toronto",
    short: "U of T",
    colors: ["#002A5C", "#1D6FA5", "#E31837", "#DAA520"],
  },
  {
    name: "Laurier University",
    short: "Laurier",
    colors: ["#6F1D78", "#E2AE33", "#003DA5", "#5E6A71"],
  },
  {
    name: "Waterloo",
    short: "Waterloo",
    colors: ["#FFC72C", "#1C1C1C", "#6E6E6E", "#E06030"],
  },
  {
    name: "University of Ottawa",
    short: "uOttawa",
    colors: ["#8F001A", "#5C6BC0", "#B5B5B5", "#607D8B"],
  },
  {
    name: "Carleton University",
    short: "Carleton",
    colors: ["#BF112B", "#E6A817", "#1C1C1C", "#607D8B"],
  },
  {
    name: "McGill University",
    short: "McGill",
    colors: ["#ED1B2F", "#B5B5B5", "#002147", "#DAA520"],
  },
  {
    name: "UBC",
    short: "UBC",
    colors: ["#002145", "#FFD100", "#0055B7", "#6EC4E8"],
  },
];

const INDIVIDUAL_COLORS = [
  "#e8784a", "#5aa6e6", "#3faf76", "#987be8", "#d3a608",
  "#e0564a", "#4F2683", "#9E1B32", "#7A003C", "#002A5C",
  "#FFC72C", "#00897B",
];

export default function ColorPaletteModal({ courses, onClose }: Props) {
  const { dispatch } = useStore();
  const [appliedSchool, setAppliedSchool] = useState<string | null>(null);

  function applySchoolPalette(palette: typeof SCHOOL_PALETTES[0]) {
    courses.forEach((course, i) => {
      dispatch({
        type: "UPDATE_COURSE_COLOR",
        courseId: course.id,
        color: palette.colors[i % palette.colors.length],
      });
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
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50 }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 51,
          background: "var(--bg)", borderRadius: "20px 20px 0 0",
          padding: "0 0 40px",
          maxHeight: "82%",
          display: "flex", flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--line)" }} />
        </div>

        <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <h2 style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 22, color: "var(--ink)", margin: 0 }}>
              Course colours
            </h2>
            <button
              onClick={onClose}
              style={{ background: "var(--cream-deep)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-2)", margin: "6px 0 0" }}>
            Apply a school palette or pick individual colours.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "16px 20px" }}>

          {/* School palettes */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            School palettes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {SCHOOL_PALETTES.map((palette) => {
              const applied = appliedSchool === palette.name;
              return (
                <button
                  key={palette.name}
                  onClick={() => applySchoolPalette(palette)}
                  className="w-full text-left flex items-center gap-3"
                  style={{
                    background: applied ? "var(--cream-deep)" : "var(--surface)",
                    border: applied ? "1.5px solid var(--orange-cta)" : "1px solid var(--line)",
                    borderRadius: 14, padding: "12px 14px", cursor: "pointer",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  {/* Swatches */}
                  <div className="flex gap-1.5">
                    {palette.colors.map((col, i) => (
                      <span key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: col, display: "block", flexShrink: 0 }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", flex: 1 }}>{palette.name}</span>
                  {applied && (
                    <span style={{ fontSize: 12, color: "var(--orange-cta)", fontWeight: 700 }}>Applied ✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Per-course colours */}
          {courses.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                Individual courses
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {courses.map((course) => (
                  <div key={course.id} style={{ background: "var(--surface)", borderRadius: 14, padding: "12px 14px", boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: course.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{course.code}</span>
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{course.title}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {INDIVIDUAL_COLORS.map((col, ci) => (
                        <button
                          key={`${col}-${ci}`}
                          onClick={() => setCourseColor(course.id, col)}
                          style={{
                            width: 28, height: 28, borderRadius: "50%", background: col, border: "none", cursor: "pointer",
                            outline: course.color === col ? `2.5px solid ${col}` : "none",
                            outlineOffset: 2,
                            transform: course.color === col ? "scale(1.15)" : "scale(1)",
                            transition: "transform .15s",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
