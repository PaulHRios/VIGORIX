import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { RestTimer } from './RestTimer.jsx';
import { addLog } from '../services/storageService.js';
import { youtubeSearchUrl } from '../utils/workoutGenerator.js';

// Map equipment key to a localized human label.
function equipmentLabel(equipment, t) {
  const key = equipment || 'none';
  return t.form?.equipments?.[key] || (key === 'none' ? '—' : key);
}

export function ExerciseCard({ exercise, index }) {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const name = exercise.name?.[lang] || exercise.name?.en || exercise.id;
  const steps = exercise.instructions?.[lang]?.length
    ? exercise.instructions[lang]
    : exercise.instructions?.en || [];

  const ytUrl = youtubeSearchUrl(exercise.youtubeQuery || exercise.name?.en || name, lang);

  return (
    <article className="card animate-slide-up overflow-hidden">
      <ExerciseImage exercise={exercise} alt={name} />

      <div className="absolute pointer-events-none" />

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="heading-display flex-1 text-lg leading-tight">{name}</h3>
          <span className="shrink-0 rounded-full bg-neon-500/10 px-2 py-1 font-display text-[10px] uppercase tracking-wider text-neon-300">
            {equipmentLabel(exercise.equipment, t)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat label={t.common.sets} value={exercise.sets} />
          <Stat label={t.common.reps} value={exercise.reps} />
          <Stat label={t.common.rest} value={`${exercise.rest}s`} />
        </div>

        <RestTimer seconds={exercise.rest} />

        <div className="flex gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="btn-ghost flex-1 py-2 text-sm"
            aria-expanded={expanded}
          >
            {t.exercise.instructions}
            <span className="ml-1 text-neon-400">{expanded ? '▴' : '▾'}</span>
          </button>
          <button onClick={() => setShowLog((v) => !v)} className="btn-ghost flex-1 py-2 text-sm">
            {t.exercise.logSet}
          </button>
        </div>

        <a
          href={ytUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] py-2 text-sm text-neutral-300 transition hover:bg-white/[0.05]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
          </svg>
          {t.exercise.watchTutorial}
        </a>

        {expanded && steps.length > 0 && (
          <ol className="list-inside list-decimal space-y-1 rounded-2xl bg-white/[0.02] p-3 text-sm leading-relaxed text-neutral-300">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        )}

        {showLog && <SetLogger exercise={exercise} onLogged={() => setShowLog(false)} />}
      </div>
    </article>
  );
}

/**
 * ExerciseImage — alternates between the start (images[0]) and end (images[1])
 * pose every ~700ms to fake a motion GIF. Falls back to a static image or an
 * icon if loading fails.
 */
function ExerciseImage({ exercise, alt }) {
  const images =
    Array.isArray(exercise.images) && exercise.images.length > 0
      ? exercise.images
      : exercise.gif
        ? [exercise.gif]
        : [];

  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (images.length < 2) return undefined;
    const id = setInterval(() => setFrame((f) => (f + 1) % images.length), 700);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0 || failed) {
    return (
      <div className="grid aspect-[16/10] w-full place-items-center bg-ink-700 text-neutral-500">
        <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor">
          <path d="M5 8h2v8H5V8zm12 0h2v8h-2V8zM8 11h8v2H8v-2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-white">
      {/* Render all images stacked; fade between them. This avoids flicker
          while loading and gives a smoother visual than swapping `src`. */}
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          onError={i === 0 ? () => setFailed(true) : undefined}
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
    <div className="rounded-2xl border border-white/5 bg-ink-800/40 p-2.5 text-center">
      <div className="font-mono text-lg font-semibold tabular-nums text-neon-300">{value}</div>
      <div className="font-display text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </div>
    </div>
  );
}

function SetLogger({ exercise, onLogged }) {
  const { t, lang } = useLanguage();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [unit, setUnit] = useState('kg');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await addLog({
        exercise_id: exercise.id,
        exercise_name: exercise.name?.[lang] || exercise.name?.en || exercise.id,
        weight: weight ? Number(weight) : null,
        unit,
        reps: reps ? Number(reps) : null,
        notes: notes || null,
      });
      setDone(true);
      setTimeout(() => onLogged?.(), 600);
    } catch (e) {
      console.error(e);
      alert(t.errors.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">{t.exercise.weight}</label>
          <input
            inputMode="decimal"
            className="input py-2 text-sm"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">{t.common.reps}</label>
          <input
            inputMode="numeric"
            className="input py-2 text-sm"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">&nbsp;</label>
          <select
            className="input py-2 text-sm"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="kg">{t.exercise.kg}</option>
            <option value="lb">{t.exercise.lb}</option>
          </select>
        </div>
      </div>
      <div className="mt-2">
        <label className="label">{t.exercise.notes}</label>
        <input
          className="input py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder=""
        />
      </div>
      <button onClick={submit} disabled={busy || done} className="btn-primary mt-3 w-full py-2 text-sm">
        {done ? `✓ ${t.common.saved}` : busy ? t.common.loading : t.common.save}
      </button>
    </div>
  );
}
