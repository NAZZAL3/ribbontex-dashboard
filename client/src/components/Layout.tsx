import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, PlusCircle, LogOut, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LanguageToggle } from './LanguageToggle';
import { BrandLogo } from './BrandLogo';

export function Layout() {
  const { t } = useTranslation();
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/new-order', icon: PlusCircle, label: t('nav.newOrder') },
    { to: '/store', icon: Store, label: t('nav.store') },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-brown-border bg-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <BrandLogo className="h-11 w-auto" />

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <span className="hidden text-sm text-brown-muted sm:inline">{username}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-brown transition hover:bg-cream-dark"
            >
              <LogOut className="h-4 w-4 flip-rtl" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brown text-cream'
                    : 'text-brown-muted hover:bg-cream-dark hover:text-brown'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
