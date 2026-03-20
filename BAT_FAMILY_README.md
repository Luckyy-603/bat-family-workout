# Bat-Family Hybrid Workout App
### Mission Brief · Product Spec · Engineering Architecture

---

## 1. PRODUCT CONCEPT SUMMARY

A performance-focused fitness tracking application for athletes running the **Bat-Family Hybrid Workout Program** — a structured, multi-modal training system blending powerlifting strength foundations, athletic movement, combat conditioning, and mobility work. 

The app is built for a single serious user (or small audience) who wants a clean, tactile, no-nonsense training companion. Not a social fitness app. Not a subscription fitness carousel. A mission log for your training.

**Brand pillars:** Disciplined · Tactical · Minimal · Performance-first

---

## 2. MVP FEATURE LIST

### Core (MVP — Ship This First)
- [x] Program selection: 5-Day or 6-Day Bat-Family Hybrid
- [x] Weekly calendar view showing all training days
- [x] Full workout day viewer with all exercises, sets, reps, rest
- [x] Set logging: weight, reps, completion checkbox per set
- [x] Per-exercise notes field
- [x] Mark workout day complete
- [x] Exercise library with full instructions + muscles targeted
- [x] Global warm-up template viewable before any session
- [x] Progress tracker: bodyweight log, streak tracking
- [x] Week navigation (current week, +/- weeks)
- [x] Dashboard: today's mission, week at a glance, stats
- [x] Progression logic display (what to do each week)
- [x] Dark tactical UI, responsive (mobile-first)

### Phase 2 (After Validation)
- [ ] Workout history timeline (all past weeks)
- [ ] PR detection and PR board (auto-tracks heaviest set per exercise)
- [ ] Export workout history as CSV or PDF
- [ ] Bodyweight chart with trend line
- [ ] Conditioning-specific logger (sprint times, round completion)
- [ ] Exercise substitutions (alt exercises per slot)
- [ ] 1RM calculator and percentage-based loading suggestions
- [ ] Push notification reminders (PWA)
- [ ] Weekly performance summary / "Mission Report"
- [ ] Coach notes / auto-progression suggestions by week

### Phase 3 (Full Product)
- [ ] User accounts + Supabase auth
- [ ] Multi-user support (for coaches)
- [ ] Custom program builder
- [ ] Video/GIF exercise demonstrations
- [ ] Apple Health / Google Fit integration
- [ ] Mobile app (React Native / Expo)
- [ ] AI progression recommendations

---

## 3. RECOMMENDED TECH STACK

**Recommendation: Next.js 14 + TypeScript + Tailwind CSS + Supabase**

### Reasoning

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend framework | Next.js 14 (App Router) | File-based routing, RSC for perf, massive ecosystem |
| Language | TypeScript | Catches schema bugs early, self-documents the data model |
| Styling | Tailwind CSS + CSS Variables | Fast iteration, dark theme trivial, responsive built-in |
| Database | Supabase (PostgreSQL) | Free tier generous, real-time built in, auth handled |
| ORM | Prisma | Type-safe queries, migration workflow, clean schema |
| State (client) | Zustand | Lightweight, no boilerplate, works great with Next.js |
| Auth | Supabase Auth | Email/magic link, social OAuth, JWT built-in |
| Deployment | Vercel | Zero-config Next.js, CDN, preview deployments |
| Local dev DB | Supabase CLI (Docker) | Match prod locally |

**Alternative lean option (no backend):** Vite + React + TypeScript + Tailwind + IndexedDB via Dexie.js. Works entirely offline, no server costs, deploy as static site. Excellent for single-user use.

---

## 4. APP SITEMAP / SCREEN LIST

