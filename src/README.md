# GymAI

Bilingual (EN / ES) AI-assisted workout generator. Mobile-first, dark theme, no account required.

> **This is not a medical app.** GymAI shows generic, conservative fitness suggestions for informational purposes only. Always consult a qualified healthcare professional before starting any exercise program.

---

## Features

- 💬 **Hybrid chat** — type freely or use a guided form (goal, muscle group, equipment, time, level, condition)
- 🧠 **Rule-based generator** — deterministic; only returns exercises that exist in the dataset and have GIFs
- 🛡️ **Safety system** — detects keywords like *pregnancy, knee pain, back pain, shoulder injury, general pain* and filters/adjusts the routine, plus shows an inline warning
- ⚖️ **Disclaimer** — first-run modal that must be acknowledged; revisit any time from the top bar
- 🖼️ **Exercise cards** — name (EN/ES), GIF, sets/reps/rest, instructions, in-card rest timer, set logger
- 💾 **Save / restore** — Supabase if signed in, otherwise localStorage; JSON export/import any time
- 📄 **PDF export** — `jsPDF` build with date, request, condition warning, exercises, and disclaimer
- 📈 **Progress** — body weight tracking with sparkline + recent set logs
- 🌐 **Bilingual** — every string is translated; toggle in the top bar; remembered locally
- 📱 **Mobile-first** — iPhone-style layout with safe-area padding, floating chat input, bottom nav

---

## Tech stack

- React 18 + Vite
- Tailwind CSS (dark, black + neon-green accents)
- React Router (HashRouter — works on GitHub Pages out of the box)
- `@supabase/supabase-js` (optional auth + DB)
- `jspdf` (PDF export)
- LocalStorage fallback when Supabase isn't configured

---

## Quick start

```bash
# 1) install
npm install

# 2) run dev server
npm run dev
```

The app runs **fully offline-capable** with no Supabase config — sign-in is just hidden, and all data goes to `localStorage`.

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
# Only needed when deploying under a sub-path (GitHub Pages)
# VITE_BASE_PATH=/gymai/
```

> Only the **anon (public)** key goes in the frontend. Never put a `service_role` key in a Vite bundle — it's shipped to every visitor.

---

## Supabase setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) → Run.
3. Under **Authentication → Providers** enable **Email** (the default).
4. Copy your project's URL and anon key into `.env.local`.

The schema creates 5 tables — `profiles`, `workout_requests`, `saved_routines`, `workout_logs`, `body_metrics` — all locked down with **Row Level Security** so users only ever see their own data.

---

## Deploy to GitHub Pages

1. Push the repo to GitHub (e.g. `username/gymai`).
2. Build with the correct base path:

   ```bash
   VITE_BASE_PATH=/gymai/ npm run build
   ```

3. Push the `dist/` folder to the `gh-pages` branch:

   ```bash
   VITE_BASE_PATH=/gymai/ npm run deploy
   ```

4. In your repo's **Settings → Pages**, set the source to the `gh-pages` branch (root).

The app uses **HashRouter** (URLs look like `/#/saved`), so deep-links work without server-side rewrites. The included `public/404.html` is a defensive fallback for any non-hash links.

> **Tip — secrets:** If you want Supabase to work on the deployed site, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to a GitHub Actions workflow that builds and deploys for you. Storing them in a local `.env.local` only affects your dev build.

---

## Project structure

```
gymai/
├── public/
│   └── 404.html              GitHub Pages SPA fallback
├── supabase/
│   └── schema.sql            DB schema with RLS
└── src/
    ├── components/           ChatInput, ChatMessage, ExerciseCard,
    │                         GuidedInputs, WarningBanner,
    │                         DisclaimerModal, RestTimer, Layout,
    │                         LanguageToggle
    ├── pages/                ChatPage, SavedPage, ProgressPage, AccountPage
    ├── hooks/                useLanguage, useAuth, useDisclaimer, useLocalStorage
    ├── utils/                workoutGenerator, pdfExport
    ├── services/             supabase, exerciseService, storageService
    ├── data/                 exercises (24 fallback), translations, conditions
    └── styles/               globals.css
```

---

## How the safety system works

1. The user's free-text request and the optional "physical condition" field are scanned by `detectConditions()` in `src/data/conditions.js`.
2. Each detected condition contributes:
   - **avoid tags** — exercise tags that are filtered out entirely (e.g. `pregnancy` → no `supine`, `prone`, `high_impact`, `heavy_compound`, `crunch`, `twist`, `breath_hold`).
   - **intensity modifier** — multiplied into the rep range (lower bound floored at 4 reps).
3. The generator (`src/utils/workoutGenerator.js`) only ever picks from exercises that
   - have a GIF in the dataset,
   - match the requested muscle / equipment / level (with sensible fallbacks), and
   - do **not** carry any avoid tag for the detected conditions.
4. If conditions were detected, the UI shows a yellow `WarningBanner` above the routine and the PDF export embeds the same warning + the global disclaimer.

The system is intentionally conservative: when in doubt, the exercise is removed, not flagged.

---

## Hard constraints (already enforced)

- ❌ No exercise without a GIF — `SAFE_EXERCISES` filters by `!!gif`
- ❌ No GIFs from random URLs — only the curated dataset
- ❌ No "safe" claims in the UI — every warning links to "consult a professional"
- ❌ No API keys in the bundle — Supabase URL/anon key are public by design; nothing else is shipped
- ✅ App works fully without an account
- ✅ All AI is rule-based — no calls to LLMs from the client

---

## License

MIT — do whatever, just keep the disclaimer.
