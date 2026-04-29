import { useEffect, useRef, useState } from 'react';
import { ChatInput } from '../components/ChatInput.jsx';
import { ChatMessage } from '../components/ChatMessage.jsx';
import { ExerciseCard } from '../components/ExerciseCard.jsx';
import { GuidedInputs } from '../components/GuidedInputs.jsx';
import { WarningBanner } from '../components/WarningBanner.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { detectConditions } from '../data/conditions.js';
import { getExercises } from '../services/exerciseService.js';
import {
  applyAnswerToClarifyingField,
  buildClarifyingQuestion,
  generateRoutine,
  getNextClarifyingField,
  mergeRequestDraft,
  normalizeRequest,
  parseRequestText,
  replaceExerciseInRoutine,
} from '../utils/workoutGenerator.js';
import { saveRoutine } from '../services/storageService.js';
import { exportRoutinePdf } from '../utils/pdfExport.js';

const MUSCLE_OPTIONS = [
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
  'upper',
  'lower',
  'push',
  'pull',
  'full_body',
];

const EQUIPMENT_OPTIONS = [
  'none',
  'dumbbells',
  'barbell',
  'bands',
  'kettlebell',
  'exercise_ball',
  'medicine_ball',
  'machines',
];

const TIME_OPTIONS = [
  { label: '4 ejercicios', value: { exerciseCount: 4, time: null } },
  { label: '6 ejercicios', value: { exerciseCount: 6, time: null } },
  { label: '8 ejercicios', value: { exerciseCount: 8, time: null } },
  { label: '10 ejercicios', value: { exerciseCount: 10, time: null } },
  { label: '12 ejercicios', value: { exerciseCount: 12, time: null } },
  { label: '30 min', value: { time: 30, exerciseCount: null } },
  { label: '45 min', value: { time: 45, exerciseCount: null } },
  { label: '60 min', value: { time: 60, exerciseCount: null } },
];

const LEVEL_OPTIONS = [
  { key: 'beginner', es: 'Principiante', en: 'Beginner' },
  { key: 'intermediate', es: 'Intermedio', en: 'Intermediate' },
  { key: 'advanced', es: 'Avanzado', en: 'Advanced' },
];

const GOAL_OPTIONS = [
  { key: 'strength', es: 'Fuerza', en: 'Strength' },
  { key: 'hypertrophy', es: 'Hipertrofia', en: 'Hypertrophy' },
  { key: 'endurance', es: 'Resistencia', en: 'Endurance' },
  { key: 'fatloss', es: 'Pérdida de grasa', en: 'Fat loss' },
  { key: 'mobility', es: 'Movilidad', en: 'Mobility' },
];

