// src/pages/SessionPage.jsx
//
// Full-screen, focused workout session. Walks the user through every
// exercise of a routine (or one day of a weekly plan), set-by-set, with
// an integrated rest timer and per-set logging.
//
// Flow:
//   1. Optional pre-session pain check (modal): blocks any body area where
//      the user reports pain ≥ 7. If a current exercise targets a blocked
//      muscle we prompt them to skip it.
//   2. For each exercise:
//        - Optional warmup sets for compound lifts
//        - "Set N of M" — input weight & reps, hit "Set complete"
//        - Rest timer auto-starts (auto-skipped if 0)
//        - When all sets are done, advance to next exercise
//   3. End → cooldown / mobility sequence + summary screen.
//
// State is *not* persisted. The user can save logs (which use the regular
// addLog) but if they leave the session everything else is lost on purpose.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { addLog } from '../services/storageService.js';
import { youtubeSearchUrl } from '../utils/workoutGenerator.js';
import {
  shouldWarmup,
  warmupSets,
  suggestWorkingWeight,
  epley1RM,
} from '../utils/strength.js';
import { buildCooldown } from '../utils/cooldown.js';
import { listLogs } from '../services/storageService.js';

const PAIN_AREAS = ['knee', 'lower_back', 'shoulder', 'wrist', 'elbow', 'hip', 'ankle'];

// Map a body area → muscle keys that share weight-bearing load on it. If the
// user reports knee pain ≥ 7, any exercise whose main_muscle is in this list
// gets a "skip suggested" warning.
const PAIN_MUSCLE_BLOCKLIST = {
  knee: ['quads', 'hamstrings', 'glutes', 'calves'],
  lower_back: ['back', 'lower_back', 'hamstrings'],
  shoulder: ['shoulders', 'chest', 'back'],
  wrist: ['biceps', 'triceps', 'forearms', 'chest'],
  elbow: ['biceps', 'triceps'],
  hip: ['glutes', 'quads', 'hamstrings', 'adductors', 'abductors'],
  ankle: ['calves', 'quads'],
};

