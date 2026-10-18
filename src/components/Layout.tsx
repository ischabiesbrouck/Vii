import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Clock,
  GraduationCap,
  Home,
  Info,
  Library,
  ListChecks,
  Menu,
  Monitor,
  Moon,
  Scale,
  Search,
  Sun,
  WifiOff,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Toast } from '@/components/Toast';
import { useOnline } from '@/lib/hooks';
import { useUi, type FontSize, type Theme } from '@/store/ui';
import { OFFICIAL_INDEX_URL, RKDOCUMENTEN_URL } from '@/config';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', key: 'home', Icon: Home, end: true },
  { to: '/subjects', key: 'subjects', Icon: GraduationCap, end: false },
  { to: '/documents', key: 'documents', Icon: Library, end: false },
  { to: '/claims', key: 'claims', Icon: ListChecks, end: false },
  { to: '/search', key: 'search', Icon: Search, end: false },
] as const;

const primary = [
  { to: '/', key: 'home', end: true },
  { to: '/subjects', key: 'subjects', end: false },
  { to: '/documents', key: 'documents', end: false },
  { to: '/claims', key: 'claims', end: false },
  { to: '/timeline', key: 'timeline', end: false },
  { to: '/glossary', key: 'glossary', end: false },
  { to: '/hermeneutics', key: 'hermeneutics', end: false },
  { to: '/about', key: 'about', end: false },
] as const;

const secondary = [
  { to: '/timeline', key: 'timeline', Icon: Clock },
  { to: '/glossary', key: 'glossary', Icon: BookOpen },
  { to: '/hermeneutics', key: 'hermeneutics', Icon: Scale },
  { to: '/about', key: 'about', Icon: Info },
] as const;

const emblemSrc = `${import.meta.env.BASE_URL}favicon.svg`;

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
    <fieldset className="mb-5">
      <legend className="kicker mb-2">{label}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-md border border-line bg-card p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn('min-h-[40px] rounded px-2 text-sm', value === o.value ? 'bg-accent text-accent-fg' : 'hover:bg-surface')}
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

function Wordmark({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3 rounded py-1" aria-label={`${t('app.name')} — ${t('nav.home')}`}>
      <img src={emblemSrc} alt="" width={36} height={36} className={cn('shrink-0', compact ? 'h-8 w-8' : 'h-9 w-9')} />
      <span className="min-w-0">
        <span className="block font-display text-[1.15rem] font-bold uppercase leading-none tracking-[0.16em] sm:text-[1.3rem]">
          {t('app.name')}
        </span>
        <span className="mt-1 block truncate text-[0.68rem] uppercase leading-none tracking-[0.12em] text-muted">{t('app.tagline')}</span>
      </span>
    </Link>
  );
}

function ThemeButton() {
  const { t } = useTranslation();
  const { theme, setTheme } = useUi();
  const order: Theme[] = ['system', 'light', 'dark'];
  const next = order[(order.indexOf(theme) + 1) % order.length]!;
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={`${t('settings.theme')}: ${t(`settings.${theme}`)}`} title={t(`settings.${theme}`)}>
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </Button>
  );
}