export function ChatPage() {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showGuided, setShowGuided] = useState(false);
  const [busy, setBusy] = useState(false);
  const [routine, setRoutine] = useState(null);
  const [pool, setPool] = useState([]);
  const [savedName, setSavedName] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [draftRequest, setDraftRequest] = useState(null);
  const [pendingField, setPendingField] = useState(null);
  const [replacingIndex, setReplacingIndex] = useState(null);
  const scrollRef = useRef(null);

  function initialGreeting() {
    return {
      role: 'assistant',
      text:
        lang === 'es'
          ? '¡Hola! Dime qué rutina quieres y te voy preguntando lo necesario para armarla bien.'
          : "Hi! Tell me what routine you want and I'll ask what I need to build it properly.",
    };
  }

  function resetChat() {
    setMessages([initialGreeting()]);
    setInput('');
    setShowGuided(false);
    setBusy(false);
    setRoutine(null);
    setSavedName('');
    setSavedFlash(false);
    setDraftRequest(null);
    setPendingField(null);
    setReplacingIndex(null);
  }

  useEffect(() => {
    resetChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    function onReset() {
      resetChat();
    }

    window.addEventListener('vigorix:reset-chat', onReset);
    return () => window.removeEventListener('vigorix:reset-chat', onReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    getExercises().then(setPool);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, routine, pendingField]);

  async function handleFreeText() {
    const text = input.trim();

    if (!text) return;

    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);

    const parsed = parseRequestText(text);

    const combined = pendingField
      ? applyAnswerToClarifyingField(draftRequest || {}, parsed, pendingField, text)
      : draftRequest
        ? mergeRequestDraft(draftRequest, parsed)
        : parsed;

    await continueFlow(combined, combined.condition || text);
  }

  async function continueFlow(request, conditionText = '') {
    const normalized = normalizeRequest(request);
    const nextField = getNextClarifyingField(normalized);

    if (nextField) {
      setDraftRequest(normalized);
      setPendingField(nextField);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: buildClarifyingQuestion(normalized, lang, nextField),
        },
      ]);

      return;
    }

    setDraftRequest(null);
    setPendingField(null);
    await generateFromRequest(normalized, conditionText || normalized.condition || '');
  }

  async function handleQuickAnswer(field, value, label) {
    const base = draftRequest || {};
    let next = { ...base };

    if (field === 'muscles') {
      next = {
        ...next,
        muscles: value,
        muscle: value[0] || 'full_body',
        muscleStatus: 'selected',
      };
    }

    if (field === 'time') {
      next = {
        ...next,
        ...value,
      };
    }

    if (field === 'level') {
      next = {
        ...next,
        level: value,
      };
    }

    if (field === 'goal') {
      next = {
        ...next,
        goal: value,
      };
    }

    if (field === 'equipment') {
      next = {
        ...next,
        equipment: value,
      };
    }

    if (field === 'condition') {
      next = {
        ...next,
        conditionStatus: value === 'none' ? 'none' : 'described',
        condition: value === 'none' ? '' : value,
      };
    }

    setMessages((m) => [...m, { role: 'user', text: label }]);
    await continueFlow(next, next.condition || '');
  }

  async function handleGuided(values) {
    setDraftRequest(null);
    setPendingField(null);
    setShowGuided(false);

    const normalizedValues = {
      ...values,
      muscleStatus: 'selected',
      conditionStatus: values.condition ? 'described' : 'none',
    };

    const summary = formatRequestSummary(normalizedValues, t);
    setMessages((m) => [...m, { role: 'user', text: summary }]);

    await generateFromRequest(normalizedValues, normalizedValues.condition || '');
  }

  async function generateFromRequest(req, conditionText) {
    setBusy(true);

    try {
      await new Promise((r) => setTimeout(r, 250));

      let exercisePool = pool;

      if (!exercisePool || exercisePool.length === 0) {
        exercisePool = await getExercises();
        setPool(exercisePool);
      }

      const conditions = detectConditions(conditionText || req.condition || '');
      const result = generateRoutine(req, exercisePool, conditions);

      if (result.empty) {
        setMessages((m) => [...m, { role: 'assistant', text: t.chat.noResults }]);
        setRoutine(null);
        return;
      }

      setRoutine(result);
      setMessages((m) => [...m, { role: 'assistant', text: buildRoutineSummary(result, lang) }]);
      setSavedName('');
    } finally {
      setBusy(false);
    }
  }

  async function handleReplaceExercise(index) {
    if (!routine) return;

    setReplacingIndex(index);

    try {
      let exercisePool = pool;

      if (!exercisePool || exercisePool.length === 0) {
        exercisePool = await getExercises();
        setPool(exercisePool);
      }

      const nextRoutine = replaceExerciseInRoutine(routine, index, exercisePool);

      if (!nextRoutine) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            text:
              lang === 'es'
                ? 'No encontré una alternativa válida para ese ejercicio con tus filtros actuales.'
                : 'I could not find a valid alternative for that exercise with your current filters.',
          },
        ]);
        return;
      }

      setRoutine(nextRoutine);
    } finally {
      setReplacingIndex(null);
    }
  }

  async function handleSave() {
    if (!routine) return;

    const name = savedName.trim() || `${t.saved.defaultName} · ${new Date().toLocaleDateString()}`;

    try {
      await saveRoutine(name, routine);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (e) {
      console.error(e);
      alert(t.errors.saveFailed);
    }
  }

  function handleExport() {
    if (!routine) return;

    const name = savedName.trim() || t.saved.defaultName;
    exportRoutinePdf(routine, lang, name);
  }

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col">
      <div ref={scrollRef} className="scroll-hide flex-1 space-y-3 overflow-y-auto px-4 pt-4">
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role}>
            {m.text}
          </ChatMessage>
        ))}

        {pendingField && !busy && (
          <QuickReplyPanel
            key={pendingField}
            field={pendingField}
            request={draftRequest}
            lang={lang}
            t={t}
            onAnswer={handleQuickAnswer}
          />
        )}

        {busy && (
          <ChatMessage role="assistant">
            <span className="inline-flex items-center gap-2">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400 [animation-delay:240ms]" />
              </span>
              <span className="text-neutral-300">{t.chat.thinking}</span>
            </span>
          </ChatMessage>
        )}

        {showGuided && (
          <GuidedInputs onSubmit={handleGuided} onCancel={() => setShowGuided(false)} />
        )}

        {routine && !routine.empty && (
          <div className="space-y-3 pt-2">
            <WarningBanner conditionKeys={routine.conditionKeys} />

            <div className="flex items-center justify-between px-1">
              <h2 className="heading-display text-sm uppercase tracking-[0.2em] text-neutral-400">
                {t.chat.generated}
              </h2>

              <span className="font-mono text-xs text-neutral-500">
                {routine.exercises.length} ·{' '}
                {Math.round(routine.exercises.reduce((s, e) => s + e.sets * 60, 0) / 60)}m
              </span>
            </div>

            {routine.exercises.map((ex, i) => (
              <ExerciseCard
                key={ex.id + '_' + i}
                exercise={ex}
                index={i}
                onReplace={() => handleReplaceExercise(i)}
                replacing={replacingIndex === i}
              />
            ))}

            <div className="card space-y-2 p-4">
              <input
                className="input"
                placeholder={t.saved.named}
                value={savedName}
                onChange={(e) => setSavedName(e.target.value)}
              />

              <div className="flex gap-2">
                <button onClick={handleSave} className="btn-primary flex-1">
                  {savedFlash ? `✓ ${t.common.saved}` : t.saved.saveBtn}
                </button>

                <button onClick={handleExport} className="btn-ghost flex-1">
                  {t.common.export}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>

      <div className="px-4 pb-2 pt-2">
        <button
          type="button"
          onClick={resetChat}
          className="mb-2 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2 font-display text-xs uppercase tracking-wider text-neutral-400"
        >
          {lang === 'es' ? 'Borrar chat' : 'Clear chat'}
        </button>

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleFreeText}
          onToggleGuided={() => setShowGuided((v) => !v)}
          busy={busy}
        />
      </div>
    </div>
  );
}