export function SessionPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const loc = useLocation();

  // Routine + (optional) day index passed via location state from caller.
  const incoming = loc.state?.routine || null;
  const incomingDayIndex = loc.state?.dayIndex; // for weekly plans
  const incomingName = loc.state?.name || '';

  // Resolve to a flat exercise list.
  const { exercises, displayName } = useMemo(() => {
    if (!incoming) return { exercises: [], displayName: '' };
    if (incoming.type === 'weekly' && Array.isArray(incoming.days)) {
      const idx = Number.isInteger(incomingDayIndex) ? incomingDayIndex : 0;
      const day = incoming.days[idx];
      const list = day?.routine?.exercises || day?.exercises || [];
      const label = day?.label?.[lang] || day?.label?.en || `${t.weekly.day} ${idx + 1}`;
      return { exercises: list, displayName: `${incomingName || incoming.name || ''} · ${label}` };
    }
    if (incoming.type === 'expert_weekly' && Array.isArray(incoming.days)) {
      const idx = Number.isInteger(incomingDayIndex) ? incomingDayIndex : 0;
      const day = incoming.days[idx];
      return { exercises: day?.exercises || [], displayName: incomingName };
    }
    return { exercises: incoming.exercises || [], displayName: incomingName };
  }, [incoming, incomingDayIndex, incomingName, lang, t]);

  // Session position
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0); // 0-based, in [0, sets+warmup-1]
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [showPainCheck, setShowPainCheck] = useState(true);
  const [pain, setPain] = useState({}); // { knee: 0..10, lower_back: 0..10, ... }
  const [doneCooldown, setDoneCooldown] = useState(false);
  const [completed, setCompleted] = useState(false); // last exercise done
  const [sessionLogs, setSessionLogs] = useState([]); // logs collected this session
  const [pastLogs, setPastLogs] = useState([]);

  // Per-set form
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [unit, setUnit] = useState('kg');
  const [skipNotice, setSkipNotice] = useState(null);

  const restRef = useRef(null);

  // Load the user's past logs once so we can suggest working weights.
  useEffect(() => {
    listLogs(200).then((rows) => setPastLogs(rows || [])).catch(() => {});
  }, []);

  // If we have nothing to work on, bounce back.
  useEffect(() => {
    if (!incoming) navigate('/saved', { replace: true });
  }, [incoming, navigate]);

  // Build (warmup + working) "set rows" for the current exercise.
  const currentExercise = exercises[exerciseIndex];
  const setRows = useMemo(() => {
    if (!currentExercise) return [];
    const rows = [];
    const working = suggestWorkingWeight(pastLogs, currentExercise.id);
    if (shouldWarmup(currentExercise) && working) {
      const wu = warmupSets(working);
      for (const w of wu) {
        rows.push({
          kind: 'warmup',
          label: `${w.pct}%`,
          weight: w.weight,
          reps: w.reps,
        });
      }
    }
    const totalWorking = Number(currentExercise.sets) || 3;
    for (let i = 0; i < totalWorking; i++) {
      rows.push({
        kind: 'work',
        label: `${i + 1}/${totalWorking}`,
        weight: working,
        reps: currentExercise.reps,
      });
    }
    return rows;
  }, [currentExercise, pastLogs]);

  // Re-seed the input fields whenever the row changes.
  useEffect(() => {
    if (!currentExercise || resting) return;
    const row = setRows[setIndex];
    if (!row) return;
    setWeightInput(row.weight != null ? String(row.weight) : '');
    setRepsInput(typeof row.reps === 'number' ? String(row.reps) : '');
  }, [exerciseIndex, setIndex, resting, setRows, currentExercise]);

  // Rest countdown
  useEffect(() => {
    if (!resting) return;
    restRef.current = setInterval(() => {
      setRestRemaining((s) => {
        if (s <= 1) {
          clearInterval(restRef.current);
          try { navigator.vibrate?.([120, 60, 120]); } catch {}
          setResting(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(restRef.current);
  }, [resting]);

  // Pain → blocked muscles set
  const blockedMuscles = useMemo(() => {
    const set = new Set();
    for (const a of PAIN_AREAS) {
      if (Number(pain[a]) >= 7) {
        for (const m of PAIN_MUSCLE_BLOCKLIST[a] || []) set.add(m);
      }
    }
    return set;
  }, [pain]);

  // When the user lands on an exercise that targets a blocked muscle, surface
  // a notice once per exercise.
  useEffect(() => {
    if (!currentExercise) return;
    const m = currentExercise.main_muscle || currentExercise._targetMuscle;
    if (m && blockedMuscles.has(m)) {
      setSkipNotice(m);
    } else {
      setSkipNotice(null);
    }
  }, [currentExercise, blockedMuscles]);

  function handleSetComplete() {
    const row = setRows[setIndex];
    if (!row) return;
    const w = Number(weightInput);
    const r = Number(repsInput);

    // Persist working sets to the log; skip warmups.
    if (row.kind === 'work' && Number.isFinite(w) && w >= 0 && Number.isFinite(r) && r > 0) {
      addLog({
        exercise_id: currentExercise.id,
        exercise_name: currentExercise.name?.[lang] || currentExercise.name?.en || currentExercise.id,
        weight: w,
        unit,
        reps: r,
        notes: null,
      })
        .then((logged) => setSessionLogs((prev) => [...prev, logged]))
        .catch(() => {});
    }

    const isLastSet = setIndex >= setRows.length - 1;
    if (isLastSet) {
      // Move to next exercise (or finish).
      if (exerciseIndex >= exercises.length - 1) {
        setCompleted(true);
        return;
      }
      setExerciseIndex((i) => i + 1);
      setSetIndex(0);
      setResting(false);
      return;
    }
    // Start rest.
    const restSec = Number(currentExercise.rest) || 60;
    setRestRemaining(restSec);
    setResting(true);
    setSetIndex((s) => s + 1);
  }

  function handleSkipRest() {
    setResting(false);
    setRestRemaining(0);
  }

  function handleSkipExercise() {
    if (exerciseIndex >= exercises.length - 1) {
      setCompleted(true);
      return;
    }
    setExerciseIndex((i) => i + 1);
    setSetIndex(0);
    setResting(false);
  }

  function handleQuit() {
    if (!confirm(lang === 'es' ? '¿Salir de la sesión?' : 'End the session?')) return;
    navigate(-1);
  }

  // Cooldown moves come from the muscles trained.
  const cooldownMoves = useMemo(() => buildCooldown(exercises, lang), [exercises, lang]);

  // ---------- LANDING / PAIN CHECK ----------
  if (showPainCheck) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-ink-950 px-5 pb-6 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 self-start text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← {t.common.back}
        </button>
        <h1 className="heading-display text-2xl">{t.session.painTitle}</h1>
        <p className="mt-1 text-sm text-neutral-400">{t.session.painSub}</p>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto pb-4">
          {PAIN_AREAS.map((a) => (
            <div key={a} className="rounded-2xl border border-white/5 bg-ink-900/40 p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-neutral-100">{t.onboarding.avoidOptions[a]}</span>
                <span className="font-mono text-sm text-neon-300">{pain[a] || 0}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={pain[a] || 0}
                onChange={(e) => setPain((p) => ({ ...p, [a]: Number(e.target.value) }))}
                className="mt-1 w-full accent-neon-500"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowPainCheck(false)}
          className="btn-primary mt-3 w-full text-base"
        >
          {t.session.start} ▶
        </button>
      </div>
    );
  }

  // ---------- COMPLETION + COOLDOWN ----------
  if (completed) {
    if (doneCooldown) {
      const totalSets = sessionLogs.length;
      const totalReps = sessionLogs.reduce((s, l) => s + (Number(l.reps) || 0), 0);
      const totalVol = sessionLogs.reduce(
        (s, l) => s + (Number(l.weight) || 0) * (Number(l.reps) || 0),
        0,
      );
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center">
          <div className="text-7xl">🎉</div>
          <h1 className="heading-display text-3xl">{t.session.done}</h1>
          <p className="text-neutral-400">{displayName}</p>
          <div className="card grid w-full grid-cols-3 gap-2 p-4 max-w-sm">
            <Stat label={t.common.sets} value={totalSets} />
            <Stat label={t.common.reps} value={totalReps} />
            <Stat label={lang === 'es' ? 'Vol kg' : 'Vol kg'} value={Math.round(totalVol)} />
          </div>
          <button onClick={() => navigate('/progress')} className="btn-primary w-full max-w-sm">
            {t.session.viewProgress}
          </button>
          <button onClick={() => navigate(-1)} className="btn-ghost w-full max-w-sm">
            {t.common.close}
          </button>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-ink-950 px-5 pb-6 pt-6">
        <h1 className="heading-display text-2xl">{t.session.cooldownTitle}</h1>
        <p className="mt-1 text-sm text-neutral-400">{t.session.cooldownSub}</p>
        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pb-4">
          {cooldownMoves.map((m, i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-ink-900/40 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-neutral-100">{m.name}</span>
                <span className="font-mono text-xs text-neon-300">{m.seconds}s</span>
              </div>
              <a
                href={m.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[11px] uppercase tracking-wider text-neutral-400 hover:text-neon-300"
              >
                ▶ {t.experts.watch}
              </a>
            </div>
          ))}
        </div>
        <button
          onClick={() => setDoneCooldown(true)}
          className="btn-primary w-full"
        >
          {t.session.cooldownDone} ✓
        </button>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950 text-neutral-400">
        {t.common.loading}
      </div>
    );
  }

  // ---------- ACTIVE SESSION ----------
  const exerciseName = currentExercise.name?.[lang] || currentExercise.name?.en || currentExercise.id;
  const totalRows = setRows.length;
  const overallProgress = ((exerciseIndex + (setIndex + (resting ? 1 : 0)) / totalRows) / exercises.length) * 100;
  const currentRow = setRows[setIndex];
  const restPct = currentExercise.rest > 0
    ? ((currentExercise.rest - restRemaining) / currentExercise.rest) * 100
    : 100;
  const lastEstRm = (() => {
    const matches = pastLogs.filter(
      (l) => l.exercise_id === currentExercise.id || l.exercise_name === exerciseName,
    );
    if (!matches.length) return null;
    const m = matches[0];
    return epley1RM(m.weight, m.reps);
  })();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950">
      {/* Header */}
      <header className="safe-top sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-ink-950/90 px-4 py-3 backdrop-blur">
        <button
          onClick={handleQuit}
          className="rounded-full px-3 py-1 text-xs text-neutral-400 hover:text-warn-red"
        >
          ✕ {t.session.quit}
        </button>
        <div className="text-center">
          <div className="font-display text-[10px] uppercase tracking-widest text-neutral-500">
            {t.session.exercise} {exerciseIndex + 1}/{exercises.length}
          </div>
          <div className="font-mono text-[10px] text-neutral-500">{displayName}</div>
        </div>
        <div className="w-12" />
      </header>

      {/* Overall progress */}
      <div className="h-1 w-full bg-white/5">
        <div
          className="h-full bg-neon-500 transition-all duration-300"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        {/* Exercise heading */}
        <div className="mb-4">
          <h1 className="heading-display text-3xl leading-tight">{exerciseName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
            {currentExercise.main_muscle && (
              <span className="rounded-full border border-neon-500/40 bg-neon-500/10 px-2 py-0.5 text-neon-200">
                {currentExercise.main_muscle}
              </span>
            )}
            {currentExercise.equipment && currentExercise.equipment !== 'none' && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-neutral-400">
                {t.form.equipmentOptions?.[currentExercise.equipment] || currentExercise.equipment}
              </span>
            )}
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-neutral-400">
              {currentExercise.sets} × {currentExercise.reps}
            </span>
            {lastEstRm != null && (
              <span className="rounded-full border border-warn-amber/30 bg-warn-amber/5 px-2 py-0.5 text-warn-amber">
                1RM ≈ {lastEstRm} kg
              </span>
            )}
          </div>
        </div>

        {/* Pain skip notice */}
        {skipNotice && (
          <div className="mb-3 rounded-2xl border border-warn-red/30 bg-warn-red/10 p-3 text-sm text-warn-red">
            ⚠ {t.session.painBlockedHint}
            <button
              onClick={handleSkipExercise}
              className="ml-2 underline hover:text-warn-amber"
            >
              {t.session.skipExercise}
            </button>
          </div>
        )}

        {/* Image / GIF */}
        <ExerciseImage exercise={currentExercise} alt={exerciseName} />

        {/* Set rows */}
        <div className="mt-4 space-y-1">
          {setRows.map((row, i) => (
            <SetRow
              key={i}
              row={row}
              index={i}
              current={i === setIndex && !resting && !completed}
              done={i < setIndex || (i === setIndex && resting)}
              t={t}
            />
          ))}
        </div>

        {/* Rest UI takes over the input when resting */}
        {resting ? (
          <RestPanel
            seconds={currentExercise.rest}
            remaining={restRemaining}
            pct={restPct}
            onSkip={handleSkipRest}
            onAdd={(extra) => setRestRemaining((s) => s + extra)}
            t={t}
            lang={lang}
          />
        ) : (
          <ActiveSetPanel
            row={currentRow}
            weight={weightInput}
            setWeight={setWeightInput}
            reps={repsInput}
            setReps={setRepsInput}
            unit={unit}
            setUnit={setUnit}
            t={t}
            lang={lang}
            onComplete={handleSetComplete}
            onSkip={handleSkipExercise}
            isLast={
              setIndex >= setRows.length - 1 && exerciseIndex >= exercises.length - 1
            }
          />
        )}

        {/* Tutorial link */}
        <a
          href={youtubeSearchUrl(currentExercise.youtubeQuery || exerciseName, lang)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center text-xs text-neutral-500 hover:text-neon-300"
        >
          ▶ {t.exercise.watchTutorial}
        </a>
      </div>
    </div>
  );
}

function ActiveSetPanel({ row, weight, setWeight, reps, setReps, unit, setUnit, t, lang, onComplete, onSkip, isLast }) {
  const isWarm = row?.kind === 'warmup';
  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-ink-900/70 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-display text-xs uppercase tracking-wider ${isWarm ? 'text-warn-amber' : 'text-neon-300'}`}>
          {isWarm ? t.session.warmupSet : t.session.workingSet} · {row?.label}
        </span>
        <span className="font-mono text-[11px] text-neutral-500">
          {lang === 'es' ? 'Sugerido' : 'Suggested'}: {row?.weight != null ? `${row.weight}${unit}` : '—'} × {row?.reps}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">{t.exercise.weight}</label>
          <input
            inputMode="decimal"
            className="input py-3 text-center font-display text-xl"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">{t.common.reps}</label>
          <input
            inputMode="numeric"
            className="input py-3 text-center font-display text-xl"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">&nbsp;</label>
          <select
            className="input py-3 text-center text-sm"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="kg">{t.exercise.kg}</option>
            <option value="lb">{t.exercise.lb}</option>
          </select>
        </div>
      </div>

      <button onClick={onComplete} className="btn-primary mt-3 w-full py-3 text-base">
        {isLast ? `${t.session.finishSession} 🏁` : `${t.session.setComplete} ✓`}
      </button>
      <button onClick={onSkip} className="mt-1 w-full py-2 text-xs text-neutral-500 hover:text-warn-amber">
        {t.session.skipExercise} →
      </button>
    </div>
  );
}

function RestPanel({ seconds, remaining, pct, onSkip, onAdd, t, lang }) {
  const mm = String(Math.floor(remaining / 60)).padStart(1, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return (
    <div className="mt-4 rounded-3xl border border-neon-500/30 bg-neon-500/5 p-5 text-center">
      <div className="font-display text-xs uppercase tracking-widest text-neon-300">
        {t.session.resting}
      </div>
      <div className="mt-2 font-mono text-7xl font-semibold tabular-nums text-neon-300">
        {mm}:{ss}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full bg-neon-500 transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onAdd(15)} className="btn-ghost flex-1 py-2 text-sm">
          +15s
        </button>
        <button onClick={() => onAdd(30)} className="btn-ghost flex-1 py-2 text-sm">
          +30s
        </button>
        <button onClick={onSkip} className="btn-primary flex-1 py-2 text-sm">
          {t.session.skipRest} ⏭
        </button>
      </div>
    </div>
  );
}

function SetRow({ row, index, current, done, t }) {
  const isWarm = row.kind === 'warmup';
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition-all ${
        current
          ? 'border-neon-500 bg-neon-500/10 shadow-glow'
          : done
            ? 'border-white/5 bg-ink-800/30 opacity-60'
            : 'border-white/5 bg-ink-900/40'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-mono ${
            done ? 'bg-neon-500/20 text-neon-300' : current ? 'bg-neon-500 text-ink-950' : 'bg-white/5 text-neutral-400'
          }`}
        >
          {done ? '✓' : index + 1}
        </span>
        <span className={`font-display text-[11px] uppercase tracking-wider ${isWarm ? 'text-warn-amber' : 'text-neutral-300'}`}>
          {isWarm ? t.session.warmup : t.session.set} {row.label}
        </span>
      </div>
      <span className="font-mono text-[11px] text-neutral-400">
        {row.weight != null ? `${row.weight} kg` : '—'} × {row.reps}
      </span>
    </div>
  );
}

function ExerciseImage({ exercise, alt }) {
  const images =
    Array.isArray(exercise.images) && exercise.images.length
      ? exercise.images
      : exercise.gif
        ? [exercise.gif]
        : [];
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (images.length < 2) return undefined;
    const id = setInterval(() => setFrame((f) => (f + 1) % images.length), 700);
    return () => clearInterval(id);
  }, [images.length]);

  if (!images.length) {
    return (
      <div className="grid aspect-[16/9] w-full place-items-center rounded-3xl bg-ink-800 text-neutral-500">
        <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor">
          <path d="M5 8h2v8H5V8zm12 0h2v8h-2V8zM8 11h8v2H8v-2z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-white">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
            i === frame ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-800/40 p-3">
      <div className="font-mono text-2xl font-semibold tabular-nums text-neon-300">{value}</div>
      <div className="font-display text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </div>
    </div>
  );
}
