"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { UserProfile, CommitmentEntry } from "@/lib/types";
import { track } from "@/lib/analytics";
import OnboardingFrame from "./OnboardingFrame";
import Icon, { type IconName } from "@/components/shared/Icon";
import { PrimaryButton, TextLink, IconTile, CheckIcon, Label, Card } from "@/components/shared/ui";

// Questionnaire step names for the activation funnel (index = step).
const STEP_NAMES = ["opening", "school_info", "theme", "goals", "study_time", "study_block", "commitments"];

// ─── data ────────────────────────────────────────────────────────────────────

const UNIVERSITIES = [
  "Brock University","Carleton University","Concordia University","Dalhousie University",
  "McGill University","McMaster University","Queen's University","Simon Fraser University",
  "Toronto Metropolitan University","University of Alberta","University of British Columbia",
  "University of Calgary","University of Guelph","University of Ottawa","University of Toronto",
  "University of Waterloo","University of Windsor","Western University",
  "Wilfrid Laurier University","York University",
];

const PROGRAMS: { name: string; aliases: string[] }[] = [
  {name:"Accounting",aliases:[]},{name:"Anthropology",aliases:[]},{name:"Architecture",aliases:[]},
  {name:"Biochemistry",aliases:[]},{name:"Biology",aliases:[]},{name:"Biomedical Science",aliases:[]},
  {name:"Business Administration",aliases:["commerce","comm","hba","bcomm","bba","business management","business admin"]},
  {name:"Chemical Engineering",aliases:[]},{name:"Chemistry",aliases:[]},{name:"Civil Engineering",aliases:[]},
  {name:"Communication Studies",aliases:[]},{name:"Computer Science",aliases:["cs"]},{name:"Criminology",aliases:[]},
  {name:"Data Science",aliases:[]},{name:"Economics",aliases:["econ"]},{name:"Education",aliases:[]},
  {name:"Electrical Engineering",aliases:[]},{name:"Engineering (General / Undeclared)",aliases:["engineering"]},
  {name:"English",aliases:[]},{name:"Environmental Science",aliases:[]},{name:"Film Studies",aliases:[]},
  {name:"Finance",aliases:[]},{name:"Geography",aliases:[]},{name:"Health Sciences",aliases:[]},
  {name:"History",aliases:[]},{name:"Human Resources Management",aliases:["hr"]},{name:"Information Technology",aliases:["it"]},
  {name:"International Relations",aliases:[]},{name:"Kinesiology",aliases:["human kinetics","phys ed"]},
  {name:"Law and Legal Studies",aliases:["pre-law"]},{name:"Linguistics",aliases:[]},{name:"Marketing",aliases:[]},
  {name:"Mathematics",aliases:["math"]},{name:"Mechanical Engineering",aliases:[]},
  {name:"Media, Information and Technoculture",aliases:["mit"]},{name:"Music",aliases:[]},{name:"Neuroscience",aliases:[]},
  {name:"Nursing",aliases:[]},{name:"Philosophy",aliases:[]},{name:"Physics",aliases:[]},
  {name:"Political Science",aliases:["polisci","poli sci"]},{name:"Psychology",aliases:[]},{name:"Social Work",aliases:[]},
  {name:"Sociology",aliases:[]},{name:"Software Engineering",aliases:[]},{name:"Statistics",aliases:[]},
  {name:"Theatre Studies",aliases:["drama"]},{name:"Undeclared / Still deciding",aliases:["undecided"]},
  {name:"Urban Planning",aliases:[]},{name:"Visual Arts",aliases:["studio art"]},
];

const SCHOOL_PALETTES: Record<string, string[]> = {
  "Brock University":["#D10000","#27251F","#E86B6B"],
  "Carleton University":["#003069","#FFDF4F","#5C7AA8"],
  "Concordia University":["#912338","#E5A712","#C77E8E"],
  "University of Guelph":["#C20430","#FFC72A","#69A3B9"],
  "University of Ottawa":["#8F001A","#80746C","#B85C7B"],
  "University of Toronto":["#1E3765","#007FA3","#5C7AA8"],
  "Western University":["#4F2683","#A7A9AC","#8A5FBF"],
  "Dalhousie University":["#000000","#FFC72C","#8A8A8A"],
  "McGill University":["#ED1B2F","#5B6770","#F08C97"],
  "McMaster University":["#7A003C","#FDBF57","#B15A80"],
  "Queen's University":["#B90E31","#002452","#EEBD31"],
  "Simon Fraser University":["#A6192E","#000000","#CC6677"],
  "Toronto Metropolitan University":["#00205B","#FFC72C","#5C7AA8"],
  "University of Alberta":["#007C41","#FFDB05","#4F9E76"],
  "University of British Columbia":["#002145","#B9975B","#4C6D94"],
  "University of Calgary":["#D50032","#FFC72C","#E56E86"],
  "University of Waterloo":["#000000","#FED34E","#8A8A8A"],
  "University of Windsor":["#00205B","#FFC72C","#5C7AA8"],
  "Wilfrid Laurier University":["#5B2E91","#FFB81C","#9A6DC9"],
  "York University":["#E31837","#000000","#EE7C8A"],
};

