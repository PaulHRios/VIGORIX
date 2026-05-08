// src/pages/ImportPage.jsx
//
// Receives a shared routine via #/import?d=<base64url>. Decodes the payload,
// shows a preview, and lets the user save it to their library.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { decodeRoutine } from '../utils/shareCodec.js';
import { saveRoutine } from '../services/storageService.js';

function readDFromHash() {
  // Hash router gives us "#/import?d=…". URL.searchParams works on a real URL,
  // so we synthesize one.
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const q = hash.split('?')[1] || '';
  const params = new URLSearchParams(q);
  return params.get('d');
}

export function ImportPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);

  const data = useMemo(() => {
    try {
      return decodeRoutine(readDFromHash());
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!data) setErr('decode');
  }, [data]);

  async function handleSave() {
    if (!data?.routine) return;
    try {
      const name = `${t.share.importedPrefix} · ${data.name || ''}`.trim();
      await saveRoutine(name || t.saved.defaultName, data.routine);
      setSaved(true);
      setTimeout(() => navigate('/saved'), 800);
    } catch (e) {
      setErr(e?.message || 'save failed');
    }
  }

  if (err === 'decode') {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-ink-950 px-6 text-center text-neutral-400">
        <div>
          <div className="mb-2 text-3xl">⚠</div>
          <p>{t.share.invalidLink}</p>
          <button onClick={() => navigate('/builder')} className="btn-ghost mt-4">
            {t.common.back}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-ink-950 text-neutral-400">
        {t.common.loading}
      </div>
    );
  }

  const exCount = Array.isArray(data.routine?.exercises)
    ? data.routine.exercises.length
    : Array.isArray(data.routine?.days)
      ? data.routine.days.reduce(
          (s, d) => s + (d.routine?.exercises?.length || d.exercises?.length || 0),
          0,
        )
      : 0;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-8 pt-6">
      <button
        onClick={() => navigate('/builder')}
        className="self-start text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← {t.common.back}
      </button>
      <h1 className="heading-display mt-2 text-2xl">{t.share.importTitle}</h1>
      <p className="mt-1 text-sm text-neutral-400">{t.share.importSub}</p>

      <div className="card mt-4 space-y-2 p-4">
        <div className="font-display text-xs uppercase tracking-wider text-neon-400">
          {data.name || t.saved.defaultName}
        </div>
        <div className="font-mono text-[11px] text-neutral-500">
          {exCount} {t.common.sets.replace('series', 'ejercicios').replace('sets', 'exercises') /* heuristic */}
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary mt-4">
        {saved ? `✓ ${t.common.saved}` : t.share.importSave}
      </button>
    </div>
  );
}
