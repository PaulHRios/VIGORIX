// src/pages/OnboardingPage.jsx
//
// Guided onboarding. Saves answers to userProfile so the builder can reuse
// them. The "condition" portion is now a series of structured questions:
//   - pregnancy stage (only shown to potentially pregnant users)
//   - mobility / effort capacity
//   - body areas to avoid (multi-select chips)
//   - free-text notes (optional, last)

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { completeOnboarding, ageWarnings } from '../services/userProfile.js';
import { detectConditions, deriveConditionKeysFromProfile } from '../data/conditions.js';

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

const PREGNANCY_OPTIONS = ['none', 't1', 't2', 't3', 'postpartum'];
const MOBILITY_OPTIONS = ['full', 'mild', 'severe'];
const AVOID_AREA_OPTIONS = [
  'knee',
  'lower_back',
  'upper_back',
  'shoulder',
  'wrist',
  'elbow',
  'hip',
  'ankle',
  'chest',
  'abdomen',
];

// Pregnancy step is only relevant to potentially pregnant users.
function shouldAskPregnancy(answers) {
  if (answers.sex !== 'female') return false;
  const a = Number(answers.age);
  return Number.isFinite(a) && a >= 14 && a <= 55;
}

export function OnboardingPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({
    sex: null,
    age: '',
    height: '',
    heightUnit: 'cm',
    goal: null,
    level: null,
    equipment: [],
    pregnancy: 'none',
    mobility: 'full',
    avoidAreas: [],
    notes: '',
  });

  // Pregnancy step is conditional, so the active step list is computed.
  const steps = useMemo(() => {
    const list = ['sex', 'age', 'height', 'goal', 'level', 'equipment'];
    if (shouldAskPregnancy(answers)) list.push('pregnancy');
    list.push('mobility', 'avoid', 'notes');
    return list;
  }, [answers.sex, answers.age]);

  const step = steps[stepIndex];
  const total = steps.length;

  const canAdvance = useMemo(() => {
    switch (step) {
      case 'sex':
        return Boolean(answers.sex);
      case 'age': {
        const a = Number(answers.age);
        return Number.isFinite(a) && a >= 10 && a <= 99;
      }
      case 'height': {
        const h = Number(answers.height);
        if (!Number.isFinite(h) || h <= 0) return false;
        if (answers.heightUnit === 'in') return h >= 39 && h <= 90;
        return h >= 100 && h <= 230;
      }
      case 'goal':
        return Boolean(answers.goal);
      case 'level':
        return Boolean(answers.level);
      case 'equipment':
        return Array.isArray(answers.equipment) && answers.equipment.length > 0;
      case 'pregnancy':
        return Boolean(answers.pregnancy);
      case 'mobility':
        return Boolean(answers.mobility);
      case 'avoid':
        return true; // multi-select, none is valid
      case 'notes':
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

  function toggleAvoidArea(key) {
    setAnswers((prev) => {
      const has = prev.avoidAreas.includes(key);
      return {
        ...prev,
        avoidAreas: has ? prev.avoidAreas.filter((k) => k !== key) : [...prev.avoidAreas, key],
      };
    });
  }

  function handleNext() {
    if (!canAdvance) return;
    if (stepIndex < steps.length - 1) {
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
    const heightCm =
      answers.heightUnit === 'in'
        ? Math.round(Number(answers.height) * 2.54)
        : Math.round(Number(answers.height));

    const ageNum = Number(answers.age);
    // Build the structured profile + derived condition keys.
    const baseProfile = {
      sex: answers.sex,
      age: ageNum,
      height: heightCm,
      heightUnit: 'cm',
      goal: answers.goal,
      level: answers.level,
      equipment: answers.equipment,
      pregnancy: answers.pregnancy,
      mobility: answers.mobility,
      avoidAreas: answers.avoidAreas,
      conditionText: answers.notes || '',
    };

    const conditionKeys = deriveConditionKeysFromProfile(baseProfile);
    // Extra: detect from notes too (already covered by the helper, but kept
    // explicit so we never lose an old keyword on edit).
    const fromNotes = answers.notes ? detectConditions(answers.notes) : [];
    const merged = Array.from(new Set([...conditionKeys, ...fromNotes]));

    completeOnboarding({ ...baseProfile, conditionKeys: merged });
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

        {step === 'height' && (
          <Step title={t.onboarding.heightQ} hint={t.onboarding.heightHint}>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={answers.heightUnit === 'in' ? '39' : '100'}
                max={answers.heightUnit === 'in' ? '90' : '230'}
                autoFocus
                value={answers.height}
                onChange={(e) => update({ height: e.target.value })}
                placeholder={
                  answers.heightUnit === 'in' ? t.onboarding.heightPlaceholderIn : t.onboarding.heightPlaceholderCm
                }
                className="input flex-1 text-center font-display text-3xl"
              />
              <div className="flex overflow-hidden rounded-2xl border border-white/10">
                {['cm', 'in'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => update({ heightUnit: u })}
                    className={`px-4 font-display text-sm uppercase tracking-wider transition-colors ${
                      answers.heightUnit === u
                        ? 'bg-neon-500/20 text-neon-200'
                        : 'bg-white/[0.02] text-neutral-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            {answers.height && !canAdvance && (
              <p className="mt-2 text-sm text-warn-red">{t.onboarding.heightError}</p>
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

        {step === 'pregnancy' && (
          <Step title={t.onboarding.pregnancyQ} hint={t.onboarding.pregnancyHint}>
            <div className="grid grid-cols-1 gap-2">
              {PREGNANCY_OPTIONS.map((opt) => (
                <BigChoice
                  key={opt}
                  active={answers.pregnancy === opt}
                  onClick={() => update({ pregnancy: opt })}
                  label={t.onboarding.pregnancyOptions[opt]}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 'mobility' && (
          <Step title={t.onboarding.mobilityQ} hint={t.onboarding.mobilityHint}>
            <div className="grid grid-cols-1 gap-2">
              {MOBILITY_OPTIONS.map((opt) => (
                <BigChoice
                  key={opt}
                  active={answers.mobility === opt}
                  onClick={() => update({ mobility: opt })}
                  label={t.onboarding.mobilityOptions[opt]}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 'avoid' && (
          <Step title={t.onboarding.avoidQ} hint={t.onboarding.avoidHint}>
            <button
              type="button"
              onClick={() => update({ avoidAreas: [] })}
              className={`mb-2 w-full rounded-2xl border px-4 py-3 text-left text-sm font-display transition-all ${
                answers.avoidAreas.length === 0
                  ? 'border-neon-500 bg-neon-500/10 text-neon-200 shadow-glow'
                  : 'border-white/10 bg-white/[0.02] text-neutral-200 hover:bg-white/[0.05]'
              }`}
            >
              {t.onboarding.avoidOptions.none}
            </button>
            <div className="grid grid-cols-2 gap-2">
              {AVOID_AREA_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleAvoidArea(opt)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-display transition-all ${
                    answers.avoidAreas.includes(opt)
                      ? 'border-warn-amber bg-warn-amber/10 text-warn-amber shadow-glow'
                      : 'border-white/10 bg-white/[0.02] text-neutral-200 hover:bg-white/[0.05]'
                  }`}
                >
                  {t.onboarding.avoidOptions[opt]}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 'notes' && (
          <Step title={t.onboarding.notesQ}>
            <textarea
              rows={3}
              value={answers.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder={t.onboarding.notesPlaceholder}
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
          {stepIndex === steps.length - 1 ? t.onboarding.finish : t.common.continue}
        </button>
        {step === 'notes' && !answers.notes && (
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
