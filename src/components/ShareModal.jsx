// src/components/ShareModal.jsx
//
// Modal that lets the user share a routine three ways:
//   1. Tap the URL → copy to clipboard (or fall back to native share sheet)
//   2. Scan the QR code with another phone
//   3. Send via the OS share sheet (when navigator.share is available)

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { buildShareUrl } from '../utils/shareCodec.js';
import { generateQrSvg } from '../utils/qrcode.js';

export function ShareModal({ name, routine, onClose }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => buildShareUrl(name || '', routine), [name, routine]);
  const qrSvg = useMemo(() => {
    try {
      return generateQrSvg(url, { size: 5, quietZone: 2, color: '#0a0f0c', bg: '#1fe87a' });
    } catch (e) {
      return null; // payload too long
    }
  }, [url]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async function handleNative() {
    try {
      if (navigator.share) {
        await navigator.share({ title: name || 'VIGORIX routine', text: t.share.shareText, url });
      } else {
        await handleCopy();
      }
    } catch {
      /* user dismissed */
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-lg">📤 {t.share.share}</h2>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-0.5 text-sm text-neutral-400 hover:text-neutral-100"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-[12px] text-neutral-400">{t.share.modalSub}</p>

        {/* QR */}
        <div className="mt-4 flex justify-center rounded-2xl border border-white/5 bg-ink-950 p-4">
          {qrSvg ? (
            <div
              className="overflow-hidden rounded-xl"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : (
            <p className="text-center text-xs text-neutral-500">{t.share.qrTooLong}</p>
          )}
        </div>

        {/* URL */}
        <div className="mt-3 rounded-2xl border border-white/5 bg-ink-800/40 p-3">
          <div className="mb-1 font-display text-[10px] uppercase tracking-wider text-neutral-500">
            {t.share.linkLabel}
          </div>
          <div
            onClick={handleCopy}
            className="cursor-pointer break-all font-mono text-[11px] leading-relaxed text-neon-300 hover:text-neon-200"
          >
            {url}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={handleCopy} className="btn-ghost flex-1">
            {copied ? `✓ ${t.share.copied}` : `📋 ${t.share.copyLink}`}
          </button>
          <button onClick={handleNative} className="btn-primary flex-1">
            ↗ {t.share.share}
          </button>
        </div>
      </div>
    </div>
  );
}