```
App
├── /dashboard                    → Mission Dashboard (home)
│   ├── Today's workout card
│   ├── Week at a glance
│   ├── Streak + stats
│   └── Bodyweight quick log
│
├── /workout                      → Today's Workout (active day)
│   ├── Warmup block (global template)
│   ├── Exercise blocks (main / accessory / conditioning / core)
│   │   └── Exercise card
│   │       ├── Set table (weight | reps | ✓)
│   │       ├── Notes field
│   │       ├── Progression tip (by week)
│   │       └── Exercise info drawer
│   └── Mark Complete button
│
├── /programs                     → Program Selection
│   ├── 5-Day program overview
│   ├── 6-Day program overview
│   └── Week grid (current / historical)
│
├── /library                      → Exercise Library
│   ├── Search + filter by category
│   └── Exercise detail page
│       ├── Instructions
│       ├── Muscles targeted
│       └── Programming context (which days)
│
├── /progress                     → Progress Tracker
│   ├── Bodyweight chart
│   ├── PR board (heaviest logged per exercise)
│   ├── Weekly consistency calendar
│   └── Volume tracker (tonnage per week)
│
├── /history                      → Mission Log
│   ├── Week-by-week log list
│   └── Past workout detail
│
└── /settings                     → Settings
    ├── Unit preference (lbs / kg)
    ├── Program switch
    ├── Week start day
    └── Export data (JSON/CSV)
```

---

## 5. DATABASE SCHEMA

```sql
-- Users (if multi-user)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unit_preference TEXT DEFAULT 'lbs', -- 'lbs' | 'kg'
  active_program TEXT DEFAULT '5day'  -- '5day' | '6day'
);

-- Programs (seeded, not user-created in MVP)
CREATE TABLE programs (
  id TEXT PRIMARY KEY,              -- '5day' | '6day'
  name TEXT NOT NULL,
  description TEXT,
  total_days INT NOT NULL
);

-- Program Days (seeded)
CREATE TABLE program_days (
  id TEXT PRIMARY KEY,              -- '5day-d1', '6day-d3', etc.
  program_id TEXT REFERENCES programs(id),
  day_number INT NOT NULL,          -- 1–6
  name TEXT NOT NULL,               -- 'Bruce Wayne Strength I'
  character TEXT NOT NULL,          -- 'bruce' | 'nightwing' | 'batman_beyond' | 'jason'
  theme TEXT NOT NULL,              -- 'Strength' | 'Movement' | 'Conditioning' | 'Power' | 'Recovery'
  has_warmup BOOLEAN DEFAULT TRUE
);

-- Exercise Blocks (seeded)
CREATE TABLE exercise_blocks (
  id SERIAL PRIMARY KEY,
  day_id TEXT REFERENCES program_days(id),
  block_order INT NOT NULL,
  name TEXT NOT NULL,               -- 'Main Lifts', 'Secondary Work', etc.
  block_type TEXT NOT NULL          -- 'main' | 'accessory' | 'conditioning' | 'core' | 'mobility' | 'power' | 'durability'
);

-- Exercises (seeded)
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,              -- 'back-squat', 'deadlift', etc.
  name TEXT NOT NULL,
  category TEXT NOT NULL,           -- 'strength' | 'conditioning' | 'power' | 'core' | 'mobility' | 'warmup' | 'durability' | 'movement'
  primary_muscles TEXT[],
  instructions TEXT,
  substitutions TEXT[]              -- alternative exercise IDs
);

-- Block Exercises (many-to-many with order and prescription)
CREATE TABLE block_exercises (
  id SERIAL PRIMARY KEY,
  block_id INT REFERENCES exercise_blocks(id),
  exercise_id TEXT REFERENCES exercises(id),
  exercise_order INT NOT NULL,
  prescribed_sets INT,              -- nullable (for circuit work)
  prescribed_reps TEXT,             -- '5', '8 each', '30–45 sec', etc.
  rest_seconds TEXT,                -- '180', '90', 'Walk back', nullable
  coach_notes TEXT
);

-- Workout Logs (user-generated)
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  program_id TEXT REFERENCES programs(id),
  day_id TEXT REFERENCES program_days(id),
  week_number INT NOT NULL,
  log_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  session_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set Logs (individual set data)
CREATE TABLE set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
  block_exercise_id INT REFERENCES block_exercises(id),
  set_number INT NOT NULL,          -- 1, 2, 3, 4, 5
  weight DECIMAL(6,2),              -- in user's preferred units
  reps INT,
  duration_seconds INT,             -- for timed exercises
  distance_meters DECIMAL(7,2),     -- for carries, sprints
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bodyweight Log
CREATE TABLE bodyweight_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  log_date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,     -- in user's preferred units
  notes TEXT,
  UNIQUE(user_id, log_date)
);

-- Personal Records (auto-computed or manually tracked)
CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  exercise_id TEXT REFERENCES exercises(id),
  pr_type TEXT NOT NULL,            -- 'weight' | '1rm_estimated' | 'reps' | 'time' | 'distance'
  value DECIMAL(8,2) NOT NULL,
  achieved_date DATE NOT NULL,
  set_log_id UUID REFERENCES set_logs(id),
  UNIQUE(user_id, exercise_id, pr_type)
);

-- Progression Log (weekly progression notes)
CREATE TABLE progression_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  program_id TEXT,
  week_number INT NOT NULL,
  fatigue_rating INT CHECK (fatigue_rating BETWEEN 1 AND 10),
  performance_notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript / Zod Schema (frontend)

```typescript
// types/workout.ts

