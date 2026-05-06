// src/pages/SavedPage.jsx
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { listRoutines, deleteRoutine } from '../services/storageService.js';
import { ExerciseCard } from '../components/ExerciseCard.jsx';
import { WarningBanner } from '../components/WarningBanner.jsx';
import { exportRoutinePdf } from '../utils/pdfExport.js';

export function SavedPage() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const list = await listRoutines();
      setItems(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id) {
    if (!confirm(t.common.confirm + '?')) return;
    await deleteRoutine(id);
    refresh();
  }

  // ---- DETAIL VIEW ----
  if (open) {
    const r = open.routine;
    const isWeekly = r?.type === 'weekly';
    const isExpertSingle = r?.type === 'expert_single';
    const isExpertWeekly = r?.type === 'expert_weekly';
    const isDiet = r?.type === 'diet_plan';

    return (
      <div className="space-y-3 px-4 pt-4">
        <button onClick={() => setOpen(null)} className="text-sm text-neutral-400">
          ← {t.common.back}
        </button>
        <h2 className="heading-display text-2xl">{open.name}</h2>

        {isExpertSingle && <ExpertSinglePreview routine={r} lang={lang} t={t} />}
        {isExpertWeekly && <ExpertWeeklyPreview routine={r} lang={lang} t={t} />}
        {isDiet && <DietPreview plan={r} lang={lang} t={t} />}

        {!isExpertSingle && !isExpertWeekly && !isDiet && (
          <>
            <WarningBanner conditionKeys={r.conditionKeys} />
            {isWeekly ? (
              r.days.map((day, dayIndex) => (
                <details key={day.id} className="card overflow-hidden" open={dayIndex === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
                    <div className="heading-display text-sm">
                      {t.weekly.day} {dayIndex + 1} · {day.label[lang]}
                    </div>
                    <span className="text-neon-400">▾</span>
                  </summary>
                  <div className="space-y-3 border-t border-white/5 px-3 py-4">
                    {day.routine?.exercises?.map((ex, i) => (
                      <ExerciseCard
                        key={`${day.id}_${ex.id}_${i}`}
                        exercise={ex}
                        index={i}
                        routine={day.routine}
                      />
                    )) || <p className="text-sm text-neutral-500">{t.weekly.rest}</p>}
                  </div>
                </details>
              ))
            ) : (
              <>
                {r.exercises.map((ex, i) => (
                  <ExerciseCard key={ex.id + '_' + i} exercise={ex} index={i} routine={r} />
                ))}
                <button
                  onClick={() => exportRoutinePdf(r, lang, open.name)}
                  className="btn-ghost w-full"
                >
                  {t.common.export}
                </button>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // ---- LIST VIEW ----
  return (
    <div className="space-y-3 px-4 pt-4">
      <h1 className="heading-display text-2xl">{t.saved.title}</h1>

      {loading && <div className="text-sm text-neutral-500">{t.common.loading}</div>}

      {!loading && items.length === 0 && (
        <div className="card p-6 text-sm leading-relaxed text-neutral-400">{t.saved.empty}</div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const r = item.routine;
          const isWeekly = r?.type === 'weekly';
          const isExpertWeekly = r?.type === 'expert_weekly';
          const isDiet = r?.type === 'diet_plan';
          let count = 0;
          if (isWeekly) count = r.days?.reduce((sum, d) => sum + (d.routine?.exercises?.length || 0), 0) || 0;
          else if (isExpertWeekly) count = r.days?.reduce((sum, d) => sum + (d.exercises?.length || 0), 0) || 0;
          else if (isDiet) count = r.days?.length || 0;
          else count = r.exercises?.length || 0;

          return (
            <div
              key={item.id}
              className="card flex w-full items-center justify-between gap-3 p-4 text-left transition-colors"
            >
              <button
                onClick={() => setOpen(item)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="heading-display truncate text-base">{item.name}</span>
                  {isWeekly && (
                    <span className="rounded-full bg-neon-500/10 px-2 py-0.5 text-[10px] font-display uppercase tracking-wider text-neon-300">
                      {r.daysPerWeek}d
                    </span>
                  )}
                  {isExpertWeekly && (
                    <span className="rounded-full bg-neon-500/10 px-2 py-0.5 text-[10px] font-display uppercase tracking-wider text-neon-300">
                      {r.days.length}d
                    </span>
                  )}
                  {isDiet && (
                    <span className="rounded-full bg-warn-amber/15 px-2 py-0.5 text-[10px] font-display uppercase tracking-wider text-warn-amber">
                      {t.diet.protein.toUpperCase?.() || 'DIET'}
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-neutral-500">
                  {count} · {new Date(item.createdAt).toLocaleDateString(
                    lang === 'es' ? 'es-ES' : 'en-US',
                  )}
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className="rounded-full border border-warn-red/30 px-2 py-1 text-[10px] uppercase tracking-wider text-warn-red hover:bg-warn-red/10"
              >
                {t.common.delete}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExpertSinglePreview({ routine, lang, t }) {
  return (
    <>
      <div className="card p-4">
        <div className="text-[11px] uppercase tracking-wider text-neon-400">{routine.author}</div>
        <p className="mt-1 text-sm text-neutral-300">
          {routine.summary?.[lang] || routine.summary?.en}
        </p>
      </div>
      {routine.exercises.map((ex, i) => (
        <div key={i} className="card p-3">
          <div className="text-sm text-neutral-100">{ex.name?.[lang] || ex.name?.en}</div>
          <div className="mt-1 font-mono text-[11px] text-neutral-400">
            {ex.sets} × {ex.reps} · {ex.rest}s {t.common.rest}
          </div>
          {(ex.note?.[lang] || ex.note?.en) && (
            <div className="mt-1 text-[11px] text-neutral-500">
              💡 {ex.note?.[lang] || ex.note?.en}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function ExpertWeeklyPreview({ routine, lang, t }) {
  return (
    <>
      <div className="card p-4">
        <div className="text-[11px] uppercase tracking-wider text-neon-400">{routine.author}</div>
        <p className="mt-1 text-sm text-neutral-300">
          {routine.summary?.[lang] || routine.summary?.en}
        </p>
      </div>
      {routine.days.map((day, di) => (
        <details key={di} className="card overflow-hidden" open={di === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
            <div className="heading-display text-sm">
              {t.weekly.day} {di + 1} · {day.label?.[lang] || day.label?.en}
            </div>
            <span className="text-neon-400">▾</span>
          </summary>
          <div className="space-y-2 border-t border-white/5 px-3 py-3">
            {day.exercises.map((ex, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-ink-900/40 p-2.5">
                <div className="text-sm text-neutral-100">{ex.name?.[lang] || ex.name?.en}</div>
                <div className="mt-1 font-mono text-[11px] text-neutral-400">
                  {ex.sets} × {ex.reps} {ex.rest > 0 ? `· ${ex.rest}s ${t.common.rest}` : ''}
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </>
  );
}

function DietPreview({ plan, lang, t }) {
  const dayLabels = {
    en: { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' },
    es: { mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo' },
  };
  return (
    <>
      <div className="card p-4">
        <div className="text-[11px] uppercase tracking-wider text-neon-400">
          {t.onboarding.goals[plan.goal] || plan.goal} · {plan.targets?.kcal} kcal
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-neutral-400">
          <div>P <span className="font-mono text-neon-300">{plan.macros?.protein}g</span></div>
          <div>C <span className="font-mono">{plan.macros?.carbs}g</span></div>
          <div>F <span className="font-mono">{plan.macros?.fat}g</span></div>
        </div>
      </div>
      {plan.days.map((day, di) => (
        <details key={di} className="card overflow-hidden" open={di === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
            <div className="heading-display text-sm">{dayLabels[lang][day.dayKey]}</div>
            <span className="font-mono text-[11px] text-neutral-500">
              {day.totals.kcal} kcal
            </span>
          </summary>
          <div className="space-y-2 border-t border-white/5 px-3 py-3">
            {day.meals.map((m, mi) => (
              <div key={mi} className="rounded-xl border border-white/5 bg-ink-900/40 p-2.5">
                <div className="text-sm text-neutral-100">{m.name?.[lang] || m.name?.en}</div>
                <div className="mt-1 font-mono text-[11px] text-neutral-400">
                  {m.kcal} kcal · {m.protein}g P · {m.carbs}g C · {m.fat}g F
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </>
  );
}
