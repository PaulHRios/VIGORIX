import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { RestTimer } from './RestTimer.jsx';
import { addLog } from '../services/storageService.js';

export function ExerciseCard({ exercise, index }) {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const name = exercise.name[lang] || exercise.name.en;
  const steps = exercise.instructions?.[lang] || exercise.instructions?.en || [];

  return (
    <article className="card animate-slide-up overflow-hidden">
      <div className="relative aspect-[16/10] w-full bg-ink-700">
        {!imgFailed ? (
          <img
            src={exercise.gif}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-neutral-500">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor">
              <path d="M5 8h2v8H5V8zm12 0h2v8h-2V8zM8 11h8v2H8v-2z" />
            </svg>
          </div>
        )}
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink-950/70 px-2.5 py-1 text-[11px] font-display backdrop-blur-sm">
          <span className="text-neon-400">#{String(index + 1).padStart(2, '0')}</span>
          <span className="text-neutral-400">·</span>
          <span className="uppercase tracking-wider text-neutral-300">{exercise.equipment}</span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="heading-display text-lg leading-tight">{name}</h3>

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
          <button
            onClick={() => setShowLog((v) => !v)}
            className="btn-ghost flex-1 py-2 text-sm"
          >
            {t.exercise.logSet}
          </button>
        </div>

        {expanded && (
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

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-800/40 p-2.5 text-center">
      <div className="font-mono text-lg font-semibold tabular-nums text-neon-300">{value}</div>
      <div className="font-display text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
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
        exercise_name: exercise.name[lang] || exercise.name.en,
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
