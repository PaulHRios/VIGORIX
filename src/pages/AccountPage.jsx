import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { exportLocalData, importLocalData } from '../services/storageService.js';

export function AccountPage() {
  const { t } = useLanguage();
  const { user, isEnabled, signIn, signUp, signOut, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    setErr('');
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password);
    } catch (e) {
      setErr(e?.message || t.auth.err.generic);
    } finally {
      setBusy(false);
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(exportLocalData(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymai-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importLocalData(JSON.parse(reader.result));
        alert('OK');
      } catch (err) {
        alert(err.message || 'Import failed');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-5 px-4 pt-4">
      <h1 className="heading-display text-2xl">{t.auth.title}</h1>
      <p className="text-sm leading-relaxed text-neutral-400">{t.auth.sub}</p>

      {!isEnabled && (
        <div className="card border-warn-amber/20 bg-warn-amber/5 p-4 text-sm text-warn-amber">
          {t.auth.noSupabase}
        </div>
      )}

      {isEnabled && user && (
        <div className="card space-y-2 p-4">
          <div className="font-display text-xs uppercase tracking-wider text-neutral-400">
            {t.auth.signedInAs}
          </div>
          <div className="font-mono text-sm text-neon-300">{user.email}</div>
          <button onClick={signOut} className="btn-ghost mt-2 w-full">
            {t.auth.signOut}
          </button>
        </div>
      )}

      {isEnabled && !user && !loading && (
        <div className="card space-y-3 p-4">
          <div className="inline-flex rounded-full border border-white/10 p-0.5 text-xs font-display">
            <button
              onClick={() => setMode('signin')}
              className={`rounded-full px-3 py-1 ${
                mode === 'signin' ? 'bg-neon-500 text-ink-950' : 'text-neutral-400'
              }`}
            >
              {t.auth.signIn}
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`rounded-full px-3 py-1 ${
                mode === 'signup' ? 'bg-neon-500 text-ink-950' : 'text-neutral-400'
              }`}
            >
              {t.auth.signUp}
            </button>
          </div>

          <div>
            <label className="label">{t.auth.email}</label>
            <input
              type="email"
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t.auth.password}</label>
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {err && <div className="text-sm text-warn-red">{err}</div>}

          <button onClick={submit} disabled={busy} className="btn-primary w-full">
            {busy ? t.common.loading : mode === 'signin' ? t.auth.signIn : t.auth.signUp}
          </button>
        </div>
      )}

      {/* Local data export / import — always available */}
      <div className="card space-y-2 p-4">
        <div className="font-display text-xs uppercase tracking-wider text-neutral-400">
          Local data
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-ghost flex-1 text-sm">
            Export JSON
          </button>
          <label className="btn-ghost flex-1 cursor-pointer text-sm">
            Import JSON
            <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
