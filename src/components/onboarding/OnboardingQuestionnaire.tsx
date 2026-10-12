"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { UserProfile, CommitmentEntry } from "@/lib/types";
import KyberLogo from "@/components/shared/KyberLogo";

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

// ─── CSS variable helpers ─────────────────────────────────────────────────────

const S = {
  screen: { position:"absolute" as const, inset:0, overflowY:"auto" as const, overflowX:"hidden" as const, padding:"24px", display:"flex", flexDirection:"column" as const, background:"var(--cream, #FFF9ED)" },
  back: { width:36, height:36, borderRadius:12, background:"var(--surface,#FFFCF6)", border:"1px solid var(--line,#E9DDC8)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", marginBottom:18, flexShrink:0 } as React.CSSProperties,
  progressTrack: { width:"100%", height:4, background:"var(--line,#E9DDC8)", borderRadius:99, marginBottom:22, overflow:"hidden", flexShrink:0 } as React.CSSProperties,
  eyebrow: { fontSize:12, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:"#D89210", marginBottom:8 },
  headline: { fontSize:26, fontWeight:600, letterSpacing:"-0.02em", lineHeight:1.2, color:"var(--ink,#27251F)", marginBottom:6 },
  sub: { fontSize:13.5, fontWeight:500, color:"#5E594E", marginBottom:20, lineHeight:1.5 },
  bottom: { marginTop:"auto", paddingTop:10 },
  btnPrimary: { display:"block", width:"100%", minHeight:52, cursor:"pointer", background:"#E9A319", color:"#27251F", border:"none", fontFamily:"inherit", fontWeight:700, fontSize:16, padding:"15px 20px", borderRadius:18, boxShadow:"0 6px 16px rgba(233,163,25,.28)", transition:"opacity .15s" } as React.CSSProperties,
  btnPrimaryDisabled: { opacity:.4, cursor:"not-allowed", boxShadow:"none" } as React.CSSProperties,
  card: { background:"var(--surface,#FFFCF6)", border:"1.5px solid var(--line,#E9DDC8)", borderRadius:18, padding:"14px 16px", marginBottom:10, cursor:"pointer", transition:"border-color .15s" } as React.CSSProperties,
  cardActive: { borderColor:"#E9A319", background:"#FCE7AE" } as React.CSSProperties,
  pill: { background:"var(--surface,#FFFCF6)", border:"1.5px solid var(--line,#E9DDC8)", borderRadius:99, padding:"10px 16px", fontSize:13.5, fontWeight:600, color:"#5E594E", cursor:"pointer", transition:"all .15s" } as React.CSSProperties,
  pillActive: { background:"#FCE7AE", borderColor:"#E9A319", color:"#D89210" } as React.CSSProperties,
  reassure: { textAlign:"center" as const, fontSize:12.5, color:"#8B8475", fontWeight:500, marginTop:10 },
};

