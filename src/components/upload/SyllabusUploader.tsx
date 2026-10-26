"use client";

import type { Course } from "@/lib/types";
import OnboardingFrame from "@/components/onboarding/OnboardingFrame";
import { PrimaryButton, TextLink } from "@/components/shared/ui";
import SyllabusDropzone from "./SyllabusDropzone";
import ReadingSyllabi from "./ReadingSyllabi";
import { useSyllabusParser } from "./useSyllabusParser";

interface Props {
  onDone: (courses: Course[]) => void;
  onCancel?: () => void;
}

/** In-app "Add syllabi" overlay (Settings → Upload, "Another syllabus"). */
export default function SyllabusUploader({ onDone, onCancel }: Props) {
  const parser = useSyllabusParser();
  const parsing = parser.stage === "parsing";

  async function run() {
    const courses = await parser.start();
    if (courses.length) onDone(courses);
  }

  if (parsing) {
    return (
      <OnboardingFrame>
        <ReadingSyllabi files={parser.files} />
      </OnboardingFrame>
    );
  }

  return (
    <OnboardingFrame
      onBack={onCancel}
      title="Add your syllabi."
      sub={<>Kyber finds <span className="hi">every deadline, exam and grade weight</span>.</>}
      footer={
        <>
          <PrimaryButton
            label={parser.files.length > 1 ? `Add ${parser.files.length} courses` : "Add this course"}
            onClick={run}
            disabled={!parser.files.length}
          />
          <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--text-3)", margin: "10px 0 0", lineHeight: 1.45, fontWeight: 500 }}>
            Syllabus content is processed securely and not stored.
          </p>
        </>
      }
    >
      <div style={{ marginTop: 22 }}>
        <SyllabusDropzone files={parser.files} onPick={parser.pick} onRemove={parser.remove} />
      </div>
      {parser.error && (
        <p style={{ color: "#B23B3B", fontSize: 15, marginTop: 14, textAlign: "center", fontWeight: 500 }}>{parser.error}</p>
      )}
      {onCancel && (
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <TextLink label="Cancel" onClick={onCancel} size={16} color="var(--text-2)" />
        </div>
      )}
    </OnboardingFrame>
  );
}
