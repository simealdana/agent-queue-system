import type { ReactElement, ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { ROUTES } from '../constants/routes';

const NAV_ITEMS = [
  {
    path: ROUTES.HOME ?? '/',
    label: 'Workflows',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

export const Layout = ({ children }: { children: ReactNode }): ReactElement => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar rail — hidden on mobile */}
      <aside className="hidden md:flex w-14 bg-surface-1 border-r border-border flex-col items-center py-4 gap-1.5 shrink-0 sticky top-0 h-screen">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5">
          <span className="text-emerald-400 text-sm font-bold">S</span>
        </div>

        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path || location.pathname === '/';
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                active
                  ? 'bg-surface-3 text-emerald-400'
                  : 'text-gray-600 hover:text-gray-400 hover:bg-surface-2'
              }`}
            >
              {item.icon}
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-11 border-b border-border bg-surface-1/60 backdrop-blur-sm flex items-center px-4 md:px-5 sticky top-0 z-10">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mr-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400 text-xs font-bold">S</span>
            </div>
          </div>

          {location.pathname !== '/' && (
            <Link
              to="/"
              aria-label="Back to workflows"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-emerald-400 hover:bg-surface-2 transition-colors mr-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-emerald-500/60">~</span>
            <span>/</span>
            <span className="text-gray-400">silkchart</span>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400/80">workflows</span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">live</span>
            </span>
            <span className="hidden sm:inline text-gray-700">|</span>
            <span className="hidden sm:inline">ws://localhost:3000</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
