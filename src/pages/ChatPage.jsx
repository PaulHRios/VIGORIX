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
  parseRequestText,
  replaceExerciseInRoutine,
} from '../utils/workoutGenerator.js';
import { saveRoutine } from '../services/storageService.js';
import { exportRoutinePdf } from '../utils/pdfExport.js';

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
  }, [messages, routine]);

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

    const nextField = getNextClarifyingField(combined);

    if (nextField) {
      setDraftRequest(combined);
      setPendingField(nextField);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: buildClarifyingQuestion(combined, lang, nextField),
        },
      ]);

      return;
    }

    setDraftRequest(null);
    setPendingField(null);
    await generateFromRequest(combined, combined.condition || text);
  }

  async function handleGuided(values) {
    setDraftRequest(null);
    setPendingField(null);
    setShowGuided(false);

    const normalizedValues = {
      ...values,
      conditionStatus: values.condition ? 'described' : 'none',
    };

    const summary = formatRequestSummary(normalizedValues, t);
    setMessages((m) => [...m, { role: 'user', text: summary }]);

    await generateFromRequest(normalizedValues, normalizedValues.condition || '');
  }

  async function generateFromRequest(req, conditionText) {
    setBusy(true);

    try {
      await new Promise((r) => setTimeout(r, 350));

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
