# Kyber — Customer Testing MVP

Mobile-first web prototype for student customer testing. Parses university syllabi into a three-tab experience: **Courses** (grade breakdown, insights, deadlines), **Now** (priority daily checklist), and **Plan** (month/week/day calendar).

## Local Setup

```bash
npm install
cp .env.example .env.local
# fill in env vars (see below)
npm run dev
# → http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | For real syllabus upload | Server-side only — never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Optional (analytics) | PostHog Project API Key (`phc_…`). Legacy name `NEXT_PUBLIC_POSTHOG_KEY` is also accepted. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | Default: `https://us.i.posthog.com` |

## Demo Fixtures

The app ships with hand-crafted demo data for HBA1 and Data Science semesters. To replace with real parsed data:

```bash
# Reads ANTHROPIC_API_KEY from .env.local automatically
npx tsx scripts/generate-fixtures.ts
```

This parses all 16 PDFs in `sources/Sylabus examples/` and writes TypeScript fixture files to `src/data/fixtures/`. Estimated cost: ~$0.50 in Anthropic API calls.

## Syllabus Upload (Real Parsing)

The `/api/parse` endpoint accepts `multipart/form-data` with PDF or `.txt` files. It uses:
- `claude-haiku-4-5` for text-layer PDFs (fast, cheap)
- `claude-sonnet-4-6` for scanned/image PDFs (vision)

The `ANTHROPIC_API_KEY` is server-side only. Users never see it.

## PostHog Analytics Setup

1. Create a project at posthog.com
2. Copy the Project API Key → `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
3. Copy the API host → `NEXT_PUBLIC_POSTHOG_HOST`

### Recommended Funnels to Create

- **Onboarding**: `app_opened → onboarding_started → demo_semester_selected OR syllabus_upload_completed → tab_viewed`
- **Engagement**: `semester_loaded → course_opened → grade_calculator_used`
- **Now value**: `now_task_opened → now_task_completed` (completion rate)
- **Drop-off**: `onboarding_started` → where users stop

### Key Questions This Answers

| Question | Signal |
|---|---|
| Courses vs Now/Plan value | `tab_viewed` distribution |
| Now ongoing value | `now_task_completed` rate over sessions |
| Plan: useful or overwhelming? | `plan_viewed` views per user + `plan_item_opened` |
| Which course sections matter | `course_section_viewed` breakdown |
| Where users drop off | Onboarding funnel |
| Parser success rate | `syllabus_upload_completed` vs `syllabus_upload_failed` |

### Privacy

Session replay is enabled with `maskAllInputs: true`. File inputs use `ph-no-capture`. Syllabus text, filenames, grades, and notes are never captured.

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# ANTHROPIC_API_KEY (server-side)
# NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
# NEXT_PUBLIC_POSTHOG_HOST
```

The parse route has a 60s timeout configured in `vercel.json`.

## Branding

Matches the official Kyber brand system (`sources/Branding.pdf`):
- Primary (amber — action/emphasis): `#E9A319`
- Accent (gold): `#FFC857`
- Neutral (cream background): `#FFF9ED`
- Dark (charcoal text): `#27251F`
- Font: **Manrope** (display + body + UI), system fallback
- Voice: clear, calm, encouraging, intelligent, concise, student-aware

Per-course accent colors (amber, sky, green, purple, gold) are used only to visually distinguish courses in lists and the calendar.

## What Was Built

1. **Onboarding** — Logo, tagline, 3 demo options (HBA1 S1, HBA1 S2, Data Science S1), upload flow
2. **Courses tab** — Course list → course detail (grade breakdown, insights, study method, tips, events, policies) → grade calculator
3. **Now tab** — Auto-generated daily priority list from upcoming deadlines; check-off with localStorage persistence
4. **Plan tab** — Month/week/day calendar views with event dots color-coded by type
5. **TypeScript parser** — Port of Python syllabus_parser; Haiku for text PDFs, Sonnet for scanned
6. **Pre-parsed fixtures** — Hand-crafted data for 16 courses (HBA1 + Data Science, both semesters)
7. **PostHog analytics** — Typed event wrappers, session replay with privacy masks
8. **localStorage persistence** — Courses and task completions survive refresh

## Intentional Deviations

- Parser ported to TypeScript (no Python runtime on Vercel)
- Demo fixtures are hand-crafted (run `generate-fixtures.ts` with your API key to replace)
- Plan tab shows syllabus events only (no auto-generated study blocks — syllabi don't have class times)
- No class schedule in Plan (syllabi don't reliably include this)
