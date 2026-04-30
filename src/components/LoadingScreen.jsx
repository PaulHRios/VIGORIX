// src/components/LoadingScreen.jsx
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';

/**
 * Animated loading screen shown while a routine is generated.
 * Rotates through 3-4 thinking phrases over ~1 second.
 */
export function LoadingScreen({ duration = 1100 }) {
  const { t } = useLanguage();
  const phrases = [
    t.loading.analyzing,
    t.loading.filtering,
    t.loading.balancing,
    t.loading.avoidingJunk,
    t.loading.finalizing,
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const step = Math.max(160, Math.floor(duration / phrases.length));
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, step);
    return () => clearInterval(id);
  }, [duration, phrases.length]);

  return (
    <div className="grid place-items-center px-6 py-24 text-center animate-fade-in">
      <div className="relative grid h-24 w-24 place-items-center">
        <span className="absolute h-full w-full animate-ping rounded-full bg-neon-500/30" />
        <span className="absolute h-3/4 w-3/4 animate-pulse rounded-full bg-neon-500/40" />
        <svg viewBox="0 0 24 24" className="relative h-10 w-10 text-neon-300" fill="currentColor" aria-hidden>
          <path d="M5 8h2v8H5V8zm12 0h2v8h-2V8zM8 11h8v2H8v-2z" />
        </svg>
      </div>

      <div className="mt-8 min-h-[3rem]">
        {phrases.map((p, i) => (
          <p
            key={p}
            className={`heading-display text-base text-neutral-200 transition-all duration-300 ${
              i === index
                ? 'translate-y-0 opacity-100'
                : '-translate-y-2 absolute opacity-0'
            }`}
            style={i === index ? {} : { transform: 'translateY(-8px)' }}
          >
            {p}
          </p>
        ))}
      </div>

      <div className="mt-6 flex gap-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400 [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400 [animation-delay:240ms]" />
      </div>
    </div>
  );
}