// ─── shared sub-components ───────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={S.progressTrack}>
      <div style={{ height:"100%", background:"#E9A319", borderRadius:99, transition:"width .3s", width:`${pct}%` }} />
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button style={S.back} onClick={onClick} aria-label="Back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M15 19L8 12L15 5" stroke="#5E594E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function SearchDropdown({ id, list, onSelect, placeholder }: {
  id: string; list: { name: string; aliases: string[] }[]; onSelect: (v: string) => void; placeholder: string;
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

  if (selected) {
    return (
      <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#FCE7AE", border:"1.5px solid #E9A319", borderRadius:14, padding:"10px 14px", fontSize:14, fontWeight:600, color:"#D89210" }}>
        {selected}
        <button onClick={clear} style={{ background:"none", border:"none", cursor:"pointer", color:"#D89210", display:"flex", alignItems:"center", padding:0 }} aria-label="Clear">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
        </button>
      </div>
    );
  }

  return (
    <div style={{ position:"relative" }}>
      <div style={{ position:"relative" }}>
        <svg style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", width:17, height:17, color:"#8B8475", pointerEvents:"none" }} viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          id={id}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          style={{ width:"100%", background:"var(--surface,#FFFCF6)", border:"1.5px solid var(--line,#E9DDC8)", borderRadius:16, padding:"14px 16px 14px 42px", fontFamily:"inherit", fontSize:14.5, fontWeight:600, color:"var(--ink,#27251F)", outline:"none" }}
        />
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"var(--surface,#FFFCF6)", border:"1px solid var(--line,#E9DDC8)", borderRadius:16, boxShadow:"0 12px 28px rgba(39,37,31,.14)", maxHeight:220, overflowY:"auto", zIndex:10 }}>
          {matches.map(m => (
            <div key={m.name} onMouseDown={() => pick(m.name)} style={{ padding:"12px 16px", fontSize:14, fontWeight:600, color:"var(--ink,#27251F)", cursor:"pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background="#FCE7AE")}
              onMouseLeave={e => (e.currentTarget.style.background="transparent")}
            >{m.name}</div>
          ))}
          {matches.length === 0 && <div style={{ padding:"12px 16px", fontSize:14, color:"#8B8475", fontWeight:500 }}>No matches — type it in</div>}
          <div onMouseDown={() => { const v = q.trim(); if (v) pick(v); }} style={{ padding:"12px 16px", fontSize:14, fontWeight:600, color:"#D89210", cursor:"pointer", borderTop:"1px solid var(--line,#E9DDC8)" }}>
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

// ─── steps ───────────────────────────────────────────────────────────────────

function StepOpening({ onNext }: { onNext: () => void }) {
  return (
    <div style={S.screen}>
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"6px 0 30px" }}>
        <KyberLogo size={44} wordmark wordmarkSize={21} />
      </div>
      <h1 style={{ ...S.headline, fontSize:30, marginBottom:16 }}>
        Your semester,<br />already <em style={{ fontStyle:"normal", background:"linear-gradient(transparent 60%,#FFE8A3 60%,#FFE8A3 94%,transparent 94%)" }}>planned</em>.
      </h1>
      <p style={{ ...S.sub, fontSize:15, maxWidth:320, marginBottom:0 }}>
        Upload your syllabi and Kyber turns every course, deadline, reading, and exam into one plan built around your life.
      </p>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
        <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {/* Amber radial glow */}
          <div style={{ position:"absolute", inset:"-45%", borderRadius:"50%", background:"radial-gradient(circle, rgba(255,200,60,.42) 0%, rgba(255,200,60,.16) 45%, rgba(255,200,60,0) 72%)" }} />
          {/* Logo fills container proportionally — vw-based so it scales with the screen */}
          <div style={{ position:"relative", width:"clamp(200px, 62vw, 260px)", aspectRatio:"1", borderRadius:"22%", overflow:"hidden", boxShadow:"0 20px 50px rgba(233,163,25,.45)" }}>
            <Image src="/kyber-logo.png" alt="Kyber" fill style={{ objectFit:"cover" }} priority />
          </div>
        </div>
      </div>
      <div style={S.bottom}>
        <button style={S.btnPrimary} onClick={onNext}>Build my semester</button>
        <p style={S.reassure}>Takes less than 5 minutes to set up.</p>
      </div>
    </div>
  );
}