function LangToggle() {
  const { lang, setLang } = useUi();
  const { t } = useTranslation();
  return (
    <div role="group" aria-label={t('settings.language')} className="flex items-center rounded border border-line text-xs font-semibold">
      {(['nl', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn('min-h-[34px] min-w-[38px] px-2 uppercase tracking-wider', lang === l ? 'bg-fg text-bg' : 'text-muted hover:text-fg')}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function HeaderSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setQ('');
  };
  return (
    <form role="search" onSubmit={submit} className="relative hidden w-64 xl:block">
      <label htmlFor="header-q" className="sr-only">
        {t('search.title')}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        id="header-q"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('search.placeholder')}
        className="h-9 w-full rounded border border-line bg-paper pl-9 pr-3 text-sm placeholder:text-muted"
      />
    </form>
  );
}

export function Layout() {
  const { t } = useTranslation();
  const online = useOnline();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-card focus:px-3 focus:py-2"
      >
        {t('app.skip')}
      </a>

      {/* Institutional strip (desktop) */}
      <div className="hidden bg-ink text-ink-fg lg:block">
        <div className="mx-auto flex h-8 max-w-page items-center justify-between px-8 text-[0.68rem] uppercase tracking-[0.18em]">
          <span className="font-display">Concilium Oecumenicum Vaticanum II · MCMLXII – MCMLXV</span>
          <a href={OFFICIAL_INDEX_URL} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100">
            vatican.va ↗
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        <div className="h-[2px] bg-gold/70" aria-hidden />
        <div className="mx-auto flex h-14 max-w-page items-center gap-3 px-4 lg:h-16 lg:px-8">
          <Wordmark />
          <div className="ml-auto flex items-center gap-1.5">
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
            <HeaderSearch />
            <div className="hidden items-center gap-1.5 lg:flex">
              <LangToggle />
              <ThemeButton />
            </div>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('app.menu')} className="lg:hidden">
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
                            cn('flex min-h-[44px] items-center gap-3 rounded px-3', isActive ? 'bg-surface font-semibold text-accent' : 'hover:bg-surface')
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
        {/* Primary navigation (desktop) */}
        <nav aria-label={t('nav.primary')} className="hidden border-t border-line lg:block">
          <ul className="mx-auto flex h-11 max-w-page items-stretch gap-1 px-6">
            {primary.map(({ to, key, end }) => (
              <li key={to} className="flex">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center px-3 text-[0.8rem] font-medium uppercase tracking-[0.1em] transition-colors',
                      'after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:transition-colors',
                      isActive ? 'text-accent after:bg-accent' : 'text-muted after:bg-transparent hover:text-fg hover:after:bg-gold',
                    )
                  }
                >
                  {t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-page flex-1 px-4 pb-12 pt-6 outline-none lg:px-8 lg:pt-10">
        <Outlet />
      </main>

      <footer className="bg-ink pb-24 text-ink-fg lg:pb-0">
        <div className="h-[2px] bg-gold/70" aria-hidden />
        <div className="mx-auto grid max-w-page gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <p className="font-display text-lg font-bold uppercase tracking-[0.16em]">{t('app.name')}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-fg/80">{t('footer.disclaimer')}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.12em] text-ink-fg/60">{t('footer.unofficial')}</p>
          </div>
          <nav aria-label={t('footer.study')}>
            <p className="font-display text-xs font-semibold uppercase tracking-caps text-[#C9A96E]">{t('footer.study')}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {primary.slice(1).map(({ to, key }) => (
                <li key={to}>
                  <Link to={to} className="text-ink-fg/85 hover:text-ink-fg hover:underline">
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-caps text-[#C9A96E]">{t('footer.sources')}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <a href={OFFICIAL_INDEX_URL} target="_blank" rel="noopener noreferrer" className="text-ink-fg/85 hover:text-ink-fg hover:underline">
                  {t('footer.vatican')} ↗
                </a>
              </li>
              <li>
                <a href={RKDOCUMENTEN_URL} target="_blank" rel="noopener noreferrer" className="text-ink-fg/85 hover:text-ink-fg hover:underline">
                  {t('footer.rk')} ↗
                </a>
              </li>
            </ul>
            <p className="mt-6 text-xs text-ink-fg/60">{t('footer.privacy')}</p>
          </div>
        </div>
      </footer>

      <nav
        aria-label={t('nav.primary')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-safe backdrop-blur supports-[backdrop-filter]:bg-paper/90 lg:hidden"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {tabs.map(({ to, key, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[0.68rem] tracking-wide',
                    isActive ? 'font-semibold text-accent before:absolute before:inset-x-5 before:top-0 before:h-[2px] before:bg-accent' : 'text-muted hover:text-fg',
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
