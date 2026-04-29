import { useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function ChatInput({ value, onChange, onSubmit, onToggleGuided, busy }) {
  const { t } = useLanguage();
  const ref = useRef(null);

  function autosize(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSubmit();
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative flex items-end gap-2 rounded-3xl border border-white/10 bg-ink-900/80 p-2 shadow-xl backdrop-blur-xl">
        <button
          type="button"
          onClick={onToggleGuided}
          aria-label={t.chat.hintPrompt}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-neon-400 hover:bg-white/[0.08]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" />
          </svg>
        </button>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            autosize(e.target);
          }}
          onKeyDown={handleKey}
          placeholder={t.chat.placeholder}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-neutral-100 placeholder-neutral-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => value.trim() && onSubmit()}
          disabled={busy || !value.trim()}
          aria-label={t.chat.generate}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neon-500 text-ink-950 shadow-glow transition-transform hover:bg-neon-400 active:scale-95 disabled:opacity-40"
        >
          {busy ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.2-8.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M2 12 22 3l-7 19-3-9-10-1z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
