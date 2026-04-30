// src/pages/BuilderPage.jsx
//
// Replaces the old ChatPage. NO free-text input. The user picks:
//   1. Type (single-day or weekly)
//   2. For single: target muscle, exercise count, time
//   3. For weekly: days per week
// Then we generate the routine using the persisted profile + these answers.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { ExerciseCard } from '../components/ExerciseCard.jsx';
import { WarningBanner } from '../components/WarningBanner.jsx';
import { getProfile, isOnboarded } from '../services/userProfile.js';
import { getExercises } from '../services/exerciseService.js';
import {
  generateRoutine,
  generateWeeklyRoutine,
  buildSplit,
  replaceExercise,
} from '../utils/workoutGenerator.js';
import { saveRoutine } from '../services/storageService.js';
import { exportRoutinePdf } from '../utils/pdfExport.js';

const MUSCLE_OPTIONS = [
  'full_body',
  'upper',
  'lower',
  'push',
  'pull',
  'legs',
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'core',
];

const COUNT_OPTIONS = [4, 5, 6, 7, 8, 10];
const TIME_OPTIONS = [20, 30, 45, 60, 90];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];

export function BuilderPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => getProfile());
  const [pool, setPool] = useState([]);
  const [poolReady, setPoolReady] = useState(false);

  // Wizard state
  const [type, setType] = useState(null); // 'single' | 'weekly'
  const [muscle, setMuscle] = useState('full_body');
  const [count, setCount] = useState(6);
  const [time, setTime] = useState(45);
  const [daysPerWeek, setDaysPerWeek] = useState(3);

  // Generation result
  const [busy, setBusy] = useState(false);
  const [routine, setRoutine] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // If the user is not onboarded, redirect to onboarding.
  useEffect(() => {
    if (!isOnboarded()) {
      navigate('/onboarding', { replace: true });
    }
  }, [navigate]);

  // Load exercises in the background.
  useEffect(() => {
    let alive = true;
    getExercises().then((data) => {
      if (!alive) return;
      setPool(data);
      setPoolReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Allow Layout to reset state by dispatching an event when the logo is tapped.
  useEffect(() => {
    function reset() {
      setType(null);
      setRoutine(null);
      setWeekly(null);
    }
    window.addEventListener('vigorix:reset-builder', reset);
    return () => window.removeEventListener('vigorix:reset-builder', reset);
  }, []);

  const split = useMemo(() => {
    if (!profile.level || !profile.goal) return [];
    return buildSplit(daysPerWeek, profile.level, profile.goal);
  }, [daysPerWeek, profile.level, profile.goal]);

  async function handleGenerateSingle() {
    setBusy(true);
    setRoutine(null);
    await new Promise((r) => setTimeout(r, 1100)); // loading screen window
    const result = generateRoutine(
      {
        goal: profile.goal,
        level: profile.level,
        equipment: profile.equipment,
        muscle,
        exerciseCount: count,
        time,
        sex: profile.sex,
        age: profile.age,
      },
      pool,
      profile.conditionKeys || [],
    );
    setRoutine(result);
    setBusy(false);
  }

  async function handleGenerateWeekly() {
    setBusy(true);
    setWeekly(null);
    await new Promise((r) => setTimeout(r, 1300));
    const result = generateWeeklyRoutine(
      {
        goal: profile.goal,
        level: profile.level,
        equipment: profile.equipment,
        daysPerWeek,
        exerciseCount: 6,
        sex: profile.sex,
        age: profile.age,
      },
      pool,
      profile.conditionKeys || [],
    );
    setWeekly(result);
    setBusy(false);
  }

  function handleReplace(index) {
    if (!routine) return;
    const next = replaceExercise(routine, index, pool, profile.conditionKeys || []);
    if (next) setRoutine(next);
  }

  function handleReplaceWeekly(dayIndex, exerciseIndex) {
    if (!weekly) return;
    const day = weekly.days[dayIndex];
    if (!day || !day.routine) return;
    const updated = replaceExercise(
      day.routine,
      exerciseIndex,
      pool,
      profile.conditionKeys || [],
    );
    if (!updated) return;
    setWeekly((prev) => ({
      ...prev,
      days: prev.days.map((d, i) => (i === dayIndex ? { ...d, routine: updated } : d)),
    }));
  }

  async function handleSaveSingle() {
    if (!routine) return;
    const name = `${t.saved.defaultName} · ${new Date().toLocaleDateString()}`;
    try {
      await saveRoutine(name, routine);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveWeekly() {
    if (!weekly) return;
    const name = `${t.saved.weeklyName} · ${new Date().toLocaleDateString()}`;
    try {
      await saveRoutine(name, weekly);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (e) {
      console.error(e);
    }
  }

  function handleExportSingle() {
    if (!routine) return;
    exportRoutinePdf(routine, lang, t.saved.defaultName);
  }

  // ---------- LOADING ----------
  if (busy) return <LoadingScreen />;

  // ---------- RESULT: SINGLE ----------
  if (routine && !routine.empty) {
    const totalMin = Math.round(
      routine.exercises.reduce((s, e) => s + (e.sets || 3) * (45 + (e.rest || 60) / 2), 0) / 60,
    );
    return (
      <div className="space-y-3 px-4 pb-4 pt-4">
        <BackBar onBack={() => setRoutine(null)} />

        <WarningBanner conditionKeys={routine.conditionKeys} />

        <div className="flex items-center justify-between px-1">
          <h2 className="heading-display text-sm uppercase tracking-[0.2em] text-neutral-400">
            {t.builder.singleTitle}
          </h2>
          <span className="font-mono text-xs text-neutral-500">
            {routine.exercises.length} · {totalMin}m
          </span>
        </div>

        {routine.exercises.map((ex, i) => (
          <ExerciseCard
            key={`${ex.id}_${i}`}
            exercise={ex}
            index={i}
            onReplace={() => handleReplace(i)}
          />
        ))}

        <div className="card flex gap-2 p-4">
          <button onClick={handleSaveSingle} className="btn-primary flex-1">
            {savedFlash ? `✓ ${t.common.saved}` : t.saved.saveBtn}
          </button>
          <button onClick={handleExportSingle} className="btn-ghost flex-1">
            {t.common.export}
          </button>
        </div>
      </div>
    );
  }

  // ---------- RESULT: WEEKLY ----------
  if (weekly) {
    return (
      <div className="space-y-4 px-4 pb-4 pt-4">
        <BackBar onBack={() => setWeekly(null)} />
        <WarningBanner conditionKeys={weekly.conditionKeys} />

        <div className="flex items-center justify-between px-1">
          <h2 className="heading-display text-sm uppercase tracking-[0.2em] text-neutral-400">
            {t.weekly.generated}
          </h2>
          <span className="font-mono text-xs text-neutral-500">
            {weekly.daysPerWeek} {t.common.days}
          </span>
        </div>

        {weekly.days.map((day, dayIndex) => (
          <details key={day.id} className="card overflow-hidden" open={dayIndex === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
              <div>
                <div className="heading-display text-sm">
                  {t.weekly.day} {dayIndex + 1} · {day.label[lang]}
                </div>
                <div className="font-mono text-[11px] text-neutral-500">
                  {day.routine?.exercises?.length || 0} {t.common.sets ? '' : ''}
                  {day.routine?.exercises?.length ? ` ${t.common.sets || ''}`.replace(t.common.sets, '') : ''}
                  {day.routine?.exercises?.length || 0} · {day.routine?.exercises?.length ? '' : t.weekly.rest}
                </div>
              </div>
              <span className="text-neon-400">▾</span>
            </summary>

            <div className="space-y-3 border-t border-white/5 px-3 py-4">
              {day.routine?.empty ? (
                <p className="text-sm text-neutral-400">{t.weekly.rest}</p>
              ) : (
                day.routine.exercises.map((ex, i) => (
                  <ExerciseCard
                    key={`${day.id}_${ex.id}_${i}`}
                    exercise={ex}
                    index={i}
                    onReplace={() => handleReplaceWeekly(dayIndex, i)}
                  />
                ))
              )}
            </div>
          </details>
        ))}

        <div className="card flex gap-2 p-4">
          <button onClick={handleSaveWeekly} className="btn-primary flex-1">
            {savedFlash ? `✓ ${t.common.saved}` : t.saved.saveBtn}
          </button>
        </div>
      </div>
    );
  }

  // ---------- BUILDER WIZARD ----------
  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <header className="space-y-1">
        <h1 className="heading-display text-2xl">{t.builder.title}</h1>
        <p className="text-sm text-neutral-400">{t.builder.sub}</p>
      </header>

      <ProfileSummary profile={profile} t={t} lang={lang} onEdit={() => navigate('/onboarding')} />

      {/* Type selection */}
      {!type && (
        <Section title={t.builder.typeQ}>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setType('single')}
              className="card flex items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.04]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neon-500/10 text-neon-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3" strokeLinecap="round" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="heading-display text-base">{t.builder.types.single}</div>
                <div className="text-xs text-neutral-400">{t.builder.typeHint.single}</div>
              </div>
            </button>

            <button
              onClick={() => setType('weekly')}
              className="card flex items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.04]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neon-500/10 text-neon-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="heading-display text-base">{t.builder.types.weekly}</div>
                <div className="text-xs text-neutral-400">{t.builder.typeHint.weekly}</div>
              </div>
            </button>
          </div>
        </Section>
      )}

      {/* Single-day options */}
      {type === 'single' && (
        <>
          <button
            onClick={() => setType(null)}
            className="text-sm text-neutral-400 hover:text-neutral-200"
          >
            ← {t.common.back}
          </button>

          <Section title={t.builder.muscleQ}>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_OPTIONS.map((m) => (
                <Chip
                  key={m}
                  active={muscle === m}
                  onClick={() => setMuscle(m)}
                  label={t.form.muscleOptions[m] || m}
                />
              ))}
            </div>
          </Section>

          <Section title={t.builder.countQ}>
            <div className="grid grid-cols-6 gap-1.5">
              {COUNT_OPTIONS.map((n) => (
                <Chip
                  key={n}
                  active={count === n}
                  onClick={() => setCount(n)}
                  label={String(n)}
                  fill
                />
              ))}
            </div>
          </Section>

          <Section title={`${t.builder.timeQ} · ${time} ${t.common.minutes}`}>
            <div className="grid grid-cols-5 gap-1.5">
              {TIME_OPTIONS.map((m) => (
                <Chip
                  key={m}
                  active={time === m}
                  onClick={() => setTime(m)}
                  label={`${m}m`}
                  fill
                />
              ))}
            </div>
          </Section>

          <button
            onClick={handleGenerateSingle}
            disabled={!poolReady}
            className="btn-primary w-full"
          >
            {poolReady ? t.common.generate : t.common.loading}
          </button>
        </>
      )}

      {/* Weekly options */}
      {type === 'weekly' && (
        <>
          <button
            onClick={() => setType(null)}
            className="text-sm text-neutral-400 hover:text-neutral-200"
          >
            ← {t.common.back}
          </button>

          <Section title={t.builder.daysQ} hint={t.builder.daysHint}>
            <div className="grid grid-cols-5 gap-1.5">
              {DAYS_OPTIONS.map((n) => (
                <Chip
                  key={n}
                  active={daysPerWeek === n}
                  onClick={() => setDaysPerWeek(n)}
                  label={String(n)}
                  fill
                />
              ))}
            </div>
          </Section>

          <Section title={t.builder.splitPreview}>
            <div className="space-y-1">
              {split.map((slot, i) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-ink-800/40 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-neutral-500">
                    {t.weekly.day} {i + 1}
                  </span>
                  <span className="heading-display text-sm">{slot.label[lang]}</span>
                </div>
              ))}
            </div>
          </Section>

          <button
            onClick={handleGenerateWeekly}
            disabled={!poolReady}
            className="btn-primary w-full"
          >
            {poolReady ? t.common.generate : t.common.loading}
          </button>
        </>
      )}
    </div>
  );
}

// ---------- helpers ----------

function ProfileSummary({ profile, t, lang, onEdit }) {
  if (!profile?.goal) return null;
  return (
    <div className="card flex items-center justify-between gap-3 p-3">
      <div className="min-w-0 flex-1">
        <div className="font-display text-[10px] uppercase tracking-wider text-neutral-500">
          {t.builder.profileSummary}
        </div>
        <div className="mt-0.5 truncate text-xs text-neutral-300">
          {[t.onboarding.goals[profile.goal], t.onboarding.levels[profile.level]]
            .filter(Boolean)
            .join(' · ')}
          {profile.equipment?.length ? (
            <span className="text-neutral-500">
              {' · '}
              {profile.equipment
                .map((e) => t.form.equipmentOptions[e] || e)
                .slice(0, 3)
                .join(', ')}
              {profile.equipment.length > 3 ? '…' : ''}
            </span>
          ) : null}
        </div>
      </div>
      <button
        onClick={onEdit}
        className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-neutral-400 hover:text-neutral-200"
      >
        {t.builder.editProfile}
      </button>
    </div>
  );
}

function BackBar({ onBack }) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-200"
    >
      ← {t.common.back}
    </button>
  );
}

function Section({ title, hint, children }) {
  return (
    <div className="space-y-2">
      <div>
        <div className="font-display text-xs uppercase tracking-[0.18em] text-neutral-400">
          {title}
        </div>
        {hint && <div className="text-[11px] text-neutral-500">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, label, fill }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${
        fill ? 'flex-1 justify-center' : ''
      } inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
        active
          ? 'border-neon-500 bg-neon-500/10 text-neon-200 shadow-glow'
          : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.06]'
      }`}
    >
      {label}
    </button>
  );
}
