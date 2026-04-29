import { useLanguage } from '../hooks/useLanguage.jsx';
import { CONDITIONS } from '../data/conditions.js';

export function WarningBanner({ conditionKeys = [] }) {
  const { t, lang } = useLanguage();
  if (!conditionKeys.length) return null;

  const labels = conditionKeys
    .map((k) => CONDITIONS[k]?.label?.[lang] || k)
    .join(' · ');

  return (
    <div
      role="alert"
      className="mb-4 overflow-hidden rounded-3xl border border-warn-amber/30 bg-gradient-to-br from-warn-amber/10 via-warn-amber/5 to-transparent p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          aria-hidden
          className="grid h-7 w-7 place-items-center rounded-full bg-warn-amber/20 text-warn-amber"
        >
          ⚠
        </span>
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-warn-amber">
          {t.safety.bannerTitle}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-neutral-200">{t.safety.bannerBody}</p>
      {labels && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {conditionKeys.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-full border border-warn-amber/30 bg-warn-amber/10 px-2.5 py-0.5 text-[11px] font-medium text-warn-amber"
            >
              {CONDITIONS[k]?.label?.[lang] || k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
