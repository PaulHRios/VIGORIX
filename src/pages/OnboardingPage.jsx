// src/pages/OnboardingPage.jsx
//
// 5-step guided onboarding. Saves answers to userProfile so the builder
// can reuse them. No free text except the optional condition field at the end.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { completeOnboarding, ageWarnings } from '../services/userProfile.js';
import { detectConditions } from '../data/conditions.js';

const STEPS = ['sex', 'age', 'goal', 'level', 'equipment', 'condition'];

const SEX_OPTIONS = ['male', 'female', 'other'];
const GOAL_OPTIONS = ['hypertrophy', 'fatloss', 'strength', 'endurance', 'general', 'mobility'];
const LEVEL_OPTIONS = ['beginner', 'balanced', 'advanced', 'gym_rat'];
const EQUIPMENT_OPTIONS = [
  'none',
  'dumbbells',
  'barbell',
  'bands',
  'kettlebell',
  'machines',
  'medicine_ball',
  'exercise_ball',
];

export function OnboardingPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({
    sex: null,
    age: '',
    goal: null,
    level: null,
    equipment: [],
    condition: '',
  });

  const step = STEPS[stepIndex];
  const total = STEPS.length;

  const canAdvance = useMemo(() => {
    switch (step) {
      case 'sex':
        return Boolean(answers.sex);
      case 'age': {
        const a = Number(answers.age);
        return Number.isFinite(a) && a >= 10 && a <= 99;
      }
      case 'goal':
        return Boolean(answers.goal);
      case 'level':
        return Boolean(answers.level);
      case 'equipment':
        return Array.isArray(answers.equipment) && answers.equipment.length > 0;
      case 'condition':
        return true; // optional
      default:
        return false;
    }
  }, [step, answers]);

  function update(patch) {
    setAnswers((prev) => ({ ...prev, ...patch }));
  }

  function toggleEquipment(key) {
    setAnswers((prev) => {
      const has = prev.equipment.includes(key);
      return {
        ...prev,
        equipment: has ? prev.equipment.filter((k) => k !== key) : [...prev.equipment, key],
      };
    });
  }

  function handleNext() {
    if (!canAdvance) return;
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    finish();
  }

  function handleBack() {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  }

  function finish() {
    const conditionKeys = answers.condition ? detectConditions(answers.condition) : [];
    completeOnboarding({
      sex: answers.sex,
      age: Number(answers.age),
      goal: answers.goal,
      level: answers.level,
      equipment: answers.equipment,
      conditionText: answers.condition || '',
      conditionKeys,
    });
    navigate('/builder');
  }

  const ageWarn = step === 'age' ? ageWarnings(answers.age, lang) : null;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-8 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={stepIndex === 0}
          className="text-sm text-neutral-400 disabled:opacity-30"
        >
          ← {t.common.back}
        </button>
        <span className="font-mono text-xs text-neutral-500">
          {t.onboarding.step} {stepIndex + 1} {t.onboarding.of} {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-8 h-1 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-neon-500 transition-all duration-500"
          style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Welcome on first step */}
      {stepIndex === 0 && (
        <div className="mb-8 animate-fade-in">
          <h1 className="heading-display mb-1 text-3xl">{t.onboarding.welcome}</h1>
          <p className="text-sm text-neutral-400">{t.onboarding.sub}</p>
        </div>
      )}

      <div className="flex-1 animate-slide-up" key={step}>
        {step === 'sex' && (
          <Step title={t.onboarding.sexQ}>
            <div className="grid grid-cols-1 gap-2">
              {SEX_OPTIONS.map((opt) => (
                <BigChoice
                  key={opt}
                  active={answers.sex === opt}
                  onClick={() => update({ sex: opt })}
                  label={t.onboarding.sex[opt]}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 'age' && (
          <Step title={t.onboarding.ageQ} hint={t.onboarding.ageHint}>
            <input
              type="number"
              inputMode="numeric"
              min="10"
              max="99"
              autoFocus
              value={answers.age}
              onChange={(e) => update({ age: e.target.value })}
              placeholder={t.onboarding.agePlaceholder}
              className="input text-center font-display text-3xl"
            />
            {answers.age && !canAdvance && (
              <p className="mt-2 text-sm text-warn-red">{t.onboarding.ageError}</p>
            )}
            {ageWarn?.message && (
              <p className="mt-3 rounded-2xl border border-warn-amber/30 bg-warn-amber/10 p-3 text-xs text-warn-amber">
                {ageWarn.message}
              </p>
            )}
          </Step>
        )}

        {step === 'goal' && (
          <Step title={t.onboarding.goalQ}>
            <div className="grid grid-cols-1 gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <BigChoice
                  key={opt}
                  active={answers.goal === opt}
                  onClick={() => update({ goal: opt })}
                  label={t.onboarding.goals[opt]}
                  hint={t.onboarding.goalHint[opt]}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 'level' && (
          <Step title={t.onboarding.levelQ}>
            <div className="grid grid-cols-1 gap-2">
              {LEVEL_OPTIONS.map((opt) => (
                <BigChoice
                  key={opt}
                  active={answers.level === opt}
                  onClick={() => update({ level: opt })}
                  label={t.onboarding.levels[opt]}
                  hint={t.onboarding.levelHint[opt]}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 'equipment' && (
          <Step title={t.onboarding.equipmentQ} hint={t.onboarding.equipmentHint}>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleEquipment(opt)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-display transition-all ${
                    answers.equipment.includes(opt)
                      ? 'border-neon-500 bg-neon-500/10 text-neon-200 shadow-glow'
                      : 'border-white/10 bg-white/[0.02] text-neutral-200 hover:bg-white/[0.05]'
                  }`}
                >
                  {t.form.equipmentOptions[opt]}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 'condition' && (
          <Step title={t.onboarding.conditionQ}>
            <textarea
              rows={3}
              value={answers.condition}
              onChange={(e) => update({ condition: e.target.value })}
              placeholder={t.onboarding.conditionPlaceholder}
              className="input resize-none"
            />
          </Step>
        )}
      </div>

      {/* Footer with action button */}
      <div className="sticky bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent pb-2 pt-6">
        <button
          onClick={handleNext}
          disabled={!canAdvance}
          className="btn-primary w-full"
        >
          {stepIndex === STEPS.length - 1 ? t.onboarding.finish : t.common.continue}
        </button>
        {step === 'condition' && !answers.condition && (
          <button
            onClick={finish}
            className="mt-2 w-full text-center text-xs text-neutral-500"
          >
            {t.onboarding.conditionSkip} →
          </button>
        )}
      </div>
    </div>
  );
}

function Step({ title, hint, children }) {
  return (
    <div>
      <h2 className="heading-display mb-2 text-2xl text-neutral-100">{title}</h2>
      {hint && <p className="mb-5 text-sm text-neutral-400">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BigChoice({ active, onClick, label, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
        active
          ? 'border-neon-500 bg-neon-500/10 shadow-glow'
          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div
          className={`heading-display text-base ${
            active ? 'text-neon-200' : 'text-neutral-100'
          }`}
        >
          {label}
        </div>
        {hint && (
          <div className="mt-0.5 text-xs leading-relaxed text-neutral-500">{hint}</div>
        )}
      </div>
      <div
        className={`ml-3 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
          active ? 'border-neon-400 bg-neon-500 text-ink-950' : 'border-white/20'
        }`}
      >
        {active && (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M6.5 11.5 3 8l1.4-1.4L6.5 8.7l5.1-5.1L13 5z" />
          </svg>
        )}
      </div>
    </button>
  );
}
