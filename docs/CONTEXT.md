# Kyber — Working Context for Claude

Handoff notes for a later Claude Code session. This captures things that are
**not obvious from the code alone**: architecture gotchas, the analytics system,
the date-anchoring system, and open work. Last updated 2026-10-12.

---

## Project snapshot

- **What it is:** Kyber — a mobile-mockup study/semester planner. Students
  onboard, load a demo semester (HBA or Data Science) or upload syllabi, and get
  a Courses / Now / Plan experience. Currently in a friends **beta**.
- **Stack:** Next.js 16.4.0 (App Router, **Turbopack**), React 19, TypeScript.
  `AGENTS.md` warns this Next version differs from training data — read
  `node_modules/next/dist/docs/` before non-trivial Next work.
- **Repo:** `github.com/abearz8/Kyber`, default branch `main`. Solo dev commits
  directly to `main`.

### Commands
- Dev: `npm run dev`
- Typecheck: `npx tsc --noEmit` (~60s cold). **Run only ONE tsc at a time** —
  several concurrent runs contend for CPU and none finish (learned the hard way).
- Build: `npm run build` (~9 min cold with Turbopack; it also runs tsc).

### Architecture essentials (a tab-state SPA)
- **Routes:** `/` = onboarding, `/app` = main app. That's it — navigation
  *within* the app is React state, **not** URL changes. (Critical for analytics;
  see below.)
- **Global store:** `src/hooks/useStore.ts` — `useReducer` + `localStorage`
  (key `kyber-app-state-v1`). Hydrates in an effect; `hydrated` flag gates the
  first render. `saveToStorage` forces `activeTab: "courses"` on persist.
- **Screens / components:**
  - Courses: `CourseList` → `CourseAccordionCard` → `CourseDetail` →
    `GradeCalculator`. **`detailCourseId` (open course) is LOCAL state in
    `CourseList`, not the store** — matters for where hooks must live.
  - Now: `NowTab` → `SummarySheet`, `PlanItemSheet`
  - Plan: `PlanTab` → `WeekView`/`MonthView`, `PlanItemSheet`, `AddToPlanSheet`
  - Onboarding: `OnboardingQuestionnaire` (6 steps) → `OnboardingScreen`
    (demo/upload) → `SemesterReveal`. `src/app/page.tsx` holds the `phase`.
- **Gotcha — stray duplicate files:** three untracked macOS-style duplicates
  (`layout 2.tsx`, `NowTab 2.tsx`, `OnboardingQuestionnaire 2.tsx`) existed and
  broke `tsc` (tsconfig globs `**/*.tsx`). They were deleted. If files like
  `* 2.tsx` reappear (iCloud/Finder copies), delete them.

---

## Analytics (PostHog)

### How it's wired
- `src/lib/analytics.ts` — thin typed `track` wrapper; the **single place** all
  events go through. Lazy-loads `posthog-js` (so `ph` may be null briefly;
  every call is null-guarded).
- `initAnalytics()` config: `person_profiles: "always"` (each beta user is a
  distinct person → unique counts + retention), `capture_pageview/pageleave`,
  `session_recording.maskAllInputs: true`, autocapture limited to `a`/`button`.
  The week-notes textarea has `ph-no-capture`.
- `src/app/AnalyticsProvider.tsx` inits it; token/host come from env via
  `src/app/layout.tsx`: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (or `…_KEY`) and
  `NEXT_PUBLIC_POSTHOG_HOST`. Set in `.env.local` (git-ignored).

### The key design point
Kyber is a **tab-state SPA — the URL never changes** between Courses/Now/Plan or
when opening a course. So PostHog's automatic pageviews only ever see `/` and
`/app`. All in-app navigation/dwell is captured by **custom virtual-screen
events** instead (below). Don't expect `$pageview` to tell you anything about
in-app screens.

### `useScreenTime` hook — `src/hooks/useScreenTime.ts`
Fires `screen_viewed { screen, from }` on enter and `screen_dwell { screen,
seconds }` on change/unmount. StrictMode-safe (0.15s floor drops the dev
double-invoke phantom), monotonic `performance.now()`, depends only on
`[screen]` so it never fires on plain re-renders. Pass `null` to track nothing.

Wired in 7 places (pass `null` for "courses" in AppPage so `CourseList` owns
list-vs-detail; gate on `hydrated` to avoid a boot phantom):
- `src/app/app/page.tsx` → `now`, `plan`, `syllabus_upload`
- `src/components/courses/CourseList.tsx` → `courses` / `course_detail:<CODE>`
- `src/components/courses/CourseDetail.tsx` → `grade_calculator:<CODE>`
- `src/components/now/NowTab.tsx` → `now_summary:<kind>`
- `src/components/plan/PlanItemSheet.tsx` → `plan_item:<kind>` (covers Now + Plan)
- `src/components/plan/AddToPlanSheet.tsx` → `add_to_plan`
- `src/app/page.tsx` → `onboarding_questionnaire` / `onboarding_upload` /
  `onboarding_reveal`

### Full event surface
Navigation: `screen_viewed`, `screen_dwell`.
Onboarding/activation: `app_opened`, `onboarding_started`,
`onboarding_step_completed {step,name}`, `demo_semester_selected {program}`,
`syllabus_upload_started/completed/failed`, `semester_loaded {source}`.
Feature usage: `tab_viewed`, `course_opened`, `course_section_viewed`,
`grade_calculator_used`, `insight_opened`, `now_task_opened`,
`now_task_completed`, `plan_viewed`, `plan_item_opened`.
Value-intent: `calendar_exported {source}`, `course_dates_added {count}`,
`week_mood_set {mood}`, `replan_tapped`, `appearance_customized {where}`.

