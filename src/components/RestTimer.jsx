import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function RestTimer({ seconds = 60 }) {
  const { t } = useLanguage();
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          // gentle vibrate on supported devices
          try {
            navigator.vibrate?.([120, 60, 120]);
          } catch {}
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function start() {
    if (remaining === 0) setRemaining(seconds);
    setRunning(true);
  }
  function pause() {
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setRemaining(seconds);
  }

  const pct = ((seconds - remaining) / seconds) * 100;
  const mm = String(Math.floor(remaining / 60)).padStart(1, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800/40 p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-display text-[11px] uppercase tracking-wider text-neutral-400">
          {t.exercise.timerLabel}
        </span>
        <span className="font-mono text-2xl font-medium text-neon-300 tabular-nums">
          {mm}:{ss}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full bg-neon-500 transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2">
        {!running ? (
          <button onClick={start} className="btn-primary flex-1 py-2 text-sm">
            {t.exercise.startTimer}
          </button>
        ) : (
          <button onClick={pause} className="btn-ghost flex-1 py-2 text-sm">
            ⏸︎ Pause
          </button>
        )}
        <button onClick={reset} className="btn-ghost px-4 py-2 text-sm">
          ↺
        </button>
      </div>
    </div>
  );
}
