// src/components/Layout.jsx
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { LanguageToggle } from './LanguageToggle.jsx';
import { useDisclaimer } from '../hooks/useDisclaimer.jsx';

const NAV_ITEMS = [
  { to: '/builder', key: 'builder', icon: BuilderIcon },
  { to: '/experts', key: 'experts', icon: ExpertsIcon },
  { to: '/diet', key: 'diet', icon: DietIcon },
  { to: '/progress', key: 'progress', icon: ChartIcon },
  { to: '/saved', key: 'saved', icon: BookmarkIcon },
  { to: '/account', key: 'account', icon: UserIcon },
];

export function Layout() {
  const { t } = useLanguage();
  const { open } = useDisclaimer();
  const loc = useLocation();
  const navigate = useNavigate();

  function handleLogo() {
    navigate('/builder');
    window.dispatchEvent(new Event('vigorix:reset-builder'));
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-ink-950/80 px-5 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={handleLogo}
          className="flex items-center gap-2"
          aria-label="Reset builder"
        >
          <Logo />
          <span className="font-display text-lg font-semibold tracking-tight">
            {t.appName}
            <span className="text-neon-400">.</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={open}
            aria-label={t.disclaimer.revisit}
            className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-400 hover:text-neutral-200"
          >
            i
          </button>
          <LanguageToggle />
        </div>
      </header>

      <main key={loc.pathname} className="flex-1 animate-fade-in pb-28">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-2 pb-2 pt-1">
        <div className="flex items-center justify-around rounded-3xl border border-white/10 bg-ink-900/85 px-1 py-1.5 shadow-2xl backdrop-blur-xl">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 font-display text-[9px] uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-neon-500/15 text-neon-300'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {t.nav[item.key]}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Logo() {
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 place-items-center rounded-xl bg-neon-500/15 text-neon-400 shadow-glow"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M5 8h2v8H5V8zm12 0h2v8h-2V8zM8 11h8v2H8v-2z" />
      </svg>
    </span>
  );
}

function BuilderIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 8h2v8H5V8zm12 0h2v8h-2V8zM8 11h8v2H8v-2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BookmarkIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4h12v17l-6-4-6 4V4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChartIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10m6 10V4m6 16v-7m6 7V8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
    </svg>
  );
}

function ExpertsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DietIcon({ className }) {
  // Fork & knife — utensils.
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v6" />
      <path d="M5 3v5a3 3 0 0 0 3 3v10" />
      <path d="M11 3v5a3 3 0 0 1-3 3" />
      <path d="M16 3c-1.2 1-2 3-2 5 0 2 1 3 2 3v10" />
    </svg>
  );
}
