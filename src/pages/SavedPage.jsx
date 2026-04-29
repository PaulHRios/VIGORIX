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

  if (open) {
    return (
      <div className="space-y-3 px-4 pt-4">
        <button onClick={() => setOpen(null)} className="btn-ghost text-sm">
          ← {t.common.back}
        </button>
        <h2 className="heading-display text-2xl">{open.name}</h2>
        <WarningBanner conditionKeys={open.routine.conditionKeys} />
        {open.routine.exercises.map((ex, i) => (
          <ExerciseCard key={ex.id + '_' + i} exercise={ex} index={i} />
        ))}
        <button
          onClick={() => exportRoutinePdf(open.routine, lang, open.name)}
          className="btn-ghost w-full"
        >
          {t.common.export}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 pt-4">
      <h1 className="heading-display text-2xl">{t.saved.title}</h1>

      {loading && <div className="text-sm text-neutral-500">{t.common.loading}</div>}

      {!loading && items.length === 0 && (
        <div className="card p-6 text-sm leading-relaxed text-neutral-400">{t.saved.empty}</div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setOpen(item)}
            className="card flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-white/[0.04]"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-base font-semibold">{item.name}</div>
              <div className="font-mono text-xs text-neutral-500">
                {item.routine.exercises?.length || 0} ·{' '}
                {new Date(item.createdAt).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US')}
              </div>
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
              className="rounded-full border border-warn-red/30 px-2 py-1 text-[10px] uppercase tracking-wider text-warn-red hover:bg-warn-red/10"
            >
              {t.common.delete}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
