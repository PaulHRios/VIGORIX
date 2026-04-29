import { useLanguage } from '../hooks/useLanguage.jsx';

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-[11px] font-display">
      {['en', 'es'].map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`rounded-full px-3 py-1 uppercase tracking-wider transition-all ${
            lang === code ? 'bg-neon-500 text-ink-950 shadow-glow' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          aria-pressed={lang === code}
          aria-label={code === 'en' ? 'English' : 'Español'}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
