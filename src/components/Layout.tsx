import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Home, Info, Library, ListChecks, Menu, Scale, Search, Clock, WifiOff } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Toast } from '@/components/Toast';
import { useOnline } from '@/lib/hooks';
import { useUi, type FontSize, type Theme } from '@/store/ui';
import { OFFICIAL_INDEX_URL } from '@/config';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', key: 'home', Icon: Home, end: true },
  { to: '/documents', key: 'documents', Icon: Library, end: false },
  { to: '/claims', key: 'claims', Icon: ListChecks, end: false },
  { to: '/search', key: 'search', Icon: Search, end: false },
] as const;

const secondary = [
  { to: '/timeline', key: 'timeline', Icon: Clock },
  { to: '/glossary', key: 'glossary', Icon: BookOpen },
  { to: '/hermeneutics', key: 'hermeneutics', Icon: Scale },
  { to: '/about', key: 'about', Icon: Info },
] as const;

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="mb-4">
      <legend className="label-eyebrow mb-2">{label}</legend>
      <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg border border-line bg-card p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-h-[40px] rounded-md px-2 text-sm',
              value === o.value ? 'bg-accent text-accent-fg' : 'hover:bg-surface',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function SettingsPanel() {
  const { t } = useTranslation();
  const { lang, setLang, theme, setTheme, fontSize, setFontSize } = useUi();
  return (
    <div>
      <Segmented
        label={t('settings.language')}
        value={lang}
        onChange={setLang}
        options={[
          { value: 'nl', label: 'Nederlands' },
          { value: 'en', label: 'English' },
        ]}
      />
      <Segmented<Theme>
        label={t('settings.theme')}
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'system', label: t('settings.system') },
          { value: 'light', label: t('settings.light') },
          { value: 'dark', label: t('settings.dark') },
        ]}
      />
      <Segmented<FontSize>
        label={t('settings.fontSize')}
        value={fontSize}
        onChange={setFontSize}
        options={[
          { value: 'sm', label: 'A' },
          { value: 'md', label: 'A+' },
          { value: 'lg', label: 'A++' },
        ]}
      />
    </div>
  );
}

export function Layout() {
  const { t } = useTranslation();
  const online = useOnline();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the menu and reset scroll on navigation (hash links scroll themselves).
  useEffect(() => {
    setMenuOpen(false);
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-card focus:px-3 focus:py-2">
        {t('app.skip')}
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-bg/80">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-2 px-3">
          <Link to="/" className="flex min-w-0 items-center gap-2 rounded-md py-1">
            <img src="/favicon.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
            <span className="min-w-0">
              <span className="block font-serif text-lg font-semibold leading-none">{t('app.name')}</span>
              <span className="block truncate text-[0.7rem] leading-tight text-muted">{t('app.tagline')}</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            {!online && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2 py-1 text-xs text-muted"
                title={t('app.offlineHint')}
                role="status"
              >
                <WifiOff className="h-3.5 w-3.5" aria-hidden />
                {t('app.offline')}
              </span>
            )}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('app.menu')}>
                  <Menu className="h-5 w-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" title={t('app.menu')} closeLabel={t('app.close')}>
                <nav aria-label={t('app.menu')} className="mb-6">
                  <ul className="space-y-1">
                    {secondary.map(({ to, key, Icon }) => (
                      <li key={to}>
                        <NavLink
                          to={to}
                          className={({ isActive }) =>
                            cn('flex min-h-[44px] items-center gap-3 rounded-md px-3', isActive ? 'bg-surface font-semibold text-accent' : 'hover:bg-surface')
                          }
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                          {t(`nav.${key}`)}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>
                <SettingsPanel />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 px-4 pb-8 pt-5 outline-none">
        <Outlet />
      </main>

      <footer className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 text-xs text-muted">
        <p className="border-t border-line pt-4">
          {t('footer.disclaimer')}{' '}
          <a href={OFFICIAL_INDEX_URL} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
            {t('footer.official')}
          </a>
        </p>
      </footer>

      <nav aria-label={t('nav.primary')} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-safe backdrop-blur supports-[backdrop-filter]:bg-bg/85">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {tabs.map(({ to, key, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[0.72rem]',
                    isActive ? 'font-semibold text-accent' : 'text-muted hover:text-fg',
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
                {t(`nav.${key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <InstallPrompt />
      <Toast />
    </div>
  );
}