export type Character = 'bruce' | 'nightwing' | 'batman_beyond' | 'jason';
export type Theme = 'Strength' | 'Movement' | 'Conditioning' | 'Power' | 'Recovery';
export type BlockType = 'main' | 'accessory' | 'conditioning' | 'core' | 'mobility' | 'power' | 'durability' | 'warmup';
export type ExCategory = 'strength' | 'conditioning' | 'power' | 'core' | 'mobility' | 'warmup' | 'durability' | 'movement';

export interface Exercise {
  id: string;
  name: string;
  category: ExCategory;
  muscles: string[];
  instructions: string;
  substitutions?: string[];
}

export interface BlockExercise {
  exId: string;
  sets: number | string | null;
  reps: string;
  rest: string | null;
  notes: string;
}

export interface ExerciseBlock {
  name: string;
  type: BlockType;
  exercises: BlockExercise[];
}

export interface ProgramDay {
  id: string;
  dayNum: number;
  name: string;
  character: Character;
  theme: Theme;
  label: string;
  warmup: boolean;
  blocks: ExerciseBlock[];
}

export interface Program {
  id: string;
  name: string;
  shortName: string;
  description: string;
  days: ProgramDay[];
}

export interface SetLog {
  reps: string;
  weight: string;
  done: boolean;
  durationSec?: number;
  distanceM?: number;
}

export interface ExerciseLog {
  sets: SetLog[];
  notes: string;
  completed: boolean;
}

export type DayLog = {
  [exKey: string]: ExerciseLog;
  __completed?: boolean;
  __date?: string;
};

export type WeekLog = {
  [dayId: string]: DayLog;
};

export type AllLogs = {
  [weekKey: string]: WeekLog;
};

export interface BodyweightEntry {
  date: string;    // ISO date string
  weight: number;
}

export interface AppState {
  selectedProgram: string;
  currentWeek: number;
  view: string;
  activeDay: string | null;
  logs: AllLogs;
  bwLog: BodyweightEntry[];
  unitPref: 'lbs' | 'kg';
}
```

---

## 6. COMPONENT ARCHITECTURE

```
src/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root layout (fonts, theme, nav)
│   ├── page.tsx                    # Redirects to /dashboard
│   ├── dashboard/page.tsx
│   ├── workout/page.tsx
│   ├── workout/[dayId]/page.tsx
│   ├── programs/page.tsx
│   ├── library/page.tsx
│   ├── library/[exId]/page.tsx
│   ├── progress/page.tsx
│   ├── history/page.tsx
│   └── settings/page.tsx
│
├── components/
│   ├── layout/
│   │   ├── NavBar.tsx              # Bottom nav (mobile) / Sidebar (desktop)
│   │   ├── TopBar.tsx              # Week selector, program label
│   │   └── PageContainer.tsx
│   │
│   ├── dashboard/
│   │   ├── TodayCard.tsx           # Today's workout preview card
│   │   ├── WeekGrid.tsx            # 5 or 6 day week overview
│   │   ├── StatsRow.tsx            # Streak, volume, bodyweight
│   │   └── BodyweightWidget.tsx    # Quick BW log
│   │
│   ├── workout/
│   │   ├── WorkoutHeader.tsx       # Day name, character badge, theme
│   │   ├── WarmupBlock.tsx         # Global warmup accordion
│   │   ├── ExerciseBlock.tsx       # Block container (Main Lifts, etc.)
│   │   ├── ExerciseCard.tsx        # Individual exercise with set table
│   │   ├── SetTable.tsx            # weight | reps | ✓ table
│   │   ├── SetRow.tsx              # Individual set row with inputs
│   │   ├── ExerciseInfoDrawer.tsx  # Expandable instructions
│   │   ├── ProgressionTip.tsx      # Week-based progression hint
│   │   ├── NotesField.tsx
│   │   └── CompleteButton.tsx
│   │
│   ├── library/
│   │   ├── LibrarySearch.tsx
│   │   ├── ExerciseListItem.tsx
│   │   └── ExerciseDetail.tsx
│   │
│   ├── progress/
│   │   ├── BodyweightChart.tsx     # Recharts line chart
│   │   ├── PRBoard.tsx             # Personal records table
│   │   ├── ConsistencyCalendar.tsx # GitHub-style heatmap
│   │   └── VolumeChart.tsx
│   │
│   └── ui/                         # Design system primitives
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── ProgressBar.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Checkbox.tsx
│       ├── Accordion.tsx
│       └── Divider.tsx
│
├── data/
│   ├── programs.ts                 # Full program data (seeded)
│   ├── exercises.ts                # Exercise library
│   └── warmup.ts                   # Global warmup template
│
├── store/
│   ├── workoutStore.ts             # Zustand store
│   └── settingsStore.ts
│
├── hooks/
│   ├── useWorkoutLog.ts            # CRUD for set logs
│   ├── useProgression.ts           # Week progression logic
│   ├── usePRTracking.ts            # Auto-detect PRs
│   └── useStreak.ts                # Consistency streak calc
│
├── lib/
│   ├── supabase.ts                 # Client + server Supabase instances
│   ├── db/
│   │   ├── logs.ts                 # DB queries for logs
│   │   ├── programs.ts
│   │   └── users.ts
│   └── utils.ts
│
└── styles/
    ├── globals.css                 # CSS variables, base reset
    └── theme.ts                    # JS theme constants
