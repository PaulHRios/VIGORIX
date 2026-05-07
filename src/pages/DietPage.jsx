// src/pages/DietPage.jsx
//
// Weekly diet generator. Reads the profile + latest body weight, computes a
// kcal target and macro split, then drafts a 7-day plan. The user can:
//   - regenerate the entire plan,
//   - regenerate a single day,
//   - regenerate a single meal,
//   - filter by dietary tag (vegetarian / vegan / no-cook),
//   - read protein and creatine guidance.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.jsx';
import {
  getProfile,
  isOnboarded,
  computeBmi,
  computeCalorieTarget,
  toKg,
} from '../services/userProfile.js';
import { listBodyMetrics } from '../services/storageService.js';
import {
  generateDietPlan,
  regenerateDay,
  regenerateMeal,
  supplementGuidance,
} from '../utils/dietGenerator.js';
import { saveRoutine } from '../services/storageService.js';

const DAY_LABELS = {
  en: { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' },
  es: { mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo' },
};

const SLOT_LABELS = {
  en: { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' },
  es: { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snack' },
};

function inferSlotForIndex(meals, i) {
  const m = meals[i];
  // foods.js groups by slot — a heuristic from id is unreliable. We instead
  // walk the patterns: meals[0] always breakfast, meals[last] dinner, and any
  // "snack" foods are snacks. Easier: just label by position.
  if (i === 0) return 'breakfast';
  if (i === meals.length - 1) return 'dinner';
  // middle slots: lunch sits roughly in the center, others are snacks
  const center = Math.floor(meals.length / 2);
  if (i === center) return 'lunch';
  return 'snack';
}

export function DietPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => getProfile());
  const [weightKg, setWeightKg] = useState(null);
  const [plan, setPlan] = useState(null);
  const [dietaryTag, setDietaryTag] = useState(null);
  const [mealPrep, setMealPrep] = useState(false);
  const [customKcal, setCustomKcal] = useState(null); // null = use suggested
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [openDay, setOpenDay] = useState(0);

  useEffect(() => {
    if (!isOnboarded()) {
      navigate('/onboarding', { replace: true });
      return;
    }
    setProfile(getProfile());
    listBodyMetrics(1).then((rows) => {
      const latest = rows?.[0];
      if (latest) setWeightKg(toKg(latest.weight, latest.unit || 'kg'));
    });
  }, [navigate]);

  const supplements = useMemo(
    () => supplementGuidance({ weightKg: weightKg || estimatedWeight(profile), goal: profile.goal, lang }),
    [weightKg, profile, lang],
  );

  function estimatedWeight(p) {
    // Fallback: rough estimate from height/sex (BMI ~22.5)
    if (!p?.height) return 70;
    const m = p.height / 100;
    return Math.round(22.5 * m * m);
  }

  // Suggested kcal for the current profile (drives the kcal slider).
  const suggestedKcal = useMemo(() => {
    const w = weightKg || estimatedWeight(profile);
    const t = computeCalorieTarget({
      weightKg: w,
      heightCm: profile.height,
      age: profile.age,
      sex: profile.sex,
      goal: profile.goal,
      level: profile.level,
    });
    return t?.kcal || 2000;
  }, [profile, weightKg]);

  const effectiveKcal = customKcal ?? suggestedKcal;
  const kcalIsLow = effectiveKcal < (profile.sex === 'female' ? 1500 : 1700);

  function handleGenerate() {
    setBusy(true);
    setTimeout(() => {
      const w = weightKg || estimatedWeight(profile);
      const next = generateDietPlan(profile, {
        weightKg: w,
        dietaryTag,
        mealPrep,
        customKcal: customKcal ?? undefined,
      });
      setPlan(next);
      setBusy(false);
      setOpenDay(0);
    }, 600);
  }

  function handleRegenAll() {
    handleGenerate();
  }

  function handleRegenDay(dayIdx) {
    if (!plan) return;
    setPlan(regenerateDay(plan, dayIdx));
  }

  function handleRegenMeal(dayIdx, mealIdx) {
    if (!plan) return;
    setPlan(regenerateMeal(plan, dayIdx, mealIdx));
  }

  async function handleSavePlan() {
    if (!plan) return;
    try {
      const name = `${t.diet.savedPrefix} · ${new Date().toLocaleDateString()}`;
      await saveRoutine(name, plan);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (e) {
      console.error(e);
    }
  }

  // ---------- NO PLAN YET ----------
  if (!plan && !busy) {
    const w = weightKg || estimatedWeight(profile);
    return (
      <div className="space-y-4 px-4 pb-6 pt-4">
        <header>
          <h1 className="heading-display text-2xl">{t.diet.title}</h1>
          <p className="text-sm text-neutral-400">{t.diet.sub}</p>
        </header>

        <div className="card p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label={t.diet.goal} value={t.onboarding.goals[profile.goal] || profile.goal} small />
            <Stat label={t.diet.weight} value={`${Math.round(w)} kg`} small />
            <Stat label={t.diet.height} value={`${profile.height} cm`} small />
          </div>
          {!weightKg && (
            <p className="mt-3 rounded-2xl border border-warn-amber/30 bg-warn-amber/10 p-2.5 text-[11px] text-warn-amber">
              {t.diet.weightFromEstimate}
            </p>
          )}
        </div>

        <div className="card p-4">
          <div className="font-display text-xs uppercase tracking-wider text-neutral-400">
            {t.diet.dietaryQ}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[null, 'vegetarian', 'vegan', 'no_cook'].map((tag) => (
              <button
                key={tag || 'any'}
                onClick={() => setDietaryTag(tag)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  dietaryTag === tag
                    ? 'border-neon-500 bg-neon-500/10 text-neon-200'
                    : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.06]'
                }`}
              >
                {t.diet.dietaryTags[tag || 'any']}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="font-display text-xs uppercase tracking-wider text-neutral-400">
            {t.diet.mealPrepQ}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">{t.diet.mealPrepHint}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setMealPrep(false)}
              className={`rounded-2xl border px-3 py-2.5 text-sm transition-colors ${
                !mealPrep
                  ? 'border-neon-500 bg-neon-500/10 text-neon-200'
                  : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.06]'
              }`}
            >
              {t.diet.mealPrepOptions.rotate}
            </button>
            <button
              onClick={() => setMealPrep(true)}
              className={`rounded-2xl border px-3 py-2.5 text-sm transition-colors ${
                mealPrep
                  ? 'border-neon-500 bg-neon-500/10 text-neon-200'
                  : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.06]'
              }`}
            >
              {t.diet.mealPrepOptions.prep}
            </button>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-baseline justify-between">
            <div className="font-display text-xs uppercase tracking-wider text-neutral-400">
              {t.diet.kcalQ}
            </div>
            <div className="font-mono text-[11px] text-neutral-500">
              {t.diet.kcalSuggested}: <span className="text-neon-300">{suggestedKcal}</span>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">{t.diet.kcalHint}</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min="1000"
              max="5000"
              step="50"
              value={effectiveKcal}
              onChange={(e) => {
                const n = Number(e.target.value);
                setCustomKcal(Number.isFinite(n) && n > 0 ? Math.round(n) : null);
              }}
              className="input flex-1 text-center font-display text-xl"
            />
            <span className="font-mono text-xs text-neutral-500">kcal</span>
          </div>
          <input
            type="range"
            min="1200"
            max="4000"
            step="50"
            value={effectiveKcal}
            onChange={(e) => setCustomKcal(Number(e.target.value))}
            className="mt-2 w-full accent-neon-500"
          />
          {customKcal !== null && customKcal !== suggestedKcal && (
            <button
              onClick={() => setCustomKcal(null)}
              className="mt-1 text-[11px] text-neutral-400 hover:text-neon-300"
            >
              ↺ {t.diet.kcalReset}
            </button>
          )}
          {kcalIsLow && (
            <p className="mt-2 rounded-2xl border border-warn-amber/30 bg-warn-amber/10 p-2.5 text-[11px] text-warn-amber">
              ⚠ {t.diet.kcalWarnLow}
            </p>
          )}
          <p className="mt-2 text-[11px] text-neutral-500">{t.diet.proteinFloorNote}</p>
        </div>

        <button onClick={handleGenerate} className="btn-primary w-full">
          {t.diet.generate}
        </button>

        <SupplementsCard guidance={supplements} t={t} lang={lang} />
      </div>
    );
  }

  if (busy) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div className="text-center">
          <div className="mb-2 text-4xl">🥗</div>
          <p className="font-display text-sm uppercase tracking-wider text-neutral-400">
            {t.diet.cooking}
          </p>
        </div>
      </div>
    );
  }

  // ---------- PLAN VIEW ----------
  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <button onClick={() => setPlan(null)} className="text-sm text-neutral-400 hover:text-neutral-200">
        ← {t.common.back}
      </button>

      <header>
        <h1 className="heading-display text-2xl">{t.diet.weekTitle}</h1>
        <p className="text-sm text-neutral-400">
          {t.onboarding.goals[plan.goal]} · {plan.targets.kcal} kcal · {plan.macros.protein} g {t.diet.protein}
        </p>
        {plan.mealPrep && (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-neon-500/30 bg-neon-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neon-300">
            🥡 {t.diet.mealPrepBadge}
          </div>
        )}
      </header>

      <div className="card p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="kcal" value={plan.targets.kcal} small />
          <Stat label="P" value={`${plan.macros.protein}g`} small accent />
          <Stat label="C" value={`${plan.macros.carbs}g`} small />
          <Stat label="F" value={`${plan.macros.fat}g`} small />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center text-[11px] text-neutral-500">
          <div>
            BMR <span className="font-mono text-neon-300">{plan.targets.bmr}</span>
          </div>
          <div>
            TDEE <span className="font-mono text-neon-300">{plan.targets.tdee}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {plan.days.map((day, di) => (
          <details
            key={day.dayKey}
            className="card overflow-hidden"
            open={openDay === di}
            onToggle={(e) => {
              if (e.currentTarget.open) setOpenDay(di);
            }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
              <div>
                <div className="heading-display text-sm">{DAY_LABELS[lang][day.dayKey]}</div>
                <div className="font-mono text-[11px] text-neutral-500">
                  {day.totals.kcal} kcal · {day.totals.protein} g P
                </div>
              </div>
              <span className="text-neon-400">▾</span>
            </summary>

            <div className="space-y-2 border-t border-white/5 px-3 py-3">
              {day.meals.map((meal, mi) => {
                const slot = inferSlotForIndex(day.meals, mi);
                return (
                  <div key={mi} className="rounded-2xl border border-white/5 bg-ink-800/30 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-display text-[10px] uppercase tracking-wider text-neon-400">
                        {SLOT_LABELS[lang][slot]}
                      </div>
                      <button
                        onClick={() => handleRegenMeal(di, mi)}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400 hover:text-neon-300"
                      >
                        ↻ {t.diet.swap}
                      </button>
                    </div>
                    <div className="mt-1 text-sm text-neutral-100">
                      {meal.name[lang] || meal.name.en}
                      {meal.servings !== 1 && (
                        <span className="ml-1 font-mono text-[11px] text-neutral-500">
                          ×{meal.servings}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex gap-3 font-mono text-[11px] text-neutral-500">
                      <span>{meal.kcal} kcal</span>
                      <span className="text-neon-300">{meal.protein}g P</span>
                      <span>{meal.carbs}g C</span>
                      <span>{meal.fat}g F</span>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => handleRegenDay(di)}
                className="btn-ghost w-full py-2 text-xs"
              >
                ↻ {t.diet.regenDay}
              </button>
            </div>
          </details>
        ))}
      </div>

      <div className="card space-y-2 p-4">
        <button onClick={handleSavePlan} className="btn-primary w-full">
          {savedFlash ? `✓ ${t.common.saved}` : t.diet.savePlan}
        </button>
        <button onClick={handleRegenAll} className="btn-ghost w-full">
          ↻ {t.diet.regenAll}
        </button>
      </div>

      <SupplementsCard guidance={supplements} t={t} lang={lang} />

      <div className="rounded-2xl border border-white/5 bg-ink-900/40 p-3 text-[11px] text-neutral-500">
        {t.diet.disclaimer}
      </div>
    </div>
  );
}

function SupplementsCard({ guidance, t, lang }) {
  return (
    <section className="card p-4">
      <h2 className="heading-display text-base">{t.diet.supplements}</h2>
      <p className="mt-1 text-[11px] text-neutral-500">{t.diet.supplementsSub}</p>

      <div className="mt-3 space-y-3">
        <div className="rounded-2xl border border-neon-500/20 bg-neon-500/5 p-3">
          <div className="font-display text-xs uppercase tracking-wider text-neon-300">
            {t.diet.protein} · {guidance.protein.perKg} g/kg
          </div>
          <div className="mt-1 text-sm text-neutral-100">
            {guidance.protein.grams} g {lang === 'es' ? 'al día' : 'per day'}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-400">
            {guidance.protein.note}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-800/40 p-3">
          <div className="font-display text-xs uppercase tracking-wider text-neutral-300">
            {t.diet.creatine}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-400">
            {guidance.creatine.note}
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-neutral-500">
            <li>• {guidance.creatine.load}</li>
            <li>• {guidance.creatine.maintenance}</li>
          </ul>
        </div>

        <p className="text-[11px] leading-relaxed text-neutral-500">
          {guidance.extra[lang]}
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value, small, accent }) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-800/30 p-2">
      <div className={`font-mono ${small ? 'text-base' : 'text-lg'} font-semibold tabular-nums ${accent ? 'text-neon-300' : 'text-neutral-100'}`}>
        {value}
      </div>
      <div className="font-display text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </div>
    </div>
  );
}
