import { useLanguage } from '../hooks/useLanguage.jsx';
import { useDisclaimer } from '../hooks/useDisclaimer.jsx';

export function DisclaimerModal() {
  const { t } = useLanguage();
  const { isVisible, accepted, accept, close } = useDisclaimer();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-4 pb-6 pt-10 backdrop-blur-sm sm:items-center">
      <div className="card max-h-[85vh] w-full max-w-md overflow-y-auto p-6 shadow-glow-lg animate-slide-up">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-warn-amber/40 bg-warn-amber/10 px-3 py-1 text-xs font-display uppercase tracking-wider text-warn-amber">
          <span aria-hidden>⚠</span>
          {t.safety.bannerTitle}
        </div>
        <h2 className="heading-display mb-3 text-xl text-white">{t.disclaimer.title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-neutral-300">{t.disclaimer.body}</p>
        <div className="flex items-center justify-end gap-2">
          {accepted ? (
            <button onClick={close} className="btn-ghost">
              {t.common.close}
            </button>
          ) : (
            <button onClick={accept} className="btn-primary w-full">
              {t.disclaimer.ack}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