const DEFAULT_PALETTE = ["#E9A319","#27251F","#FFC857"];

const KYBER_THEMES = [
  {name:"Sunwashed Pastel",desc:"Soft, calming pastels",colors:["#A8D8EA","#FFB5C2","#C9E4C5"]},
  {name:"Jewel Tones",desc:"Bold, rich, a little luxe",colors:["#6B46C1","#0F766E","#B91C63"]},
  {name:"Terracotta Earth",desc:"Warm clay and olive",colors:["#C4713F","#8A9A5B","#D4A574"]},
  {name:"Ocean Teal",desc:"Cool blues, calm focus",colors:["#2F80ED","#17A398","#56CCF2"]},
  {name:"Golden Hour",desc:"Warm sunset amber and coral",colors:["#F2994A","#EB5757","#E2AA00"]},
  {name:"Forest Moss",desc:"Deep greens, grounded and calm",colors:["#3E6B4F","#8AAE8C","#C9D6A3"]},
  {name:"Berry Orchard",desc:"Rich plum and berry tones",colors:["#8E3B6B","#C05C7E","#5C2A5E"]},
  {name:"Slate & Sky",desc:"Minimal cool blue-greys",colors:["#5C7A99","#A8B8C8","#2E3E52"]},
  {name:"Citrus Pop",desc:"Bright, energetic citrus",colors:["#F2C94C","#A8D93C","#FF8C42"]},
  {name:"Rosewater",desc:"Dusty rose and soft mauve",colors:["#D4A5A5","#B76E79","#8C5B66"]},
];

const OWN_SWATCHES = [
  "#E63946","#FF6B6B","#FF9F43","#FECA57","#48DBFB",
  "#1DD1A1","#54A0FF","#5F27CD","#C8D6E5","#576574",
  "#2ECC71","#3498DB","#9B59B6","#E74C3C","#E67E22",
  "#1ABC9C","#34495E","#F39C12","#D35400","#7F8C8D",
];

const YEARS = ["First year","Second year","Third year","Fourth year","Fifth year+"];
const TIMES_OF_DAY = ["Morning","Afternoon","Evening","Late night"];
const DURATIONS = ["30 min","1 hr","1.5 hr","2 hr","2.5 hr","3 hr","3+ hr"];
const DAYS_LABELS = ["M","T","W","T","F","S","S"];
const PERIOD_TIMES: Record<string, string[]> = {
  "Morning":["6:00 AM","6:30 AM","7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM"],
  "Afternoon":["12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM"],
  "Evening":["5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM"],
  "Late night":["9:00 PM","9:30 PM","10:00 PM","10:30 PM","11:00 PM","11:30 PM","12:00 AM"],
};

const COMMITMENT_TYPES = [
  {id:"work",label:"Work"},
  {id:"sports",label:"Sports / team"},
  {id:"clubs",label:"Clubs"},
  {id:"commute",label:"Commute"},
  {id:"family",label:"Family"},
  {id:"appointments",label:"Appointments"},
  {id:"activities",label:"Activities"},
  {id:"other",label:"Other"},
];

const YEAR_LABELS: Record<string, string> = {
  "First year": "1st", "Second year": "2nd", "Third year": "3rd", "Fourth year": "4th", "Fifth year+": "5th+",
};

// ─── shared styles ───────────────────────────────────────────────────────────

const fieldLabel: React.CSSProperties = { display: "block", fontSize: 19, fontWeight: 600, color: "var(--ink)", margin: "20px 0 10px" };

const optionCard = (active: boolean): React.CSSProperties => ({
  background: active ? "var(--soft)" : "var(--surface)",
  border: `2px solid ${active ? "var(--amber)" : "var(--card-border)"}`,
  borderRadius: 18, padding: "14px 16px", cursor: "pointer", transition: "border-color .15s, background .15s",
  boxShadow: "var(--shadow-card)",
});

