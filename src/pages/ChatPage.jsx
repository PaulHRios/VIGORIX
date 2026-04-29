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
  buildClarifyingQuestion,
  generateRoutine,
  getMissingRequestFields,
  mergeRequestDraft,
  parseRequestText,
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
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text:
          lang === 'es'
            ? '¡Hola! Cuéntame qué tipo de entrenamiento quieres y lo armo. También puedes usar el formulario.'
            : "Hi! Tell me what kind of workout you want and I'll build it. You can also use the guided form.",
      },
    ]);
    setDraftRequest(null);
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
    const combined = draftRequest ? mergeRequestDraft(draftRequest, parsed) : parsed;
    const missing = getMissingRequestFields(combined);

    if (missing.length > 0) {
      const question = buildClarifyingQuestion(combined, lang);

      setDraftRequest(combined);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: question,
        },
      ]);

      return;
    }

    setDraftRequest(null);
    await generateFromRequest(combined, combined.condition || text);
  }

  async function handleGuided(values) {
    setDraftRequest(null);
    setShowGuided(false);

    const summary = formatRequestSummary(values, t);

    setMessages((m) => [...m, { role: 'user', text: summary }]);

    await generateFromRequest(values, values.condition || '');
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

      const summary = buildRoutineSummary(result, lang);

      setMessages((m) => [...m, { role: 'assistant', text: summary }]);
      setSavedName('');
    } finally {
      setBusy(false);
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
              <ExerciseCard key={ex.id + '_' + i} exercise={ex} index={i} />
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
      return `Listo. Encontré ${count} ejercicios válidos de ${requested} solicitados. No rellené con ejercicios que no cumplen tus filtros.`;
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
  const parts = [
    t.form.goals[v.goal] || v.goal,
    t.form.muscles[v.muscle] || v.muscle,
    t.form.equipments[v.equipment] || v.equipment,
    `${v.time}${t.common.minutes}`,
    t.form.levels[v.level] || v.level,
  ];

  if (v.condition) parts.push(`(${v.condition})`);

  return parts.join(' · ');
}
