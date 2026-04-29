import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';

const GOALS = ['strength', 'hypertrophy', 'endurance', 'fatloss', 'mobility', 'general'];

const MUSCLES = [
  'full_body',
  'upper',
  'lower',
  'push',
  'pull',
  'core',
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'traps',
  'forearms',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
];

const EQUIPMENT = [
  'none',
  'dumbbells',
  'barbell',
  'bands',
  'kettlebell',
  'machines',
  'exercise_ball',
  'medicine_ball',
];

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const TIMES = [15, 30, 45, 60, 90, 120];
const COUNTS = [4, 6, 8, 10, 12];

export function GuidedInputs({ initial, onSubmit, onCancel }) {
  const { t, lang } = useLanguage();

  const [values, setValues] = useState(() => ({
    goal: 'general',
    muscles: ['full_body'],
    equipment: ['none'],
    level: 'beginner',
    time: 30,
    exerciseCount: null,
    condition: '',
    ...initial,
  }));

  function set(k, v) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function toggleArray(key, value) {
    setValues((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];

      if (value === 'full_body') {
        return { ...prev, [key]: ['full_body'] };
      }

      const withoutFull = current.filter((x) => x !== 'full_body');
      const exists = withoutFull.includes(value);
      const next = exists ? withoutFull.filter((x) => x !== value) : [...withoutFull, value];

      return {
        ...prev,
        [key]: next.length ? next : key === 'muscles' ? ['full_body'] : [],
      };
    });
  }

  function submit() {
    onSubmit({
      ...values,
      muscle: values.muscles?.[0] || 'full_body',
      conditionStatus: values.condition ? 'described' : 'none',
    });
  }

  return (
    <div className="card space-y-5 p-5">
      <ChipGroup
        label={t.form.goal}
        options={GOALS}
        selected={values.goal}
        labels={t.form.goals}
        single
        onSelect={(v) => set('goal', v)}
      />

      <ChipGroup
        label={
          lang === 'es'
            ? 'Grupos musculares'
            : 'Muscle groups'
        }
        options={MUSCLES}
        selected={values.muscles}
        labels={t.form.muscles}
        onSelect={(v) => toggleArray('muscles', v)}
      />

      <ChipGroup
        label={
          lang === 'es'
            ? 'Equipo disponible'
            : 'Available equipment'
        }
        options={EQUIPMENT}
        selected={values.equipment}
        labels={{
          ...t.form.equipments,
          none: lang === 'es' ? 'Peso corporal' : 'Bodyweight',
        }}
        onSelect={(v) => toggleArray('equipment', v)}
      />

      <ChipGroup
        label={t.form.level}
        options={LEVELS}
        selected={values.level}
        labels={t.form.levels}
        single
        onSelect={(v) => set('level', v)}
      />

      <div>
        <div className="label">
          {lang === 'es' ? 'Tiempo disponible' : 'Time available'}
          {values.time && !values.exerciseCount && (
            <span className="ml-1 text-neutral-500">
              ({values.time} {t.common.minutes})
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TIMES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setValues((prev) => ({ ...prev, time: m, exerciseCount: null }))}
              className={`chip flex-1 justify-center ${values.time === m && !values.exerciseCount ? 'chip-active' : ''}`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="label">
          {lang === 'es' ? 'Número de ejercicios' : 'Number of exercises'}
          {values.exerciseCount && <span className="ml-1 text-neutral-500">({values.exerciseCount})</span>}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setValues((prev) => ({ ...prev, exerciseCount: n, time: null }))}
              className={`chip flex-1 justify-center ${values.exerciseCount === n ? 'chip-active' : ''}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="label">
          {t.form.condition}
          <span className="ml-1 normal-case tracking-normal text-neutral-500">
            ({t.common.optional})
          </span>
        </div>

        <input
          className="input"
          value={values.condition}
          onChange={(e) => set('condition', e.target.value)}
          placeholder={t.form.conditionPlaceholder}
        />
      </div>

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            {t.common.cancel}
          </button>
        )}

        <button type="button" onClick={submit} className="btn-primary flex-1">
          {t.chat.generate} →
        </button>
      </div>
    </div>
  );
}

function ChipGroup({ label, options, selected, labels, onSelect, single = false }) {
  const selectedArray = Array.isArray(selected) ? selected : [selected];

  return (
    <div>
      <div className="label">{label}</div>

      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = single ? selected === opt : selectedArray.includes(opt);

          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`chip ${active ? 'chip-active' : ''}`}
              type="button"
            >
              {labels?.[opt] || opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
