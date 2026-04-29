import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';

const FIELDS = [
  {
    key: 'goal',
    options: ['strength', 'hypertrophy', 'endurance', 'fatloss', 'mobility', 'general'],
    labelKey: 'goal',
    valueMap: 'goals',
  },
  {
    key: 'muscle',
    options: ['full_body', 'upper', 'lower', 'core', 'push', 'pull', 'legs', 'glutes'],
    labelKey: 'muscle',
    valueMap: 'muscles',
  },
  {
    key: 'equipment',
    options: ['none', 'dumbbells', 'barbell', 'bands', 'kettlebell', 'machines'],
    labelKey: 'equipment',
    valueMap: 'equipments',
  },
  {
    key: 'level',
    options: ['beginner', 'intermediate', 'advanced'],
    labelKey: 'level',
    valueMap: 'levels',
  },
];

const TIMES = [15, 30, 45, 60];

export function GuidedInputs({ initial, onSubmit, onCancel }) {
  const { t } = useLanguage();
  const [values, setValues] = useState(() => ({
    goal: 'general',
    muscle: 'full_body',
    equipment: 'none',
    level: 'beginner',
    time: 30,
    condition: '',
    ...initial,
  }));

  function set(k, v) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <div className="card space-y-5 p-5">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <div className="label">{t.form[field.labelKey]}</div>
          <div className="flex flex-wrap gap-1.5">
            {field.options.map((opt) => (
              <button
                key={opt}
                onClick={() => set(field.key, opt)}
                className={`chip ${values[field.key] === opt ? 'chip-active' : ''}`}
                type="button"
              >
                {t.form[field.valueMap][opt]}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <div className="label">
          {t.form.time} <span className="ml-1 text-neutral-500">({values.time} {t.common.minutes})</span>
        </div>
        <div className="flex gap-1.5">
          {TIMES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => set('time', m)}
              className={`chip flex-1 justify-center ${values.time === m ? 'chip-active' : ''}`}
            >
              {m}m
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
        <button type="button" onClick={() => onSubmit(values)} className="btn-primary flex-1">
          {t.chat.generate} →
        </button>
      </div>
    </div>
  );
}