function Radio({ active }: { active: boolean }) {
  return (
    <span style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid var(--ink)`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {active && <span style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--ink)" }} />}
    </span>
  );
}

function CheckBadge() {
  return (
    <span style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: "50%", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CheckIcon size={14} />
    </span>
  );
}

// ─── shared sub-components ───────────────────────────────────────────────────

function SearchDropdown({ id, list, onSelect, placeholder, listLabel }: {
  id: string; list: { name: string; aliases: string[] }[]; onSelect: (v: string) => void; placeholder: string; listLabel?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");

  const matches = q.length === 0
    ? list.slice(0, 6)
    : list.filter(x => x.name.toLowerCase().includes(q.toLowerCase()) || x.aliases.some(a => a.toLowerCase().includes(q.toLowerCase())));

  function pick(v: string) {
    setSelected(v); setQ(""); setOpen(false); onSelect(v);
  }
  function clear() {
    setSelected(""); onSelect("");
  }

  const shell: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1.5px solid var(--line)",
    borderRadius: 18, padding: "14px 16px", boxShadow: "var(--shadow-card)",
  };

  if (selected) {
    return (
      <div style={shell}>
        <Icon name="search" size={28} />
        <span style={{ flex: 1, fontSize: 18, fontWeight: 500, color: "var(--ink)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected}</span>
        <button onClick={clear} aria-label="Change" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          <CheckIcon size={18} color="var(--amber-deep)" />
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ ...shell, padding: "0 16px" }}>
        <Icon name="search" size={28} />
        <input
          id={id}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: "14px 0", fontSize: 18, fontWeight: 500, color: "var(--ink)", outline: "none" }}
        />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 12px 28px rgba(39,37,31,.14)", maxHeight: 240, overflowY: "auto", zIndex: 10, padding: "6px 0" }}>
          {listLabel && <div style={{ padding: "10px 16px 6px" }}><Label>{listLabel}</Label></div>}
          {matches.map(m => (
            <div key={m.name} onMouseDown={() => pick(m.name)} style={{ padding: "12px 16px", fontSize: 17, fontWeight: 500, color: "var(--ink)", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--soft)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >{m.name}</div>
          ))}
          {matches.length === 0 && <div style={{ padding: "12px 16px", fontSize: 16, color: "var(--text-3)", fontWeight: 500 }}>No matches — type it in</div>}
          <div onMouseDown={() => { const v = q.trim(); if (v) pick(v); }} style={{ padding: "12px 16px", fontSize: 16, fontWeight: 600, color: "var(--amber-deep)", cursor: "pointer", borderTop: "1px solid var(--track)" }}>
            Other — type it in
          </div>
        </div>
      )}
    </div>
  );
}

// ─── draft state type ─────────────────────────────────────────────────────────

interface CommitmentDraft extends Omit<CommitmentEntry, "days"> {
  days: Set<number>;
}

interface Draft {
  university: string;
  year: string;
  program: string;
  themeMode: "school" | "kyber" | "own";
  kyberIdx: number;
  ownPicked: string[];
  goals: Set<string>;
  studyTimes: Set<string>;
  studyBlock: string;
  commitments: CommitmentEntry[];
}

const initialDraft: Draft = {
  university: "", year: "", program: "",
  themeMode: "school", kyberIdx: 0, ownPicked: [],
  goals: new Set(), studyTimes: new Set(), studyBlock: "",
  commitments: [],
};

type StepProps = { draft: Draft; update: (d: Partial<Draft>) => void; onNext: () => void; onBack: () => void };

// ─── steps ───────────────────────────────────────────────────────────────────

function StepOpening({ onNext }: { onNext: () => void }) {
  return (
    <OnboardingFrame
      footer={
        <>
          <PrimaryButton label="Build my semester" onClick={onNext} />
          <p style={{ textAlign: "center", fontSize: 16, color: "var(--ink)", fontWeight: 500, margin: "12px 0 0" }}>Takes about 5 minutes.</p>
        </>
      }
      contentStyle={{ justifyContent: "flex-end", paddingBottom: 40 }}
    >
      <h1 style={{ margin: 0, fontSize: 40, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.12, color: "var(--ink)" }}>
        Your semester, already <em className="marker">planned</em>.
      </h1>
      <p style={{ margin: "16px 0 0", fontSize: 18, fontWeight: 500, lineHeight: 1.45, color: "var(--ink)" }}>
        Upload your syllabi. Kyber turns them into one plan for your semester.
      </p>
    </OnboardingFrame>
  );
}

function StepSchoolInfo({ draft, update, onNext, onBack }: StepProps) {
  const canContinue = !!draft.university && !!draft.year && !!draft.program;
  const uniShort = draft.university.replace(/^(University of |The )/i, "").replace(/ University$/i, "");
  return (
    <OnboardingFrame
      step={1}
      stepName="Your school"
      onBack={onBack}
      title="Where do you study?"
      sub={<>So Kyber can show your <span className="hi">programs and colours</span>.</>}
      footer={<PrimaryButton label="Continue" onClick={onNext} disabled={!canContinue} />}
    >
      <label htmlFor="uni-input" style={fieldLabel}>Your university</label>
      <SearchDropdown
        id="uni-input"
        list={UNIVERSITIES.map(u => ({ name: u, aliases: [] }))}
        onSelect={v => update({ university: v })}
        placeholder="Search for your university"
        listLabel="Universities"
      />

      <span style={fieldLabel}>Your year</span>
      <div style={{ display: "flex", gap: 8 }}>
        {YEARS.map(y => {
          const active = draft.year === y;
          return (
            <button key={y} onClick={() => update({ year: y })} aria-pressed={active}
              style={{
                flex: 1, height: 56, borderRadius: 14, cursor: "pointer", fontSize: 18, fontWeight: 500, color: "var(--ink)",
                background: active ? "var(--soft)" : "var(--surface)", border: `2px solid ${active ? "var(--amber)" : "var(--card-border)"}`,
                boxShadow: "var(--shadow-card)",
              }}
            >{YEAR_LABELS[y] ?? y}</button>
          );
        })}
      </div>

      <label htmlFor="prog-input" style={fieldLabel}>Your program</label>
      <SearchDropdown
        id="prog-input"
        list={PROGRAMS}
        onSelect={v => update({ program: v })}
        placeholder="Search for your program"
        listLabel={draft.university ? `Programs at ${uniShort}` : "Programs"}
      />
    </OnboardingFrame>
  );
}

function ColorPreview({ palette }: { palette: string[] }) {
  const courses = [{ code: "PSYC 101", meta: "Intro to Psychology" }, { code: "MATH 140", meta: "Calculus I" }, { code: "BIOL 110", meta: "Intro Biology" }];
  return (
    <Card pad="4px 16px">
      {courses.map((c, i) => (
        <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < courses.length - 1 ? "1px solid var(--track)" : "none" }}>
          <div style={{ width: 4, height: 40, borderRadius: 4, background: palette[i % palette.length], flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>{c.code}</div>
            <div style={{ fontSize: 15.5, fontWeight: 500, color: "var(--text-2)" }}>{c.meta}</div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function StepTheme({ draft, update, onNext, onBack }: StepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const schoolPal = SCHOOL_PALETTES[draft.university] || DEFAULT_PALETTE;
  const kyberPal = KYBER_THEMES[draft.kyberIdx].colors;
  const ownPal = draft.ownPicked.length ? draft.ownPicked : ["#FFAAA5", "#9CC5A1", "#8FB3E0", "#B48CFF", "#FFD97A"];

  function currentPalette() {
    if (draft.themeMode === "school") return schoolPal;
    if (draft.themeMode === "kyber") return kyberPal;
    return ownPal;
  }

  function setMode(m: "school" | "kyber" | "own") {
    update({ themeMode: m });
  }

  function toggleOwnColor(c: string) {
    const picked = [...draft.ownPicked];
    const idx = picked.indexOf(c);
    if (idx > -1) picked.splice(idx, 1);
    else { if (picked.length >= 5) picked.shift(); picked.push(c); }
    update({ ownPicked: picked });
  }

  function drawWheel(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const radius = size / 2;
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - radius, dy = y - radius;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * size + x) * 4;
        if (dist <= radius) {
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (angle < 0) angle += 360;
          const sat = Math.min(dist / radius, 1);
          const c = sat; const xa = c * (1 - Math.abs(((angle / 60) % 2) - 1));
          const m = 1 - c;
          let r = 0, g = 0, b = 0;
          if (angle < 60) { r = c; g = xa; } else if (angle < 120) { r = xa; g = c; } else if (angle < 180) { g = c; b = xa; } else if (angle < 240) { g = xa; b = c; } else if (angle < 300) { r = xa; b = c; } else { r = c; b = xa; }
          img.data[idx] = Math.round((r + m) * 255);
          img.data[idx + 1] = Math.round((g + m) * 255);
          img.data[idx + 2] = Math.round((b + m) * 255);
          img.data[idx + 3] = 255;
        } else {
          img.data[idx + 3] = 0;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  useEffect(() => {
    if (canvasRef.current) drawWheel(canvasRef.current);
  }, [draft.themeMode]);

  function handleWheelClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = "#" + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
    toggleOwnColor(hex);
  }

  const palette = currentPalette();

  // Plain render helper (not a component) so the canvas/wheel inside is not
  // remounted on every keystroke or swatch pick.
  function renderOption({ mode, icon, title, sub, swatches, children }: { mode: "school" | "kyber" | "own"; icon: IconName; title: string; sub: string; swatches: string[]; children?: React.ReactNode }) {
    const active = draft.themeMode === mode;
    return (
      <div style={optionCard(active)} onClick={() => setMode(mode)}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <IconTile name={icon} size={64} icon={34} bg={active ? "var(--surface)" : "var(--soft)"} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 600, color: "var(--ink)" }}>{title}</div>
            <div style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)", marginTop: 1 }}>{sub}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {swatches.slice(0, 5).map((c, i) => <span key={`${c}-${i}`} style={{ width: 24, height: 24, borderRadius: "50%", background: c, display: "block" }} />)}
            </div>
          </div>
          <Radio active={active} />
        </div>
        {active && children && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--warn-border)" }} onClick={e => e.stopPropagation()}>
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <OnboardingFrame
      step={2}
      stepName="Course colours"
      onBack={onBack}
      onSkip={() => { update({ themeMode: "kyber", kyberIdx: 0 }); onNext(); }}
      title="Pick your course colours."
      sub={<>Each course gets <span className="hi">its own colour</span>.</>}
      footer={
        <>
          <PrimaryButton label="Continue" onClick={onNext} />
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <TextLink label="Not sure? Use Kyber's colours for now" size={16} onClick={() => { update({ themeMode: "kyber", kyberIdx: 0 }); onNext(); }} />
          </div>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
        {renderOption({ mode: "school", icon: "colours-school", title: "My school's colours", sub: draft.university || "Pulled from your school", swatches: schoolPal })}

        {renderOption({ mode: "kyber", icon: "colours-theme", title: "A Kyber theme", sub: KYBER_THEMES[draft.kyberIdx].name, swatches: kyberPal, children: (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {KYBER_THEMES.map((t, i) => (
              <button key={t.name} onClick={() => update({ kyberIdx: i })} aria-pressed={i === draft.kyberIdx}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 64, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, border: `2px solid ${i === draft.kyberIdx ? "var(--ink)" : "transparent"}`, display: "flex", overflow: "hidden", flexDirection: "column" }}>
                  {t.colors.map(c => <div key={c} style={{ flex: 1, background: c }} />)}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: i === draft.kyberIdx ? "var(--ink)" : "var(--text-2)", textAlign: "center", lineHeight: 1.2 }}>{t.name}</div>
              </button>
            ))}
          </div>
        ) })}

        {renderOption({ mode: "own", icon: "colours-own", title: "My own colours", sub: "Pick up to 5", swatches: ownPal, children: (<>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 16 }}>
            {OWN_SWATCHES.map(c => {
              const idx = draft.ownPicked.indexOf(c);
              const picked = idx > -1;
              return (
                <button key={c} onClick={() => toggleOwnColor(c)} aria-pressed={picked} aria-label={c}
                  style={{ width: 34, height: 34, borderRadius: "50%", cursor: "pointer", background: c, border: `2px solid ${picked ? "var(--ink)" : "transparent"}`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  {picked && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,.45)" }}>{idx + 1}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>Or pick any colour</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <canvas ref={canvasRef} width={130} height={130} onClick={handleWheelClick} style={{ borderRadius: "50%", cursor: "crosshair", boxShadow: "0 4px 14px rgba(39,37,31,.12)" }} />
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-2)", lineHeight: 1.5, maxWidth: 140 }}>Tap the wheel to add a pick.</div>
          </div>
          {draft.ownPicked.length > 0 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginTop: 16, marginBottom: 8 }}>Your picks — tap to remove</div>
              <div style={{ display: "flex", gap: 10 }}>
                {draft.ownPicked.map((c, i) => (
                  <button key={c} onClick={() => toggleOwnColor(c)} aria-label={`Remove ${c}`}
                    style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,.45)", cursor: "pointer", border: "2px solid var(--ink)", background: c, position: "relative", padding: 0 }}>
                    {i + 1}
                    <span style={{ position: "absolute", top: -5, right: -5, width: 15, height: 15, borderRadius: "50%", background: "var(--ink)", color: "#fff", fontSize: 11, lineHeight: "15px", textAlign: "center", textShadow: "none" }}>×</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>) })}
      </div>

      <Label style={{ display: "block", margin: "22px 0 10px", letterSpacing: "0.12em" }}>Preview: how courses will look</Label>
      <ColorPreview palette={palette} />
    </OnboardingFrame>
  );
}

const GOALS: { id: string; title: string; icon: IconName }[] = [
  { id: "comfortable", title: "Stay comfortably on top of my courses", icon: "goal-on-top" },
  { id: "improve", title: "Improve my grades", icon: "goal-improve" },
  { id: "strong", title: "Aim for strong grades", icon: "goal-strong" },
  { id: "protect", title: "Protect a scholarship or GPA requirement", icon: "goal-scholarship" },
  { id: "figuring", title: "I'm still figuring it out", icon: "help" },
];

function StepGoal({ draft, update, onNext, onBack }: StepProps) {
  function toggle(id: string) {
    const g = new Set(draft.goals);
    if (g.has(id)) g.delete(id); else g.add(id);
    update({ goals: g });
  }
  const canContinue = draft.goals.size > 0;
  return (
    <OnboardingFrame
      step={3}
      stepName="Your goals"
      onBack={onBack}
      title="What are you aiming for?"
      sub={<><span className="hi">Pick as many as apply.</span> Kyber plans around them.</>}
      footer={<PrimaryButton label="Continue" onClick={onNext} disabled={!canContinue} />}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
        {GOALS.map(g => {
          const active = draft.goals.has(g.id);
          return (
            <div key={g.id} onClick={() => toggle(g.id)} role="button" aria-pressed={active} style={{ ...optionCard(active), display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
              <IconTile name={g.icon} size={56} icon={30} bg={active ? "var(--surface)" : "var(--soft)"} />
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, flex: 1, paddingRight: active ? 30 : 0 }}>{g.title}</div>
              {active && <CheckBadge />}
            </div>
          );
        })}
      </div>
    </OnboardingFrame>
  );
}

const STUDY_TIMES: { id: string; title: string; icon: IconName }[] = [
  { id: "morning", title: "Morning", icon: "time-morning" },
  { id: "afternoon", title: "Afternoon", icon: "time-afternoon" },
  { id: "evening", title: "Evening", icon: "time-evening" },
  { id: "latenight", title: "Late night", icon: "time-late" },
  { id: "weekends", title: "Weekends", icon: "time-weekends" },
  { id: "nopref", title: "Any time works", icon: "time-any" },
];

function StepStudyTime({ draft, update, onNext, onBack }: StepProps) {
  function toggle(id: string) {
    const t = new Set(draft.studyTimes);
    if (id === "nopref") {
      t.clear(); t.add("nopref");
    } else {
      t.delete("nopref");
      if (t.has(id)) t.delete(id); else t.add(id);
    }
    update({ studyTimes: t });
  }
  const canContinue = draft.studyTimes.size > 0;
  return (
    <OnboardingFrame
      step={4}
      stepName="Study times"
      onBack={onBack}
      title="When do you study best?"
      sub={<><span className="hi">Choose all that fit.</span> Kyber plans study blocks here first.</>}
      footer={<PrimaryButton label="Continue" onClick={onNext} disabled={!canContinue} />}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22 }}>
        {STUDY_TIMES.map(t => {
          const active = draft.studyTimes.has(t.id);
          return (
            <div key={t.id} onClick={() => toggle(t.id)} role="button" aria-pressed={active}
              style={{ ...optionCard(active), position: "relative", display: "flex", flexDirection: "column", gap: 14, padding: "16px 16px 18px" }}>
              <IconTile name={t.icon} size={56} icon={32} bg={active ? "var(--surface)" : "var(--soft)"} />
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>{t.title}</div>
              {active && <CheckBadge />}
            </div>
          );
        })}
      </div>
    </OnboardingFrame>
  );
}

const STUDY_BLOCKS: { id: string; title: string; desc: string; icon: IconName }[] = [
  { id: "short", title: "20–30 minutes", desc: "Quick, focused bursts", icon: "length-short" },
  { id: "medium", title: "45–60 minutes", desc: "A solid single sitting", icon: "length-medium" },
  { id: "long", title: "Longer focused sessions", desc: "Deep, uninterrupted stretches of time", icon: "length-long" },
  { id: "mix", title: "A mix", desc: "Depends on the day and the course", icon: "length-mix" },
  { id: "figuring", title: "I'm still figuring it out", desc: "Kyber will start you off with a mix", icon: "help" },
];

function StepStudyBlock({ draft, update, onNext, onBack }: StepProps) {
  const canContinue = !!draft.studyBlock;
  return (
    <OnboardingFrame
      step={5}
      stepName="Study length"
      onBack={onBack}
      title="How long do you like to study at a time?"
      sub={<>Pick one. <span className="hi">Kyber sizes your first sessions</span> from it and learns from what you actually do.</>}
      footer={<PrimaryButton label="Continue" onClick={onNext} disabled={!canContinue} />}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
        {STUDY_BLOCKS.map(b => {
          const active = draft.studyBlock === b.id;
          return (
            <div key={b.id} onClick={() => update({ studyBlock: b.id })} role="button" aria-pressed={active} style={{ ...optionCard(active), display: "flex", alignItems: "center", gap: 14 }}>
              <IconTile name={b.icon} size={56} icon={30} bg={active ? "var(--surface)" : "var(--soft)"} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text-2)", marginTop: 2 }}>{b.desc}</div>
              </div>
              <Radio active={active} />
            </div>
          );
        })}
      </div>
    </OnboardingFrame>
  );
}

// ─── Commitments step ────────────────────────────────────────────────────────

const chip = (active: boolean): React.CSSProperties => ({
  background: active ? "var(--soft)" : "var(--surface)", border: `1.5px solid ${active ? "var(--amber)" : "var(--line)"}`,
  borderRadius: 12, padding: "10px 14px", fontSize: 16, fontWeight: 600, color: "var(--ink)", cursor: "pointer", whiteSpace: "nowrap",
});

function StepCommitments({ draft, update, onNext, onBack }: StepProps) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [formDraft, setFormDraft] = useState<CommitmentDraft | null>(null);

  function addCommitment(typeId: string) {
    const label = COMMITMENT_TYPES.find(t => t.id === typeId)?.label ?? typeId;
    const newEntry: CommitmentEntry = { type: typeId, title: label, days: [], period: null, startTime: null, duration: null, fixed: false };
    const updated = [...draft.commitments, newEntry];
    update({ commitments: updated });
    const newIdx = updated.length - 1;
    setEditIdx(newIdx);
    setFormDraft({ ...newEntry, days: new Set() });
  }

  function removeCommitment(i: number) {
    const updated = draft.commitments.filter((_, idx) => idx !== i);
    update({ commitments: updated });
    if (editIdx === i) { setEditIdx(null); setFormDraft(null); }
  }

  function openEdit(i: number) {
    setEditIdx(i);
    setFormDraft({ ...draft.commitments[i], days: new Set(draft.commitments[i].days) });
  }

  function saveEdit() {
    if (editIdx === null || !formDraft) return;
    const saved: CommitmentEntry = { ...formDraft, days: Array.from(formDraft.days) };
    const updated = draft.commitments.map((c, i) => i === editIdx ? saved : c);
    update({ commitments: updated });
    setEditIdx(null); setFormDraft(null);
  }

  function cancelEdit() { setEditIdx(null); setFormDraft(null); }

  const updateForm = (patch: Partial<CommitmentDraft>) => setFormDraft(f => f ? { ...f, ...patch } : f);

  function toggleDay(d: number) {
    if (!formDraft) return;
    const days = new Set(formDraft.days);
    if (days.has(d)) days.delete(d); else days.add(d);
    updateForm({ days });
  }

  const formLabel: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 8, display: "block" };

  return (
    <OnboardingFrame
      step={6}
      stepName="Your week"
      onBack={onBack}
      title="What regularly takes up your time?"
      sub={<>Tap what applies. <span className="hi">Kyber plans study around it</span> — add the day and time whenever you&apos;re ready.</>}
      footer={
        <>
          <PrimaryButton label="Continue" onClick={onNext} />
          <p style={{ textAlign: "center", fontSize: 15, color: "var(--text-2)", fontWeight: 500, margin: "10px 0 0" }}>You can add or change these anytime from Plan.</p>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "22px 0 14px" }}>
        {COMMITMENT_TYPES.map(t => (
          <button key={t.id} onClick={() => addCommitment(t.id)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "var(--soft)", border: "1.5px solid transparent", borderRadius: 14, padding: "12px 14px", cursor: "pointer", fontSize: 16.5, fontWeight: 600, color: "var(--ink)" }}>
            {t.label}
            <span style={{ fontSize: 20, lineHeight: 1, color: "var(--amber-deep)" }}>+</span>
          </button>
        ))}
      </div>

      {draft.commitments.map((c, i) => {
        const hasDetail = c.days.length > 0 && c.startTime && c.duration;
        const dayStr = hasDetail ? c.days.map(d => DAYS_LABELS[d]).join(", ") : "";
        return (
          <Card key={i} pad="12px 14px" onClick={() => openEdit(i)} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12, borderRadius: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>{c.title}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-2)", marginTop: 2, fontStyle: hasDetail ? "normal" : "italic" }}>
                {hasDetail ? `${dayStr} · ${c.startTime} · ${c.duration}` : "Tap to add day & time"}
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 8, flexShrink: 0, background: c.fixed ? "var(--amber-light)" : "var(--cream-deep)", color: "var(--ink)" }}>
              {c.fixed ? "Fixed" : "Flexible"}
            </span>
            <button onClick={e => { e.stopPropagation(); removeCommitment(i); }} aria-label={`Remove ${c.title}`} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
            </button>
          </Card>
        );
      })}

      {editIdx !== null && formDraft && (
        <Card style={{ marginBottom: 12 }}>
          <label style={formLabel}>Title</label>
          <input value={formDraft.title} onChange={e => updateForm({ title: e.target.value })} placeholder="Name it"
            style={{ width: "100%", background: "var(--surface)", border: "1.5px solid var(--line)", borderRadius: 14, padding: "12px 14px", fontSize: 17, fontWeight: 500, color: "var(--ink)", outline: "none", marginBottom: 18 }} />

          <label style={formLabel}>Which day(s)?</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {DAYS_LABELS.map((d, i) => {
              const on = formDraft.days.has(i);
              return (
                <button key={i} onClick={() => toggleDay(i)} aria-pressed={on}
                  style={{ flex: 1, height: 40, borderRadius: "50%", background: on ? "var(--amber)" : "var(--soft)", border: "none", fontSize: 15, fontWeight: 700, color: "var(--ink)", cursor: "pointer" }}>
                  {d}
                </button>
              );
            })}
          </div>

          <label style={formLabel}>Roughly when?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {TIMES_OF_DAY.map(t => (
              <button key={t} onClick={() => updateForm({ period: t, startTime: null })} style={chip(formDraft.period === t)}>{t}</button>
            ))}
          </div>

          {formDraft.period && <>
            <label style={formLabel}>Starts at</label>
            <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 18 }}>
              {PERIOD_TIMES[formDraft.period]?.map(time => (
                <button key={time} onClick={() => updateForm({ startTime: time })} style={{ ...chip(formDraft.startTime === time), flexShrink: 0 }}>{time}</button>
              ))}
            </div>

            <label style={formLabel}>For how long?</label>
            <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 18 }}>
              {DURATIONS.map(d => (
                <button key={d} onClick={() => updateForm({ duration: d })} style={{ ...chip(formDraft.duration === d), flexShrink: 0 }}>{d}</button>
              ))}
            </div>
          </>}

          <label style={formLabel}>Fixed or flexible?</label>
          <div style={{ display: "flex", background: "var(--cream-deep)", borderRadius: 12, padding: 4, marginBottom: 18, gap: 4 }}>
            {[["Fixed", true], ["Flexible", false]].map(([label, val]) => {
              const on = formDraft.fixed === val;
              return (
                <button key={String(label)} onClick={() => updateForm({ fixed: val as boolean })}
                  style={{ flex: 1, border: "none", background: on ? "var(--amber)" : "transparent", cursor: "pointer", fontWeight: on ? 700 : 500, fontSize: 16, color: on ? "var(--ink)" : "var(--text-2)", padding: 10, borderRadius: 9 }}>
                  {label as string}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <TextLink label="Cancel" onClick={cancelEdit} size={16} color="var(--text-2)" />
            <PrimaryButton label="Save" onClick={saveEdit} disabled={!formDraft.title.trim()} height={46} style={{ flex: 1, width: "auto" }} />
          </div>
        </Card>
      )}

      {draft.commitments.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <TextLink label="Nothing regular right now" onClick={onNext} size={16} color="var(--text-2)" />
        </div>
      )}
    </OnboardingFrame>
  );
}

// ─── main orchestrator ───────────────────────────────────────────────────────

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export default function OnboardingQuestionnaire({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);

  const update = useCallback((patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch })), []);
  const next = () => {
    track.onboardingStepCompleted(step, STEP_NAMES[step] ?? String(step));
    setStep(s => s + 1);
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  function resolvePalette(): string[] {
    if (draft.themeMode === "school") return SCHOOL_PALETTES[draft.university] || DEFAULT_PALETTE;
    if (draft.themeMode === "kyber") return KYBER_THEMES[draft.kyberIdx].colors;
    return draft.ownPicked.length ? draft.ownPicked : DEFAULT_PALETTE;
  }

  function finish() {
    track.onboardingStepCompleted(6, STEP_NAMES[6]);
    const profile: UserProfile = {
      university: draft.university,
      year: draft.year,
      program: draft.program,
      goals: Array.from(draft.goals),
      studyTimes: Array.from(draft.studyTimes),
      studyBlock: draft.studyBlock,
      themeMode: draft.themeMode,
      palette: resolvePalette(),
      commitments: draft.commitments,
    };
    onComplete(profile);
  }

  const props = { draft, update };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {step === 0 && <StepOpening onNext={next} />}
      {step === 1 && <StepSchoolInfo {...props} onNext={next} onBack={back} />}
      {step === 2 && <StepTheme {...props} onNext={next} onBack={back} />}
      {step === 3 && <StepGoal {...props} onNext={next} onBack={back} />}
      {step === 4 && <StepStudyTime {...props} onNext={next} onBack={back} />}
      {step === 5 && <StepStudyBlock {...props} onNext={next} onBack={back} />}
      {step === 6 && <StepCommitments {...props} onNext={finish} onBack={back} />}
    </div>
  );
}