```

---

## 7. API ROUTES / BACKEND STRUCTURE

```typescript
// app/api/

// GET  /api/programs               → List all programs
// GET  /api/programs/[id]          → Program detail with all days/exercises

// GET  /api/exercises               → Full exercise library
// GET  /api/exercises/[id]          → Exercise detail

// GET  /api/logs?week=N&program=X  → All logs for a given week
// POST /api/logs                    → Create/update workout log
// PATCH /api/logs/[id]/complete     → Mark day complete
// DELETE /api/logs/[id]             → Delete a log

// GET  /api/logs/sets?logId=X      → Get all sets for a workout log
// POST /api/logs/sets               → Upsert set data
// {
//   workoutLogId: string,
//   blockExerciseId: number,
//   setNumber: number,
//   weight?: number,
//   reps?: number,
//   completed: boolean
// }

// GET  /api/bodyweight              → Bodyweight history for user
// POST /api/bodyweight              → Log bodyweight entry
// { weight: number, date: string, notes?: string }

// GET  /api/prs                     → Personal records for user
// GET  /api/prs/[exerciseId]        → PRs for specific exercise

// GET  /api/stats/streak            → Current streak and history
// GET  /api/stats/volume?weeks=4    → Weekly volume data
// GET  /api/stats/consistency       → Calendar heatmap data

// GET  /api/export                  → Export all data as JSON
```

---

## 8. UX/UI DESIGN DIRECTION

### Visual Identity

**Color System:**
```css
--bg:           #07070a   /* near black — primary background */
--surface:      #0e0e12   /* card backgrounds */
--surface-2:    #14141a   /* nested cards, inputs */
--surface-3:    #1c1c24   /* hover states, active rows */
--border:       #22222c   /* subtle borders */
--border-2:     #2e2e3a   /* visible borders */
--accent:       #4d8eff   /* primary blue — Nightwing / interactive */
--text:         #dcdce8   /* primary text */
--text-dim:     #7c7c90   /* secondary text, labels */
--text-muted:   #4a4a5a   /* disabled, placeholder */
--success:      #2ecc8a   /* completion, streaks */
--warning:      #e8a838   /* deload week, caution */
--danger:       #e84848   /* failure, overreaching */