function QuickReplyPanel({ field, request, lang, t, onAnswer }) {
  const [selected, setSelected] = useState(() => {
    if (field === 'equipment') {
      const eq = request?.equipment || [];
      return Array.isArray(eq) && !eq.includes('any') ? eq : [];
    }

    if (field === 'muscles') {
      const muscles = request?.muscles || [];
      return Array.isArray(muscles) ? muscles : [];
    }

    return [];
  });

  function labelForMuscle(key) {
    return t.form?.muscles?.[key] || key;
  }

  function labelForEquipment(key) {
    if (key === 'none') return lang === 'es' ? 'Peso corporal' : 'Bodyweight';
    return t.form?.equipments?.[key] || key;
  }

  function toggleMulti(value, allValue = null) {
    setSelected((prev) => {
      if (allValue && value === allValue) return [allValue];

      const withoutAll = allValue ? prev.filter((x) => x !== allValue) : prev;
      const exists = withoutAll.includes(value);
      const next = exists ? withoutAll.filter((x) => x !== value) : [...withoutAll, value];

      return next;
    });
  }

  if (field === 'muscles') {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 font-display text-xs uppercase tracking-wider text-neutral-400">
          {lang === 'es' ? 'Selecciona músculos' : 'Select muscles'}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMulti(m, 'full_body')}
              className={`chip ${selected.includes(m) ? 'chip-active' : ''}`}
            >
              {labelForMuscle(m)}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() =>
            onAnswer(
              'muscles',
              selected,
              selected.map(labelForMuscle).join(' + '),
            )
          }
          className="btn-primary mt-3 w-full py-2 text-sm disabled:opacity-40"
        >
          {lang === 'es' ? 'Confirmar músculos' : 'Confirm muscles'}
        </button>
      </div>
    );
  }

  if (field === 'time') {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex flex-wrap gap-1.5">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => onAnswer('time', opt.value, opt.label)}
              className="chip"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field === 'level') {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex flex-wrap gap-1.5">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onAnswer('level', opt.key, opt[lang] || opt.en)}
              className="chip"
            >
              {opt[lang] || opt.en}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field === 'goal') {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex flex-wrap gap-1.5">
          {GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onAnswer('goal', opt.key, opt[lang] || opt.en)}
              className="chip"
            >
              {opt[lang] || opt.en}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field === 'equipment') {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 font-display text-xs uppercase tracking-wider text-neutral-400">
          {lang === 'es' ? 'Selecciona equipo disponible' : 'Select available equipment'}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EQUIPMENT_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => toggleMulti(e)}
              className={`chip ${selected.includes(e) ? 'chip-active' : ''}`}
            >
              {labelForEquipment(e)}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() =>
            onAnswer(
              'equipment',
              selected,
              selected.map(labelForEquipment).join(' + '),
            )
          }
          className="btn-primary mt-3 w-full py-2 text-sm disabled:opacity-40"
        >
          {lang === 'es' ? 'Confirmar equipo' : 'Confirm equipment'}
        </button>
      </div>
    );
  }

  if (field === 'condition') {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onAnswer('condition', 'none', lang === 'es' ? 'Sin lesiones' : 'No injuries')}
            className="chip"
          >
            {lang === 'es' ? 'Sin lesiones' : 'No injuries'}
          </button>

          <button
            type="button"
            onClick={() =>
              onAnswer(
                'condition',
                lang === 'es' ? 'dolor o lesión no especificada' : 'unspecified pain or injury',
                lang === 'es' ? 'Tengo una lesión / dolor' : 'I have pain / injury',
              )
            }
            className="chip"
          >
            {lang === 'es' ? 'Tengo lesión/dolor' : 'Pain/injury'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function buildRoutineSummary(result, lang) {
  const count = result.exercises.length;
  const requested = result.requestedCount;

  if (lang === 'es') {
    if (requested && count < requested) {
      return `Listo. Encontré ${count} ejercicios válidos de ${requested} solicitados. No rellené con ejercicios que rompen tus filtros.`;
    }

    if (result.conditionKeys?.length > 0) {
      return `Listo. Armé una rutina de ${count} ejercicios ajustada por seguridad.`;
    }

    return `Listo. Armé una rutina de ${count} ejercicios.`;
  }

  if (requested && count < requested) {
    return `Done. Found ${count} valid exercises out of ${requested} requested. I did not fill the routine with exercises that violate your filters.`;
  }

  if (result.conditionKeys?.length > 0) {
    return `Done. Built a ${count}-exercise routine with safety adjustments.`;
  }

  return `Done. Built a routine with ${count} exercises.`;
}

function formatRequestSummary(v, t) {
  const muscles = Array.isArray(v.muscles) ? v.muscles : [v.muscle || 'full_body'];
  const equipment = Array.isArray(v.equipment) ? v.equipment : [v.equipment || 'any'];

  const parts = [
    t.form.goals[v.goal] || v.goal,
    muscles.map((m) => t.form.muscles[m] || m).join(' + '),
    equipment.map((e) => t.form.equipments[e] || e).join(' + '),
    v.exerciseCount ? `${v.exerciseCount} ejercicios` : `${v.time}${t.common.minutes}`,
    t.form.levels[v.level] || v.level,
  ];

  if (v.condition) parts.push(`(${v.condition})`);

  return parts.join(' · ');
}
