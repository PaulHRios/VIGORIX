import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { RestTimer } from './RestTimer.jsx';
import { addLog } from '../services/storageService.js';
import { youtubeSearchUrl } from '../utils/workoutGenerator.js';

function equipmentLabel(equipment, t, lang) {
  const key = equipment || 'none';

  if (key === 'none') return lang === 'es' ? 'Peso corporal' : 'Bodyweight';

  return t.form?.equipments?.[key] || key;
}

function translateStepToSpanish(step) {
  if (!step) return step;

  let s = step;

  const replacements = [
    [/Lie down/gi, 'Acuéstate'],
    [/Lie on your back/gi, 'Acuéstate boca arriba'],
    [/Lie face down/gi, 'Acuéstate boca abajo'],
    [/Stand straight/gi, 'Párate derecho'],
    [/Stand tall/gi, 'Párate erguido'],
    [/Keep your back straight/gi, 'Mantén la espalda recta'],
    [/Keep your core braced/gi, 'Mantén el core firme'],
    [/Keep your core tight/gi, 'Mantén el abdomen firme'],
    [/Keep your chest up/gi, 'Mantén el pecho arriba'],
    [/Lower the weight/gi, 'Baja el peso'],
    [/Press the weight/gi, 'Empuja el peso'],
    [/Return to the starting position/gi, 'Regresa a la posición inicial'],
    [/Repeat for the recommended amount of repetitions/gi, 'Repite por el número recomendado de repeticiones'],
    [/Hold/gi, 'Mantén'],
    [/Slowly/gi, 'Lentamente'],
    [/Pause/gi, 'Haz una pausa'],
    [/Squeeze/gi, 'Aprieta'],
    [/your chest/gi, 'tu pecho'],
    [/your shoulders/gi, 'tus hombros'],
    [/your back/gi, 'tu espalda'],
    [/your knees/gi, 'tus rodillas'],
    [/your hips/gi, 'tu cadera'],
    [/your elbows/gi, 'tus codos'],
    [/the floor/gi, 'el suelo'],
    [/dumbbells/gi, 'mancuernas'],
    [/dumbbell/gi, 'mancuerna'],
    [/barbell/gi, 'barra'],
    [/cable/gi, 'cable'],
    [/machine/gi, 'máquina'],
    [/bench/gi, 'banco'],
  ];

  for (const [pattern, replacement] of replacements) {
    s = s.replace(pattern, replacement);
  }

  return s;
}

export function ExerciseCard({ exercise, index, onReplace, replacing = false }) {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const name = exercise.name?.[lang] || exercise.name?.en || exercise.id;

  const steps = useMemo(() => {
    const raw =
      exercise.instructions?.[lang]?.length
        ? exercise.instructions[lang]
        : exercise.instructions?.en || [];

    if (lang !== 'es') return raw;

    return raw.map(translateStepToSpanish);
  }, [exercise, lang]);

  const ytUrl = youtubeSearchUrl(exercise.youtubeQuery || exercise.name?.en || name, lang);
  const sectionLabel = exercise.muscleSection?.label?.[lang] || exercise.muscleSection?.label?.en;

  return (
    <article className="card animate-slide-up overflow-hidden">
      <ExerciseImage exercise={exercise} alt={name} />

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="heading-display text-lg leading-tight">{name}</h3>

            {sectionLabel && (
              <div className="mt-1 rounded-full bg-white/[0.04] px-2 py-1 font-display text-[10px] uppercase tracking-wider text-neon-300">
                {lang === 'es' ? 'Sección' : 'Section'}: {sectionLabel}
              </div>
            )}
          </div>

          <span className="shrink-0 rounded-full bg-neon-500/10 px-2 py-1 font-display text-[10px] uppercase tracking-wider text-neon-300">
            {equipmentLabel(exercise.equipment, t, lang)}
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

        {onReplace && (
          <button
            type="button"
            onClick={onReplace}
            disabled={replacing}
            className="btn-ghost w-full py-2 text-sm disabled:opacity-50"
          >
            {replacing
              ? lang === 'es'
                ? 'Buscando alternativa…'
                : 'Finding alternative…'
              : lang === 'es'
                ? 'Cambiar este ejercicio'
                : 'Replace this exercise'}
          </button>
        )}

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