/* Character accent colors */
--bruce:        #c8963c   /* gold — strength, discipline */
--nightwing:    #4d8eff   /* blue — athleticism, movement */
--beyond:       #9b4dff   /* purple — conditioning, speed */
--jason:        #e84848   /* red — power, aggression */
```

**Typography:**
- Display / Labels: `Barlow Condensed` — condensed, bold, tactical. Headers, badge labels, day names
- Body / Data: `DM Sans` — clean, modern, readable. Instructions, descriptions
- Numbers / Data: `JetBrains Mono` — precision, code aesthetic. Weights, reps, stats

**Layout Principles:**
- Mobile-first with bottom navigation (5 tabs)
- Desktop: persistent left sidebar, content fills right
- Cards have 1px borders, no drop shadows (feels cleaner at dark values)
- 8px grid system throughout
- Generous white space around content — not cramped
- Status indicators use colored left-border strips on cards

**Component Patterns:**
- Exercise cards collapse/expand — collapsed shows name + sets×reps, expanded shows full set table
- Set rows: compact table format — `Set # | Weight [input] | Reps [input] | [✓]`
- Character theme badges use the character's accent color with a subtle bg tint
- Block headers use monospaced uppercase tracking labels
- Completion state fills card left border with success color

---

## 9. DETAILED BUILD PLAN

### Phase 0: Setup (Day 1)
```bash
npx create-next-app@latest bat-workout --typescript --tailwind --app
cd bat-workout
npm install zustand @supabase/supabase-js prisma @prisma/client
npm install recharts date-fns clsx tailwind-merge
npx supabase init
npx prisma init
```

### Phase 1: Data Layer (Days 1–2)
1. Define TypeScript types in `/types/workout.ts`
2. Seed all program data in `/data/programs.ts`
3. Seed exercise library in `/data/exercises.ts`
4. Set up Zustand store with full app state
5. Implement local persistence (localStorage for MVP, Supabase for Phase 2)

### Phase 2: Core UI (Days 3–5)
1. Build CSS variable system and Tailwind config
2. Implement NavBar (bottom mobile, sidebar desktop)
3. Build Dashboard view with `TodayCard`, `WeekGrid`, `StatsRow`
4. Build WorkoutDay view with exercise blocks and set tracking
5. Build `SetTable` component with controlled inputs

### Phase 3: Workout Logging (Days 5–7)
1. Implement set CRUD in Zustand store
2. Connect set inputs to store
3. Implement day completion flow
4. Add notes fields per exercise
5. Add progression tips per week

### Phase 4: Library + Progress (Days 7–9)
1. Build exercise library with search
2. Build exercise detail pages
3. Build bodyweight chart (Recharts)
4. Build PR board
5. Build consistency calendar

### Phase 5: Polish + Deploy (Days 9–10)
1. Responsive audit (320px to 1440px)
2. Keyboard navigation / accessibility pass
3. Loading states
4. Empty states
5. Deploy to Vercel

---

## 10. PROGRESSION LOGIC (IMPLEMENTATION)

```typescript
// hooks/useProgression.ts

export function getProgressionPhase(weekNumber: number): {
  phase: string;
  instruction: string;
  loadMultiplier: number;
} {
  const cycle = ((weekNumber - 1) % 5) + 1; // 5-week cycle
  
  const phases = {
    1: { phase: 'Establish', instruction: 'Week 1: Establish your working weight. Leave 1–2 reps in reserve.', loadMultiplier: 1.0 },
    2: { phase: 'Build', instruction: 'Week 2: Add 5 lbs upper body, 10 lbs lower body if Week 1 was solid.', loadMultiplier: 1.03 },
    3: { phase: 'Build', instruction: 'Week 3: Add another small increment. Execution quality first.', loadMultiplier: 1.06 },
    4: { phase: 'Peak', instruction: 'Week 4: Match or exceed Week 3. If form breaks, hold the weight.', loadMultiplier: 1.08 },
    5: { phase: 'Deload', instruction: 'Week 5: Deload. 85–90% of Week 4 volume/load. Full recovery.', loadMultiplier: 0.87 },
  };
  
  return phases[cycle as keyof typeof phases];
}

export function getConditioningProgression(weekNumber: number): string {
  const cycle = ((weekNumber - 1) % 4) + 1;
  const tips = {
    1: 'Focus on crispness and speed quality.',
    2: 'Reduce rest by 10–15 seconds. Maintain output.',
    3: 'Add one additional round or rep.',
    4: 'Increase work density — faster transitions.',
  };
  return tips[cycle as keyof typeof tips];
}
```

---

## 11. EXAMPLE SEED DATA (JSON)

