// src/pages/ExpertsPage.jsx
//
// Expert Routines library. Two tabs:
//   1. By muscle (3+ alternatives per group)
//   2. By schedule (5+ alternatives per "days per week")
//
// Each routine shows author, level, goal, exercises, and a YouTube link
// per exercise. We intentionally skip our internal GIF lookup — the user
// said "if there's no GIF, just show the YouTube search link". This avoids
// awkward "missing image" placeholders for niche or rare lifts.

import { useMemo, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { getProfile } from '../services/userProfile.js';
import {
  PER_MUSCLE_ROUTINES,
  PER_SCHEDULE_ROUTINES,
  POPULATION_ROUTINES,
  recommendedPopulation,
  populationMuscles,
  expertYoutubeUrl,
  filterRoutines,
} from '../data/expertRoutines.js';
import { saveRoutine } from '../services/storageService.js';

const STANDARD_MUSCLE_KEYS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'abs'];
const SCHEDULE_KEYS = [3, 4, 5, 6, 7];
const POPULATION_KEYS = ['standard', 'pregnancy', 'senior', 'mobility'];

export function ExpertsPage() {
  const { t, lang } = useLanguage();
  const profile = useMemo(() => getProfile(), []);
  const recommended = useMemo(() => recommendedPopulation(profile), [profile]);

  const [tab, setTab] = useState('muscle'); // 'muscle' | 'schedule'
  const [population, setPopulation] = useState(recommended);
  const [days, setDays] = useState(4);
  const [openId, setOpenId] = useState(null);
  const [savedFlash, setSavedFlash] = useState(null);

  // Muscle keys depend on which population bucket is active.
  const muscleKeys = useMemo(() => {
    if (population === 'standard') return STANDARD_MUSCLE_KEYS;
    return populationMuscles(population) || [];
  }, [population]);

  const [muscle, setMuscle] = useState(muscleKeys[0] || 'chest');

  // Reset muscle selection when the population changes and the previous muscle
  // no longer exists in the new bucket.
  useMemo(() => {
    if (!muscleKeys.includes(muscle)) setMuscle(muscleKeys[0] || 'chest');
  }, [muscleKeys, muscle]);

  const muscleRoutines = useMemo(() => {
    const source =
      population === 'standard'
        ? PER_MUSCLE_ROUTINES[muscle] || []
        : POPULATION_ROUTINES[population]?.[muscle] || [];
    // For special populations we ignore level/goal filtering — every routine
    // there is already curated for that audience.
    if (population !== 'standard') return source;
    return filterRoutines(source, { level: profile.level, goal: profile.goal });
  }, [population, muscle, profile.level, profile.goal]);

  const scheduleRoutines = useMemo(
    () => filterRoutines(PER_SCHEDULE_ROUTINES[days] || [], { level: profile.level, goal: profile.goal }),
    [days, profile.level, profile.goal],
  );

  async function handleSaveSchedule(routine) {
    const payload = {
      type: 'expert_weekly',
      title: routine.title,
      author: routine.author,
      summary: routine.summary,
      days: routine.days.map((d) => ({
        label: d.name,
        exercises: d.exercises,
      })),
      createdAt: new Date().toISOString(),
    };
    try {
      await saveRoutine(`${t.experts.savedPrefix} · ${routine.title[lang] || routine.title.en}`, payload);
      setSavedFlash(routine.id);
      setTimeout(() => setSavedFlash(null), 1500);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveMuscle(routine) {
    const payload = {
      type: 'expert_single',
      title: routine.title,
      author: routine.author,
      summary: routine.summary,
      exercises: routine.exercises,
      durationMin: routine.durationMin,
      createdAt: new Date().toISOString(),
    };
    try {
      await saveRoutine(`${t.experts.savedPrefix} · ${routine.title[lang] || routine.title.en}`, payload);
      setSavedFlash(routine.id);
      setTimeout(() => setSavedFlash(null), 1500);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <header>
        <h1 className="heading-display text-2xl">{t.experts.title}</h1>
        <p className="text-sm text-neutral-400">{t.experts.sub}</p>
      </header>

      {/* Tab switcher */}
      <div className="flex rounded-2xl border border-white/10 bg-ink-900/40 p-1">
        <button
          onClick={() => setTab('muscle')}
          className={`flex-1 rounded-xl px-3 py-2 font-display text-xs uppercase tracking-wider transition-colors ${
            tab === 'muscle' ? 'bg-neon-500/15 text-neon-300' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {t.experts.byMuscle}
        </button>
        <button
          onClick={() => setTab('schedule')}
          className={`flex-1 rounded-xl px-3 py-2 font-display text-xs uppercase tracking-wider transition-colors ${
            tab === 'schedule' ? 'bg-neon-500/15 text-neon-300' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {t.experts.bySchedule}
        </button>
      </div>

      {tab === 'muscle' && (
        <>
          <Section title={t.experts.population}>
            <div className="flex flex-wrap gap-1.5">
              {POPULATION_KEYS.map((p) => (
                <Chip
                  key={p}
                  active={population === p}
                  onClick={() => setPopulation(p)}
                  label={t.experts.populations[p]}
                  badge={recommended === p && p !== 'standard' ? '★' : null}
                />
              ))}
            </div>
            {recommended !== 'standard' && population === recommended && (
              <p className="text-[11px] text-neon-300">{t.experts.autoRecommended}</p>
            )}
          </Section>

          <Section title={t.experts.pickMuscle}>
            <div className="flex flex-wrap gap-1.5">
              {muscleKeys.map((m) => (
                <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)} label={t.form.muscleOptions[m] || m} />
              ))}
            </div>
          </Section>

          <div className="space-y-3">
            {muscleRoutines.length === 0 && (
              <p className="card p-4 text-sm text-neutral-400">{t.experts.noResults}</p>
            )}
            {muscleRoutines.map((r) => (
              <RoutineCard
                key={r.id}
                routine={r}
                lang={lang}
                t={t}
                isOpen={openId === r.id}
                onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                onSave={() => handleSaveMuscle(r)}
                saved={savedFlash === r.id}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'schedule' && (
        <>
          <Section title={t.experts.pickSchedule}>
            <div className="grid grid-cols-5 gap-1.5">
              {SCHEDULE_KEYS.map((d) => (
                <Chip key={d} active={days === d} onClick={() => setDays(d)} label={`${d} ${t.common.days.toLowerCase()}`} fill />
              ))}
            </div>
          </Section>

          <div className="space-y-3">
            {scheduleRoutines.length === 0 && (
              <p className="card p-4 text-sm text-neutral-400">{t.experts.noResults}</p>
            )}
            {scheduleRoutines.map((r) => (
              <ScheduleCard
                key={r.id}
                routine={r}
                lang={lang}
                t={t}
                isOpen={openId === r.id}
                onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                onSave={() => handleSaveSchedule(r)}
                saved={savedFlash === r.id}
              />
            ))}
          </div>
        </>
      )}

      <div className="rounded-2xl border border-white/5 bg-ink-900/40 p-3 text-[11px] text-neutral-500">
        {t.experts.disclaimer}
      </div>
    </div>
  );
}

function RoutineCard({ routine, lang, t, isOpen, onToggle, onSave, saved }) {
  return (
    <article className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="min-w-0 flex-1">
          <div className="heading-display text-base leading-tight">
            {routine.title[lang] || routine.title.en}
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-neon-400">
            {routine.author}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
            <Pill>{t.onboarding.levels[routine.level === 'intermediate' ? 'balanced' : routine.level] || routine.level}</Pill>
            <Pill>{t.onboarding.goals[routine.goal] || routine.goal}</Pill>
            {routine.durationMin && <Pill>{routine.durationMin} {t.common.minutes}</Pill>}
            <Pill>{routine.exercises.length} ex</Pill>
          </div>
        </div>
        <span className="mt-1 shrink-0 text-neon-400">{isOpen ? '▴' : '▾'}</span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-white/5 px-4 py-4">
          <p className="text-xs leading-relaxed text-neutral-300">
            {routine.summary[lang] || routine.summary.en}
          </p>

          <ol className="space-y-2">
            {routine.exercises.map((ex, i) => (
              <ExerciseRow key={i} ex={ex} lang={lang} t={t} index={i} />
            ))}
          </ol>

          <button onClick={onSave} className="btn-primary w-full">
            {saved ? `✓ ${t.common.saved}` : t.experts.saveRoutine}
          </button>
        </div>
      )}
    </article>
  );
}

function ScheduleCard({ routine, lang, t, isOpen, onToggle, onSave, saved }) {
  return (
    <article className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="min-w-0 flex-1">
          <div className="heading-display text-base leading-tight">
            {routine.title[lang] || routine.title.en}
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-neon-400">
            {routine.author}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
            <Pill>{t.onboarding.levels[routine.level === 'intermediate' ? 'balanced' : routine.level] || routine.level}</Pill>
            <Pill>{t.onboarding.goals[routine.goal] || routine.goal}</Pill>
            <Pill>{routine.days.length} {t.common.days.toLowerCase()}</Pill>
          </div>
        </div>
        <span className="mt-1 shrink-0 text-neon-400">{isOpen ? '▴' : '▾'}</span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-white/5 px-4 py-4">
          <p className="text-xs leading-relaxed text-neutral-300">
            {routine.summary[lang] || routine.summary.en}
          </p>

          {routine.days.map((day, di) => (
            <details key={di} className="rounded-2xl border border-white/5 bg-ink-800/30">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-sm">
                <span className="font-mono text-[11px] text-neutral-500">
                  {t.weekly.day} {di + 1}
                </span>
                {' · '}
                <span className="heading-display">{day.name[lang] || day.name.en}</span>
                <span className="ml-2 font-mono text-[11px] text-neutral-500">
                  ({day.exercises.length})
                </span>
              </summary>
              <ol className="space-y-2 border-t border-white/5 px-3 py-3">
                {day.exercises.map((ex, i) => (
                  <ExerciseRow key={i} ex={ex} lang={lang} t={t} index={i} />
                ))}
              </ol>
            </details>
          ))}

          <button onClick={onSave} className="btn-primary w-full">
            {saved ? `✓ ${t.common.saved}` : t.experts.saveRoutine}
          </button>
        </div>
      )}
    </article>
  );
}

function ExerciseRow({ ex, lang, t, index }) {
  const name = ex.name[lang] || ex.name.en;
  const note = ex.note?.[lang] || ex.note?.en;
  return (
    <li className="rounded-xl border border-white/5 bg-ink-900/40 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="mr-2 font-mono text-[10px] text-neon-400">
            #{String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-sm text-neutral-100">{name}</span>
        </div>
        <a
          href={expertYoutubeUrl(ex.youtube)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-neon-500/10 px-2 py-1 font-display text-[10px] uppercase tracking-wider text-neon-300 hover:bg-neon-500/20"
        >
          {t.experts.watch}
        </a>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-neutral-400">
        <span className="rounded-md bg-ink-800/60 px-1.5 py-0.5 text-neon-300">
          {ex.sets} × {ex.reps}
        </span>
        {ex.rest > 0 && <span>· {ex.rest}s {t.common.rest}</span>}
      </div>
      {note && (
        <div className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          💡 {note}
        </div>
      )}
    </li>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <div className="font-display text-xs uppercase tracking-[0.18em] text-neutral-400">{title}</div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, label, fill, badge }) {
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
      {badge && <span className="text-neon-400">{badge}</span>}
      {label}
    </button>
  );
}

function Pill({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 uppercase tracking-wider text-neutral-400">
      {children}
    </span>
  );
}