**Cohort super-properties** (attached to EVERY event via `track.setUserContext`,
called from `handleProfileComplete` and re-registered each session in AppPage):
`program`, `university`, `year`, `study_block`, `goals_count`. Break down any
insight by these to compare cohorts.

**Adding a new event:** add a method to the `track` object in `analytics.ts`
(camelCase method → snake_case event name is the convention), then call
`track.yourEvent(...)` at the call site. Keep everything funneled through the
wrapper.

**Cleanups made:** removed the never-called `parsedInfoEdited`; dropped the
always-zero `days_until` arg from `nowTaskCompleted` (the Now tab only ever
shows today's items).

### Dashboards to build (in the PostHog UI — can't be done from code)
1. **Activation funnel** (Funnel): `onboarding_started → onboarding_step_completed(last) → semester_loaded → first screen_viewed`; break by `semester_loaded.source` for demo-vs-upload.
2. **HBA vs Data Science** (Trends): `demo_semester_selected` by `program` (or break anything by the `program` super-property).
3. **Screen popularity** (Trends): `screen_viewed` by `screen`.
4. **What holds attention** (Trends/SQL): `screen_dwell`, aggregation = **average of `seconds`**, by `screen` (pair with total).
5. **Navigation paths** (Paths): `screen_viewed` as the path event, or break by `from`.
6. **Feature leaderboard** (Trends): one series each for the feature-usage + value-intent events.
7. **Value-intent** (Funnel/Trends): `syllabus_upload_completed`, `calendar_exported`, `course_dates_added`.
8. **Retention** (Retention): returning users firing any `screen_viewed`.

**Highest-ROI tie-in:** in Session Replay, filter by event (e.g. `screen_dwell.seconds > 60` on `grade_calculator`, or sessions with `syllabus_upload_failed`) to jump straight to the relevant replays.

---

## Dates / academic calendar

### The problem that was fixed
Syllabus deadlines carried whatever year the document was written for, and some
Data Science fixture courses had years **mis-extracted by a decade** (2035 /
2037 / 2028) — so deadlines sat years in the future. The old generator used a
single linear offset pinned to the earliest event, which can't rescue years
that are a decade off.

### The system — `src/lib/academicCalendar.ts`
- `anchorToAcademicYear(iso, ref?)` — keeps month/day, reassigns the **year** to
  the current academic year. Academic year runs **Aug→Jul**: fall months
  (Aug–Dec) → fall year, Jan–Jul → the next calendar year. So "a November
  deadline becomes this November," "a March deadline becomes next March."
- `withinWindow(iso, ref?, pastDays=60, futureMonths=8)` — keep-window check.
- `anchorAndFilterDates(events, ref?)` — anchor then filter to the window, with
  a **never-empty safeguard** (if filtering removes everything, returns the
  anchored-but-unfiltered list).

### Where it's used
- **Parser** (`src/lib/parser/schema.ts` → `normalize()`): anchors + filters
  every extracted event into `[now−60d, now+8mo]`, using the `today` param as
  reference (defaults to now). So **any future upload is auto-corrected**
  regardless of a stale or mis-parsed year. This is the "fix the parser" piece.
- **Generator** (`scripts/generate-fixtures.ts`): the old linear-offset
  `normalizeDates` was removed — the parser now anchors, so a separate pass
  would double-shift.
- **Committed fixtures** (`scripts/renormalize-fixture-dates.ts`): re-anchors the
  DS fixtures in place (no LLM re-parse) and also fixes their stale `term`
  labels (e.g. "Fall 2024" → "Fall 2026"). Run with
  `npx tsx scripts/renormalize-fixture-dates.ts`.

### Fixtures
`src/data/fixtures/{hba1-s1,hba1-s2,ds-s1,ds-s2}.ts` — arrays of `Course`, loaded
in `OnboardingScreen.loadDemo()`. After the fix, DS spans **2026-08 → 2027-03**
with no outlier years. HBA was already current and left untouched (the request
was DS-specific). Fixtures are anchor-only (no window filter) so curated demo
courses never lose events; the parser filters.

### ⚠️ Known drift
Fixture dates are **baked**, so they go stale next academic year. To refresh,
re-run `npx tsx scripts/renormalize-fixture-dates.ts`. For an **evergreen**
alternative, move the anchoring to demo load-time (`OnboardingScreen.loadDemo`)
so dates are computed relative to "today" on every run — suggested but not done.

### Full regeneration from source PDFs (rarely needed)
`npx tsx scripts/generate-fixtures.ts` — needs `ANTHROPIC_API_KEY` in
`.env.local` and the PDFs under `sources/Sylabus examples/`. Slow (LLM parse of
16 syllabi) and re-derives all fields, not just dates.

---

## Status & open items
- **Verified:** `tsc --noEmit` clean; `npm run build` clean. Work is on
  `origin/main` (commits `0c34ea0` analytics, `661ac03` dates).
- **Not yet done:**
  - Live smoke-test that events actually land in PostHog (needs the real
    project token; exercise onboarding → demo → tabs → course → grade calc →
    export and watch PostHog **Activity** / network calls to `i.posthog.com`).
  - Building the dashboards above in the PostHog UI (a human/UI task).
  - (Optional) evergreen demo dates via load-time anchoring.