```json
{
  "programs": [
    {
      "id": "5day",
      "name": "5-Day Bat-Family Hybrid",
      "shortName": "5-Day",
      "description": "Five training days. Two full rest days. Strength, movement, conditioning, and power in weekly sequence.",
      "totalDays": 5
    },
    {
      "id": "6day",
      "name": "6-Day Bat-Family Hybrid",
      "shortName": "6-Day",
      "description": "Six training days. One full rest day. Higher volume for advanced athletes.",
      "totalDays": 6
    }
  ],
  "exercises": [
    {
      "id": "back-squat",
      "name": "Back Squat",
      "category": "strength",
      "muscles": ["Quads", "Glutes", "Hamstrings", "Core"],
      "instructions": "Bar on upper traps, feet shoulder-width, toes slightly out. Brace core, drive knees out, squat to parallel or below. Drive through heels to stand.",
      "substitutions": ["front-squat", "goblet-squat", "box-squat"]
    },
    {
      "id": "deadlift",
      "name": "Deadlift",
      "category": "strength",
      "muscles": ["Hamstrings", "Glutes", "Back", "Core", "Grip"],
      "instructions": "Bar over mid-foot. Hinge down, big breath, brace. Leg press the floor away. Bar stays in contact with legs. Lock out hips and knees simultaneously.",
      "substitutions": ["trap-bar-deadlift", "romanian-deadlift", "sumo-deadlift"]
    }
  ],
  "sample_week_log": {
    "w1": {
      "5day-d1": {
        "0-0": {
          "sets": [
            { "reps": "5", "weight": "185", "done": true },
            { "reps": "5", "weight": "185", "done": true },
            { "reps": "5", "weight": "185", "done": true },
            { "reps": "4", "weight": "185", "done": true },
            { "reps": "4", "weight": "185", "done": true }
          ],
          "notes": "Felt solid, could have gone 195. Next week 190.",
          "completed": true
        },
        "__completed": true,
        "__date": "2024-01-08"
      }
    }
  }
}
```

---

## 12. FUTURE UPGRADES

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| PR auto-detection | High | Low | Compare each logged set vs. history |
| Export to CSV/PDF | High | Medium | Mission log export |
| 1RM calculator | Medium | Low | Epley/Brzycki formulas |
| Exercise video demos | Medium | High | Need CDN + video pipeline |
| Streak notifications | Medium | Medium | PWA + service workers |
| Custom program builder | Low | Very High | Full drag-drop schedule builder |
| Coach dashboard | Low | High | Multi-user read access |
| Apple Health sync | Low | High | HealthKit + React Native |
| AI progression coach | Low | Very High | OpenAI fine-tuned on training data |
| Barcode scanner for food | Not in scope | — | Not a nutrition app |

---

## 13. DEPLOYMENT STEPS

### Option A: Vercel (Recommended)
```bash
# 1. Push to GitHub
git init && git add . && git commit -m "initial commit"
gh repo create bat-workout --public --push

# 2. Connect Vercel
# Go to vercel.com → Import Project → Select repo → Deploy
# Zero config for Next.js

# 3. Environment Variables (add in Vercel dashboard)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_postgres_url

# 4. Run Supabase migrations
npx supabase db push

# 5. Seed data
npx ts-node scripts/seed.ts
```

### Option B: Static / Local-First (No Backend)
```bash
# Build as static export (no Supabase needed for single user)
# All data in localStorage/IndexedDB

npm run build
# Outputs to /out directory
# Upload to: Netlify drag-drop, GitHub Pages, or any CDN
```

### Option C: Docker (Self-Hosted)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
```bash
docker build -t bat-workout .
docker run -p 3000:3000 --env-file .env bat-workout
```

---

## PROGRESSION REFERENCE CARD

```
STRENGTH CYCLE (5-week)
Week 1 → Establish working weight
Week 2 → +5 lbs upper / +10 lbs lower
Week 3 → +5 lbs upper / +10 lbs lower  
Week 4 → +5 lbs or match W3 cleanly
Week 5 → DELOAD: 85-90% of W4 volume
         Then restart heavier than W1

SPRINT / JUMP PROGRESSION
Phase 1 → Quality and crispness
Phase 2 → Add 1 set or rep
Phase 3 → Increase difficulty

CONDITIONING PROGRESSION  
Phase 1 → Reduce rest 10-15 seconds
Phase 2 → Add 1 round
Phase 3 → Increase work density
```

---

*Built for the mission. Adapt or be left behind.*
