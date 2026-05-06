import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import {
  listLogs,
  listBodyMetrics,
  addBodyMetric,
} from '../services/storageService.js';
import {
  getProfile,
  computeBmi,
  computeBodyFat,
  idealWeightRange,
  toKg,
} from '../services/userProfile.js';

function formatDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const BMI_CATEGORY_LABEL = {
  en: {
    under: 'Underweight',
    normal: 'Healthy',
    over: 'Overweight',
    obese1: 'Obese I',
    obese2: 'Obese II',
    obese3: 'Obese III',
  },
  es: {
    under: 'Bajo peso',
    normal: 'Saludable',
    over: 'Sobrepeso',
    obese1: 'Obesidad I',
    obese2: 'Obesidad II',
    obese3: 'Obesidad III',
  },
};

const BMI_CATEGORY_TONE = {
  under: 'text-warn-amber',
  normal: 'text-neon-300',
  over: 'text-warn-amber',
  obese1: 'text-warn-red',
  obese2: 'text-warn-red',
  obese3: 'text-warn-red',
};

export function ProgressPage() {
  const { t, lang } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [body, setBody] = useState([]);
  const [bw, setBw] = useState('');
  const [bwUnit, setBwUnit] = useState('kg');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [profile, setProfile] = useState(() => getProfile());

  async function refresh() {
    setLoading(true);
    try {
      const [l, b] = await Promise.all([listLogs(200), listBodyMetrics(60)]);
      setLogs(l);
      setBody(b);
      setProfile(getProfile());
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

  // Latest body weight in kg (for BMI calc).
  const latestKg = useMemo(() => {
    const latest = body[0];
    if (!latest) return null;
    return toKg(latest.weight, latest.unit || 'kg');
  }, [body]);

  const bmiInfo = useMemo(() => {
    if (!latestKg || !profile?.height) return null;
    const r = computeBmi(latestKg, profile.height);
    if (!r) return null;
    const bf = computeBodyFat({ bmi: r.bmi, age: profile.age, sex: profile.sex });
    const ideal = idealWeightRange(profile.height);
    return { ...r, bf, ideal };
  }, [latestKg, profile]);

  // Filter logs by exercise name
  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((l) =>
      String(l.exercise_name || '').toLowerCase().includes(q),
    );
  }, [logs, search]);

  // Group by exercise → most recent weight per exercise (for the search panel).
  const lastByExercise = useMemo(() => {
    if (!search.trim()) return null;
    const map = new Map();
    for (const log of filteredLogs) {
      const key = log.exercise_id || log.exercise_name;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(log);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      name: items[0].exercise_name,
      latest: items[0],
      history: items.slice(0, 6),
    }));
  }, [filteredLogs, search]);

  return (
    <div className="space-y-5 px-4 pt-4">
      <h1 className="heading-display text-2xl">{t.progress.title}</h1>

      {/* Body weight + BMI */}
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

        {body[0] && (
          <div className="mt-1 text-right font-mono text-[11px] text-neutral-500">
            {formatDate(body[0].measured_at, lang)}
          </div>
        )}

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

        {bmiInfo && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric
              label={t.progress.bmi}
              value={bmiInfo.bmi.toFixed(1)}
              hint={BMI_CATEGORY_LABEL[lang][bmiInfo.category]}
              tone={BMI_CATEGORY_TONE[bmiInfo.category]}
            />
            <Metric
              label={t.progress.bodyFat}
              value={bmiInfo.bf != null ? `${bmiInfo.bf.toFixed(1)}%` : '—'}
              hint={lang === 'es' ? 'estimación' : 'estimate'}
            />
            {bmiInfo.ideal && (
              <Metric
                className="col-span-2"
                label={t.progress.idealRange}
                value={`${bmiInfo.ideal.min} – ${bmiInfo.ideal.max} kg`}
                hint={`${lang === 'es' ? 'Para tu altura' : 'For your height'} (${profile.height} cm)`}
              />
            )}
          </div>
        )}

        {!bmiInfo && body[0] && !profile?.height && (
          <p className="mt-3 rounded-2xl border border-warn-amber/30 bg-warn-amber/10 p-3 text-xs text-warn-amber">
            {t.progress.needHeightForBmi}
          </p>
        )}

        {body.length > 1 && (
          <details className="mt-3">
            <summary className="cursor-pointer font-display text-[11px] uppercase tracking-wider text-neutral-500">
              {t.progress.bodyWeightHistory} ({body.length})
            </summary>
            <ul className="mt-2 divide-y divide-white/5">
              {body.slice(0, 30).map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-mono text-[11px] text-neutral-500">
                    {formatDate(b.measured_at, lang)}
                  </span>
                  <span className="font-mono text-neon-300">
                    {b.weight} {b.unit}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Recent logs + search */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-[0.2em] text-neutral-400">
            {t.progress.recentLogs}
          </h2>
          <span className="font-mono text-[11px] text-neutral-500">{logs.length}</span>
        </div>

        <div className="mb-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.progress.searchPlaceholder}
              className="input py-2 pl-8 text-sm"
            />
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-xs text-neutral-400 hover:text-neutral-200"
              >
                ×
              </button>
            )}
          </div>
          {search && lastByExercise && (
            <p className="mt-1 text-[11px] text-neutral-500">
              {lastByExercise.length} {t.progress.matches}
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-sm text-neutral-500">{t.common.loading}</div>
        ) : logs.length === 0 ? (
          <div className="py-4 text-sm text-neutral-500">{t.progress.empty}</div>
        ) : search && lastByExercise ? (
          // Grouped view: when searching show "last weight" summary per exercise.
          lastByExercise.length === 0 ? (
            <div className="py-4 text-sm text-neutral-500">{t.progress.noMatches}</div>
          ) : (
            <ul className="space-y-3">
              {lastByExercise.map((g) => (
                <li key={g.key} className="rounded-2xl border border-white/5 bg-ink-800/30 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm text-neutral-100">{g.name}</span>
                    <span className="font-mono text-sm text-neon-300">
                      {g.latest.weight ? `${g.latest.weight}${g.latest.unit || 'kg'}` : '—'}
                      {g.latest.reps ? ` × ${g.latest.reps}` : ''}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>{t.progress.lastTime}</span>
                    <span className="font-mono">{formatDate(g.latest.logged_at, lang)}</span>
                  </div>
                  {g.history.length > 1 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-display text-[10px] uppercase tracking-wider text-neutral-500">
                        {t.progress.fullHistory} ({g.history.length})
                      </summary>
                      <ul className="mt-1 divide-y divide-white/5">
                        {g.history.map((h) => (
                          <li
                            key={h.id}
                            className="flex items-center justify-between py-1.5 text-[12px]"
                          >
                            <span className="font-mono text-[10px] text-neutral-500">
                              {formatDate(h.logged_at, lang)}
                            </span>
                            <span className="font-mono text-neon-300">
                              {h.weight ? `${h.weight}${h.unit || 'kg'}` : '—'}
                              {h.reps ? ` × ${h.reps}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : (
          <ul className="divide-y divide-white/5">
            {filteredLogs.slice(0, 50).map((log) => (
              <li key={log.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm text-neutral-100">{log.exercise_name}</div>
                  <div className="font-mono text-[11px] text-neutral-500">
                    {formatDate(log.logged_at, lang)}
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

function Metric({ label, value, hint, tone, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-ink-800/40 p-3 ${className}`}>
      <div className="font-display text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </div>
      <div className={`mt-0.5 font-display text-xl font-semibold tabular-nums ${tone || 'text-neon-300'}`}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-neutral-500">{hint}</div>}
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
      <path
        d={path}
        fill="none"
        stroke="#1fe87a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