function StepSchoolInfo({ draft, update, onNext, onBack }: { draft: Draft; update: (d: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
  const canContinue = !!draft.university && !!draft.year && !!draft.program;
  return (
    <div style={S.screen}>
      <BackBtn onClick={onBack} />
      <ProgressBar pct={11} />
      <div style={S.eyebrow}>School information</div>
      <h1 style={S.headline}>Tell us a bit about<br />where you study.</h1>
      <div style={{ marginBottom:22 }}>
        <label style={{ fontSize:13, fontWeight:600, color:"var(--ink,#27251F)", marginBottom:8, display:"block" }}>University</label>
        <SearchDropdown
          id="uni-input"
          list={UNIVERSITIES.map(u => ({ name: u, aliases: [] }))}
          onSelect={v => update({ university: v })}
          placeholder="Search for your university"
        />
      </div>
      <div style={{ marginBottom:22 }}>
        <label style={{ fontSize:13, fontWeight:600, color:"var(--ink,#27251F)", marginBottom:8, display:"block" }}>Year of study</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {YEARS.map(y => (
            <button key={y} onClick={() => update({ year: y })}
              style={{ ...S.pill, ...(draft.year === y ? S.pillActive : {}) }}
            >{y}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:22 }}>
        <label style={{ fontSize:13, fontWeight:600, color:"var(--ink,#27251F)", marginBottom:8, display:"block" }}>Program</label>
        <SearchDropdown
          id="prog-input"
          list={PROGRAMS}
          onSelect={v => update({ program: v })}
          placeholder="Search for your program"
        />
      </div>
      <div style={S.bottom}>
        <button style={{ ...S.btnPrimary, ...(canContinue ? {} : S.btnPrimaryDisabled) }} onClick={canContinue ? onNext : undefined} disabled={!canContinue}>Continue</button>
      </div>
    </div>
  );
}

function ColorPreview({ palette }: { palette: string[] }) {
  const courses = [{ code:"PSYC 101", meta:"Intro to Psychology" }, { code:"MATH 140", meta:"Calculus I" }, { code:"BIOL 110", meta:"Intro Biology" }];
  return (
    <div style={{ background:"var(--surface,#FFFCF6)", border:"1px solid var(--line,#E9DDC8)", borderRadius:18, padding:14, boxShadow:"0 6px 20px rgba(39,37,31,.06)" }}>
      {courses.map((c, i) => (
        <div key={c.code} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 6px" }}>
          <div style={{ width:5, height:30, borderRadius:99, background:palette[i % palette.length], flexShrink:0 }} />
          <div>
            <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink,#27251F)" }}>{c.code}</div>
            <div style={{ fontSize:11.5, fontWeight:500, color:"#8B8475" }}>{c.meta}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop:8, borderRadius:12, padding:"10px 12px", display:"flex", alignItems:"center", gap:8, background:`${palette[0]}22` }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:palette[0] }} />
        <span style={{ fontSize:12, fontWeight:600, color:palette[0] }}>Study block · 6:00 PM</span>
      </div>
    </div>
  );
}

function StepTheme({ draft, update, onNext, onBack }: { draft: Draft; update: (d: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const schoolPal = SCHOOL_PALETTES[draft.university] || DEFAULT_PALETTE;
  const kyberPal = KYBER_THEMES[draft.kyberIdx].colors;
  const ownPal = draft.ownPicked.length ? draft.ownPicked : ["#E9DDC8","#E9DDC8","#E9DDC8"];

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
    else { if (picked.length >= 3) picked.shift(); picked.push(c); }
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
  }, []);

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

  const cardStyle = (active: boolean): React.CSSProperties => ({
    ...S.card,
    ...(active ? S.cardActive : {}),
  });

  const iconBox = (active: boolean): React.CSSProperties => ({
    width:38, height:38, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
    background: active ? "var(--surface,#FFFCF6)" : "#FFF3D2",
  });

  const radio = (active: boolean): React.CSSProperties => ({
    width:20, height:20, borderRadius:"50%", border:`2px solid ${active ? "#E9A319" : "var(--line,#E9DDC8)"}`,
    marginLeft:"auto", flexShrink:0, position:"relative", display:"flex", alignItems:"center", justifyContent:"center",
  });

  const palette = currentPalette();

  return (
    <div style={S.screen}>
      <BackBtn onClick={onBack} />
      <ProgressBar pct={21} />
      <div style={S.eyebrow}>Make it yours</div>
      <h1 style={S.headline}>How should Kyber<br />colour your courses?</h1>
      <p style={S.sub}>This sets the colours Kyber assigns your courses. You can always change one later from inside that course.</p>

      {/* School colours */}
      <div style={cardStyle(draft.themeMode === "school")} onClick={() => setMode("school")}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={iconBox(draft.themeMode === "school")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={draft.themeMode === "school" ? "#D89210" : "#8B8475"} strokeWidth="1.8">
              <path d="M3 10L12 4L21 10L12 16L3 10Z" strokeLinejoin="round"/><path d="M6 12V17C6 17 8.5 19 12 19C15.5 19 18 17 18 17V12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:14.5, fontWeight:600, color:"var(--ink,#27251F)" }}>Use my school colours</div>
            <div style={{ fontSize:12.5, fontWeight:500, color:"#5E594E", marginTop:1 }}>Pulled from {draft.university || "your school"}</div>
          </div>
          <div style={radio(draft.themeMode === "school")}>
            {draft.themeMode === "school" && <div style={{ position:"absolute", inset:3, borderRadius:"50%", background:"#E9A319" }} />}
          </div>
        </div>
      </div>

      {/* Kyber themes */}
      <div style={cardStyle(draft.themeMode === "kyber")} onClick={() => setMode("kyber")}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={iconBox(draft.themeMode === "kyber")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={draft.themeMode === "kyber" ? "#D89210" : "#8B8475"} strokeWidth="1.8">
              <path d="M12 2L14.5 8.5L21 9L16 13.5L17.5 20L12 16.5L6.5 20L8 13.5L3 9L9.5 8.5L12 2Z" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14.5, fontWeight:600, color:"var(--ink,#27251F)" }}>Choose from Kyber themes</div>
            <div style={{ fontSize:12.5, fontWeight:500, color:"#5E594E", marginTop:1 }}>{KYBER_THEMES[draft.kyberIdx].name} — {KYBER_THEMES[draft.kyberIdx].desc}</div>
          </div>
          <div style={radio(draft.themeMode === "kyber")}>
            {draft.themeMode === "kyber" && <div style={{ position:"absolute", inset:3, borderRadius:"50%", background:"#E9A319" }} />}
          </div>
        </div>
        {draft.themeMode === "kyber" && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--line,#E9DDC8)" }}>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {KYBER_THEMES.map((t, i) => (
                <div key={t.name} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, width:64 }}
                  onClick={e => { e.stopPropagation(); update({ kyberIdx: i }); }}>
                  <div style={{ width:56, height:56, borderRadius:14, cursor:"pointer", border:`2px solid ${i === draft.kyberIdx ? "#27251F" : "transparent"}`, display:"flex", overflow:"hidden", flexDirection:"column" }}>
                    {t.colors.map(c => <div key={c} style={{ flex:1, background:c }} />)}
                  </div>
                  <div style={{ fontSize:10.5, fontWeight:600, color: i === draft.kyberIdx ? "#27251F" : "#5E594E", textAlign:"center", lineHeight:1.2 }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Choose my own */}
      <div style={cardStyle(draft.themeMode === "own")} onClick={() => setMode("own")}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={iconBox(draft.themeMode === "own")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={draft.themeMode === "own" ? "#D89210" : "#8B8475"} strokeWidth="1.8">
              <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="11" cy="7.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>
              <path d="M12 21C7 21 3 17.5 3 12.5C3 7.5 7 4 12 4C16.5 4 20 7 20 11C20 13.5 18 15 16 15H14.5C13.5 15 13 15.7 13 16.5C13 17 13.2 17.4 13.5 17.8C13.8 18.2 14 18.6 14 19C14 20 13.2 21 12 21Z" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:14.5, fontWeight:600, color:"var(--ink,#27251F)" }}>Choose my own</div>
            <div style={{ fontSize:12.5, fontWeight:500, color:"#5E594E", marginTop:1 }}>Pick up to 3 colours</div>
          </div>
          <div style={radio(draft.themeMode === "own")}>
            {draft.themeMode === "own" && <div style={{ position:"absolute", inset:3, borderRadius:"50%", background:"#E9A319" }} />}
          </div>
        </div>
        {draft.themeMode === "own" && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--line,#E9DDC8)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", gap:9, flexWrap:"wrap", marginBottom:16 }}>
              {OWN_SWATCHES.map(c => {
                const idx = draft.ownPicked.indexOf(c);
                const picked = idx > -1;
                return (
                  <div key={c} onClick={() => toggleOwnColor(c)}
                    style={{ width:34, height:34, borderRadius:"50%", cursor:"pointer", background:c, border:`2px solid ${picked ? "#27251F" : "transparent"}`, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {picked && <>
                      <div style={{ position:"absolute", inset:0, borderRadius:"50%", boxShadow:"0 0 0 2px var(--surface,#FFFCF6) inset" }} />
                      <span style={{ position:"relative", zIndex:1, color:"#fff", fontSize:13, fontWeight:700, textShadow:"0 1px 3px rgba(0,0,0,.45)" }}>{idx + 1}</span>
                    </>}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:"#5E594E", marginBottom:8 }}>Or pick any colour</div>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <canvas ref={canvasRef} width={130} height={130} onClick={handleWheelClick} style={{ borderRadius:"50%", cursor:"crosshair", boxShadow:"0 4px 14px rgba(39,37,31,.12)" }} />
              <div style={{ fontSize:12, fontWeight:500, color:"#8B8475", lineHeight:1.5, maxWidth:120 }}>Tap the wheel to add a pick.</div>
            </div>
            {draft.ownPicked.length > 0 && (
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"#5E594E", marginTop:16, marginBottom:8 }}>Your picks — tap to remove</div>
                <div style={{ display:"flex", gap:10 }}>
                  {draft.ownPicked.map((c, i) => (
                    <div key={c} onClick={() => toggleOwnColor(c)}
                      style={{ width:34, height:34, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:700, textShadow:"0 1px 3px rgba(0,0,0,.45)", cursor:"pointer", border:"2px solid #27251F", background:c, position:"relative" }}>
                      {i + 1}
                      <span style={{ position:"absolute", top:-5, right:-5, width:15, height:15, borderRadius:"50%", background:"#27251F", color:"#fff", fontSize:11, lineHeight:"15px", textAlign:"center", textShadow:"none" }}>×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#8B8475", margin:"20px 0 10px" }}>Preview</div>
      <ColorPreview palette={palette} />
      <div style={S.bottom}>
        <button style={S.btnPrimary} onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}

const GOALS = [
  { id:"comfortable", title:"Stay comfortably on top of my courses", icon: <svg viewBox="0 0 24 24" fill="none" width="19" height="19"><path d="M9 12L11 14L16 8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9"/></svg> },
  { id:"improve", title:"Improve my grades", icon: <svg viewBox="0 0 24 24" fill="none" width="19" height="19"><path d="M4 17L10 11L14 15L20 8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 8H20V13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id:"strong", title:"Aim for strong grades", icon: <svg viewBox="0 0 24 24" fill="none" width="19" height="19"><path d="M12 3L14.5 9L21 9.5L16 13.8L17.5 20L12 16.5L6.5 20L8 13.8L3 9.5L9.5 9L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id:"protect", title:"Protect a scholarship or GPA requirement", icon: <svg viewBox="0 0 24 24" fill="none" width="19" height="19"><path d="M12 3L19 6V11C19 15.4 16 19 12 21C8 19 5 15.4 5 11V6L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id:"figuring", title:"I'm still figuring it out", icon: <svg viewBox="0 0 24 24" fill="none" width="19" height="19"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9"/><path d="M9.5 9.2C9.8 8 10.8 7.2 12 7.2C13.4 7.2 14.5 8.2 14.5 9.5C14.5 10.8 13.4 11.2 12.5 11.8C12.1 12.1 12 12.5 12 13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><circle cx="12" cy="16" r="0.9" fill="currentColor"/></svg> },
];

function StepGoal({ draft, update, onNext, onBack }: { draft: Draft; update: (d: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
  function toggle(id: string) {
    const g = new Set(draft.goals);
    if (g.has(id)) g.delete(id); else g.add(id);
    update({ goals: g });
  }
  const canContinue = draft.goals.size > 0;
  return (
    <div style={S.screen}>
      <BackBtn onClick={onBack} />
      <ProgressBar pct={43} />
      <div style={S.eyebrow}>Semester goal</div>
      <h1 style={S.headline}>What are you<br />aiming for?</h1>
      <p style={S.sub}>Pick as many as apply. No pressure — this just helps Kyber plan, and you can change your mind anytime.</p>
      {GOALS.map(g => {
        const active = draft.goals.has(g.id);
        return (
          <div key={g.id} onClick={() => toggle(g.id)} style={{ ...S.card, ...(active ? S.cardActive : {}), display:"flex", alignItems:"center", gap:13 }}>
            <div style={{ width:40, height:40, borderRadius:12, background: active ? "var(--surface,#FFFCF6)" : "#FFF3D2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color: active ? "#D89210" : "#8B8475" }}>
              {g.icon}
            </div>
            <div style={{ fontSize:14.5, fontWeight:600, color:"var(--ink,#27251F)", lineHeight:1.3 }}>{g.title}</div>
          </div>
        );
      })}
      <div style={S.bottom}>
        <button style={{ ...S.btnPrimary, ...(canContinue ? {} : S.btnPrimaryDisabled) }} onClick={canContinue ? onNext : undefined} disabled={!canContinue}>Continue</button>
      </div>
    </div>
  );
}

const STUDY_TIMES = [
  { id:"morning", title:"Morning", icon: <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3V5M12 19V21M3 12H5M19 12H21M5.6 5.6L7 7M17 17L18.4 18.4M18.4 5.6L17 7M7 17L5.6 18.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id:"afternoon", title:"Afternoon", icon: <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><circle cx="12" cy="14" r="5" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3V5.5M4 14H2M22 14H20M6 6.5L4.5 5M18 6.5L19.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id:"evening", title:"Evening", icon: <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><path d="M6 16H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 16C8 13.8 9.8 12 12 12C14.2 12 16 13.8 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 9V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8.5 7.5L7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M15.5 7.5L17 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id:"latenight", title:"Late night", icon: <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><path d="M20 13.5A8.5 8.5 0 1 1 10.5 4A6.8 6.8 0 0 0 20 13.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M18 4.5L18.6 5.9L20 6.5L18.6 7.1L18 8.5L17.4 7.1L16 6.5L17.4 5.9Z" fill="currentColor"/></svg> },
  { id:"weekends", title:"Weekends", icon: <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M4 9.5H20" stroke="currentColor" strokeWidth="1.8"/><path d="M8 3V6.5M16 3V6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id:"nopref", title:"No strong preference", icon: <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/></svg> },
];

function StepStudyTime({ draft, update, onNext, onBack }: { draft: Draft; update: (d: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
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
    <div style={S.screen}>
      <BackBtn onClick={onBack} />
      <ProgressBar pct={57} />
      <div style={S.eyebrow}>Study time</div>
      <h1 style={S.headline}>When do you like<br />to get work done?</h1>
      <p style={S.sub}>Pick as many as apply. Kyber will favour these times, but still plans around your real commitments.</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        {STUDY_TIMES.map(t => {
          const active = draft.studyTimes.has(t.id);
          return (
            <div key={t.id} onClick={() => toggle(t.id)}
              style={{ background:"var(--surface,#FFFCF6)", border:`1.5px solid ${active ? "#E9A319" : "var(--line,#E9DDC8)"}`, borderRadius:18, padding:"16px 14px", cursor:"pointer", transition:"border-color .15s", display:"flex", flexDirection:"column", gap:10, ...(active ? { background:"#FCE7AE" } : {}) }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ width:34, height:34, borderRadius:10, background: active ? "var(--surface,#FFFCF6)" : "#FFF3D2", display:"flex", alignItems:"center", justifyContent:"center", color: active ? "#D89210" : "#8B8475" }}>
                  {t.icon}
                </div>
              </div>
              <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink,#27251F)" }}>{t.title}</div>
            </div>
          );
        })}
      </div>
      <div style={S.bottom}>
        <button style={{ ...S.btnPrimary, ...(canContinue ? {} : S.btnPrimaryDisabled) }} onClick={canContinue ? onNext : undefined} disabled={!canContinue}>Continue</button>
      </div>
    </div>
  );
}

const STUDY_BLOCKS = [
  { id:"short", title:"20–30 minutes", desc:"Quick, focused bursts" },
  { id:"medium", title:"45–60 minutes", desc:"A solid single sitting" },
  { id:"long", title:"Longer focused sessions", desc:"Deep, uninterrupted stretches of time" },
  { id:"mix", title:"A mix", desc:"Depends on the day and the course" },
  { id:"figuring", title:"I'm still figuring it out", desc:"Kyber will start you off with a mix" },
];

function StepStudyBlock({ draft, update, onNext, onBack }: { draft: Draft; update: (d: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
  const canContinue = !!draft.studyBlock;
  return (
    <div style={S.screen}>
      <BackBtn onClick={onBack} />
      <ProgressBar pct={71} />
      <div style={S.eyebrow}>Study blocks</div>
      <h1 style={S.headline}>How long do you like<br />to study at a time?</h1>
      <p style={S.sub}>Pick as many as apply. Kyber uses this to size your first study sessions — it&apos;ll adjust over time based on what actually works.</p>
      {STUDY_BLOCKS.map(b => {
        const active = draft.studyBlock === b.id;
        return (
          <div key={b.id} onClick={() => update({ studyBlock: b.id })}
            style={{ ...S.card, ...(active ? S.cardActive : {}), display:"flex", alignItems:"center", gap:13 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14.5, fontWeight:600, color:"var(--ink,#27251F)", lineHeight:1.3 }}>{b.title}</div>
              <div style={{ fontSize:12, fontWeight:500, color:"#8B8475", marginTop:1 }}>{b.desc}</div>
            </div>
          </div>
        );
      })}
      <div style={S.bottom}>
        <button style={{ ...S.btnPrimary, ...(canContinue ? {} : S.btnPrimaryDisabled) }} onClick={canContinue ? onNext : undefined} disabled={!canContinue}>Continue</button>
        <p style={S.reassure}>You can always change this later — Kyber also learns from what you actually do.</p>
      </div>
    </div>
  );
}

// ─── Commitments step ────────────────────────────────────────────────────────

function StepCommitments({ draft, update, onNext, onBack }: { draft: Draft; update: (d: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
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

  return (
    <div style={S.screen}>
      <BackBtn onClick={onBack} />
      <ProgressBar pct={86} />
      <div style={S.eyebrow}>Weekly commitments</div>
      <h1 style={S.headline}>What regularly takes<br />up your time?</h1>
      <p style={S.sub}>Tap what applies — we&apos;ll add it now. Fill in the day and time whenever you&apos;re ready.</p>

      {/* Quick-add grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
        {COMMITMENT_TYPES.map(t => (
          <button key={t.id} onClick={() => addCommitment(t.id)}
            style={{ display:"flex", alignItems:"center", gap:8, background:"#FFF3D2", border:"1.5px solid transparent", borderRadius:13, padding:"10px 11px", cursor:"pointer", fontSize:12.5, fontWeight:600, color:"#5E594E", fontFamily:"inherit" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Commitment list */}
      {draft.commitments.map((c, i) => {
        const hasDetail = c.days.length > 0 && c.startTime && c.duration;
        const dayStr = hasDetail ? c.days.map(d => DAYS_LABELS[d]).join(", ") : "";
        return (
          <div key={i} onClick={() => openEdit(i)} style={{ background:"var(--surface,#FFFCF6)", border:"1px solid var(--line,#E9DDC8)", borderRadius:16, padding:"12px 14px", marginBottom:9, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink,#27251F)" }}>{c.title}</div>
              <div style={{ fontSize:11.5, fontWeight:500, color:"#8B8475", marginTop:1, fontStyle: hasDetail ? "normal" : "italic" }}>
                {hasDetail ? `${dayStr} · ${c.startTime} · ${c.duration}` : "Tap to add day & time"}
              </div>
            </div>
            <div style={{ fontSize:10.5, fontWeight:600, padding:"3px 9px", borderRadius:99, flexShrink:0, background: c.fixed ? "#FCE7AE" : "#FFF3D2", color: c.fixed ? "#D89210" : "#5E594E" }}>
              {c.fixed ? "Fixed" : "Flexible"}
            </div>
            <button onClick={e => { e.stopPropagation(); removeCommitment(i); }} style={{ width:24, height:24, borderRadius:"50%", border:"none", background:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#8B8475", flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
            </button>
          </div>
        );
      })}

      {/* Edit form */}
      {editIdx !== null && formDraft && (
        <div style={{ background:"var(--surface,#FFFCF6)", border:"1px solid var(--line,#E9DDC8)", borderRadius:18, padding:16, marginBottom:12, boxShadow:"0 6px 20px rgba(39,37,31,.06)" }}>
          <label style={{ fontSize:12, fontWeight:600, color:"var(--ink,#27251F)", marginBottom:8, display:"block" }}>Title</label>
          <input value={formDraft.title} onChange={e => updateForm({ title: e.target.value })} placeholder="Name it"
            style={{ width:"100%", background:"#FFF3D2", border:"1.5px solid transparent", borderRadius:13, padding:"11px 13px", fontFamily:"inherit", fontSize:13, fontWeight:600, color:"var(--ink,#27251F)", outline:"none", marginBottom:18 }} />

          <label style={{ fontSize:12, fontWeight:600, color:"var(--ink,#27251F)", marginBottom:8, display:"block" }}>Which day(s)?</label>
          <div style={{ display:"flex", gap:6, marginBottom:18 }}>
            {DAYS_LABELS.map((d, i) => (
              <div key={i} onClick={() => toggleDay(i)}
                style={{ width:38, height:38, borderRadius:"50%", background: formDraft.days.has(i) ? "#E9A319" : "#FFF3D2", border:`1.5px solid ${formDraft.days.has(i) ? "#E9A319" : "transparent"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color: formDraft.days.has(i) ? "#27251F" : "#5E594E", cursor:"pointer", flex:1 }}>
                {d}
              </div>
            ))}
          </div>

          <label style={{ fontSize:12, fontWeight:600, color:"var(--ink,#27251F)", marginBottom:8, display:"block" }}>Roughly when?</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:18 }}>
            {TIMES_OF_DAY.map(t => (
              <div key={t} onClick={() => updateForm({ period: t, startTime: null })}
                style={{ background: formDraft.period === t ? "#FCE7AE" : "#FFF3D2", border:`1.5px solid ${formDraft.period === t ? "#E9A319" : "transparent"}`, borderRadius:99, padding:"9px 14px", fontSize:12.5, fontWeight:600, color: formDraft.period === t ? "#D89210" : "#5E594E", cursor:"pointer" }}>
                {t}
              </div>
            ))}
          </div>

          {formDraft.period && <>
            <label style={{ fontSize:12, fontWeight:600, color:"var(--ink,#27251F)", marginBottom:8, display:"block" }}>Starts at</label>
            <div style={{ display:"flex", gap:8, overflowX:"auto", scrollSnapType:"x proximity", paddingBottom:4, marginBottom:18, scrollbarWidth:"none" }}>
              {PERIOD_TIMES[formDraft.period]?.map(time => (
                <div key={time} onClick={() => updateForm({ startTime: time })}
                  style={{ flexShrink:0, background: formDraft.startTime === time ? "#FCE7AE" : "#FFF3D2", border:`1.5px solid ${formDraft.startTime === time ? "#E9A319" : "transparent"}`, borderRadius:12, padding:"9px 13px", fontSize:12.5, fontWeight:600, color: formDraft.startTime === time ? "#D89210" : "#5E594E", cursor:"pointer", whiteSpace:"nowrap" }}>
                  {time}
                </div>
              ))}
            </div>

            <label style={{ fontSize:12, fontWeight:600, color:"var(--ink,#27251F)", marginBottom:8, display:"block" }}>For how long?</label>
            <div style={{ display:"flex", gap:8, overflowX:"auto", scrollSnapType:"x proximity", paddingBottom:4, marginBottom:18, scrollbarWidth:"none" }}>
              {DURATIONS.map(d => (
                <div key={d} onClick={() => updateForm({ duration: d })}
                  style={{ flexShrink:0, background: formDraft.duration === d ? "#FCE7AE" : "#FFF3D2", border:`1.5px solid ${formDraft.duration === d ? "#E9A319" : "transparent"}`, borderRadius:12, padding:"9px 13px", fontSize:12.5, fontWeight:600, color: formDraft.duration === d ? "#D89210" : "#5E594E", cursor:"pointer", whiteSpace:"nowrap" }}>
                  {d}
                </div>
              ))}
            </div>
          </>}

          <label style={{ fontSize:12, fontWeight:600, color:"var(--ink,#27251F)", marginBottom:8, display:"block" }}>Fixed or flexible?</label>
          <div style={{ display:"flex", background:"#FFF3D2", borderRadius:99, padding:4, marginBottom:18 }}>
            {[["Fixed", true], ["Flexible", false]].map(([label, val]) => (
              <button key={String(label)} onClick={() => updateForm({ fixed: val as boolean })}
                style={{ flex:1, border:"none", background: formDraft.fixed === val ? "var(--surface,#FFFCF6)" : "none", cursor:"pointer", fontFamily:"inherit", fontWeight:600, fontSize:13, color: formDraft.fixed === val ? "var(--ink,#27251F)" : "#5E594E", padding:9, borderRadius:99, boxShadow: formDraft.fixed === val ? "0 2px 6px rgba(39,37,31,.1)" : "none", transition:"all .15s" }}>
                {label as string}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <button onClick={cancelEdit} style={{ background:"none", border:"none", fontFamily:"inherit", fontWeight:600, fontSize:13, color:"#8B8475", cursor:"pointer", padding:"12px 6px" }}>Cancel</button>
            <button onClick={saveEdit} disabled={!formDraft.title.trim()}
              style={{ flex:1, background:"#E9A319", color:"#27251F", border:"none", fontFamily:"inherit", fontWeight:700, fontSize:14, padding:12, borderRadius:14, cursor:"pointer", opacity: formDraft.title.trim() ? 1 : 0.4 }}>
              Save
            </button>
          </div>
        </div>
      )}

      {draft.commitments.length === 0 && (
        <p onClick={onNext} style={{ textAlign:"center", fontSize:13, fontWeight:600, color:"#8B8475", textDecoration:"underline", textUnderlineOffset:3, cursor:"pointer", marginTop:2 }}>
          Nothing regular right now
        </p>
      )}

      <div style={S.bottom}>
        <button style={S.btnPrimary} onClick={onNext}>Continue</button>
        <p style={S.reassure}>You can add or change these anytime from Plan.</p>
      </div>
    </div>
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
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  function resolvePalette(): string[] {
    if (draft.themeMode === "school") return SCHOOL_PALETTES[draft.university] || DEFAULT_PALETTE;
    if (draft.themeMode === "kyber") return KYBER_THEMES[draft.kyberIdx].colors;
    return draft.ownPicked.length ? draft.ownPicked : DEFAULT_PALETTE;
  }

  function finish() {
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
    <div style={{ position:"absolute", inset:0 }}>
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
