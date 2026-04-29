import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { LanguageToggle } from './LanguageToggle.jsx';
import { useDisclaimer } from '../hooks/useDisclaimer.jsx';

const NAV_ITEMS = [
  { to: '/', key: 'chat', icon: ChatIcon },
  { to: '/saved', key: 'saved', icon: BookmarkIcon },
  { to: '/progress', key: 'progress', icon: ChartIcon },
  { to: '/account', key: 'account', icon: UserIcon },
];

export function Layout() {
  const { t } = useLanguage();
  const { open } = useDisclaimer();
  const loc = useLocation();
  const navigate = useNavigate();

  function resetChatFromLogo() {
    navigate('/');
    window.dispatchEvent(new Event('vigorix:reset-chat'));
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-ink-950/80 px-5 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={resetChatFromLogo}
          className="flex items-center gap-2"
          aria-label="Reset chat"
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

      <nav className="safe-bottom fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-3 pb-2 pt-1">
        <div className="flex items-center justify-around rounded-3xl border border-white/10 bg-ink-900/85 px-2 py-1.5 shadow-2xl backdrop-blur-xl">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 font-display text-[10px] uppercase tracking-wider transition-all ${
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

function ChatIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.9-4.6A8 8 0 1 1 21 12z" strokeLinecap="round" strokeLinejoin="round" />
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
