import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearToken, isLoggedIn } from '../lib/auth';
import { toggleTheme, getTheme } from '../lib/theme';
import { cn } from '../lib/cn';
import { toastSuccess } from '../lib/toast';

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        'rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-primary/10',
        active ? 'text-primary' : 'text-slate-700 dark:text-slate-200'
      )}
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme());

  function logout() {
    clearToken();
    toastSuccess('Logged out');
    navigate('/auth?mode=login');
  }

  function onThemeClick() {
    const next = toggleTheme();
    setTheme(next);
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-display text-xl sm:text-2xl font-bold tracking-tight">
            <span className="text-primary">Note</span>
            <span className="text-slate-900 dark:text-slate-50">Flow</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/">Home</NavLink>
            {loggedIn ? (
              <>
                <NavLink to="/upload">Upload</NavLink>
                <NavLink to="/profile">Profile</NavLink>
              </>
            ) : null}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={onThemeClick}
              className="rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-card/60 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80"
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            {loggedIn ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-95"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/auth?mode=login"
                className="rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-medium text-white shadow-soft hover:opacity-95"
              >
                Login
              </Link>
            )}
          </div>

          <button
            type="button"
            className="md:hidden rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-card/60 px-3 py-2 text-sm font-medium"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            Menu
          </button>
        </div>

        {open ? (
          <div className="md:hidden border-t border-white/20 dark:border-white/10 px-4 py-3">
            <div className="flex flex-col gap-2">
              <Link to="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/10">
                Home
              </Link>
              {loggedIn ? (
                <>
                  <Link to="/upload" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/10">
                    Upload
                  </Link>
                  <Link to="/profile" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/10">
                    Profile
                  </Link>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  onThemeClick();
                  setOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-primary/10"
              >
                Toggle Theme
              </button>
              {loggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-white bg-slate-900"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/auth?mode=login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary/80"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
