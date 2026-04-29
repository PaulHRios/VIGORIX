import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import {
  listLogs,
  listBodyMetrics,
  addBodyMetric,
} from '../services/storageService.js';

export function ProgressPage() {
  const { t, lang } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [body, setBody] = useState([]);
  const [bw, setBw] = useState('');
  const [bwUnit, setBwUnit] = useState('kg');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [l, b] = await Promise.all([listLogs(50), listBodyMetrics(60)]);
      setLogs(l);
      setBody(b);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function logBw() {
    if (!bw || isNaN(Number(bw))) return;
    await addBodyMetric({ weight: Number(bw), unit: bwUnit });
    setBw('');
    refresh();
  }

  return (
    <div className="space-y-5 px-4 pt-4">
      <h1 className="heading-display text-2xl">{t.progress.title}</h1>

      {/* Body weight */}
      <section className="card p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-sm uppercase tracking-[0.2em] text-neutral-400">
            {t.progress.bodyWeight}
          </h2>
          {body[0] && (
            <span className="font-mono text-sm text-neon-300">
              {body[0].weight} {body[0].unit}
            </span>
          )}
        </div>

        <Sparkline points={body.slice(0, 30).map((b) => b.weight).reverse()} />

        <div className="mt-3 flex gap-2">
          <input
            inputMode="decimal"
            value={bw}
            onChange={(e) => setBw(e.target.value)}
            placeholder="0.0"
            className="input py-2 text-sm"
          />
          <select
            value={bwUnit}
            onChange={(e) => setBwUnit(e.target.value)}
            className="input w-24 py-2 text-sm"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
          <button onClick={logBw} className="btn-primary px-4 py-2 text-sm">
            +
          </button>
        </div>
      </section>

      {/* Recent logs */}
      <section className="card p-4">
        <h2 className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-neutral-400">
          {t.progress.recentLogs}
        </h2>

        {loading ? (
          <div className="text-sm text-neutral-500">{t.common.loading}</div>
        ) : logs.length === 0 ? (
          <div className="py-4 text-sm text-neutral-500">{t.progress.empty}</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm text-neutral-100">{log.exercise_name}</div>
                  <div className="font-mono text-[11px] text-neutral-500">
                    {new Date(log.logged_at).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="ml-3 text-right">
                  <div className="font-mono text-sm tabular-nums text-neon-300">
                    {log.weight ? `${log.weight}${log.unit || 'kg'}` : '—'}
                    {log.reps ? ` × ${log.reps}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Sparkline({ points }) {
  if (!points || points.length < 2) {
    return <div className="h-16 rounded-xl bg-white/[0.02]" />;
  }
  const w = 320;
  const h = 64;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const path = points
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1fe87a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1fe87a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#spark)" />
      <path d={path} fill="none" stroke="#1fe87a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
