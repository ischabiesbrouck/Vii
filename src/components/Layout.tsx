import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  ChevronDown,
  Clock,
  Film,
  GraduationCap,
  Home,
  Info,
  Library,
  ListChecks,
  Menu,
  Monitor,
  Moon,
  Scale,
  ScrollText,
  Search,
  Sun,
  WifiOff,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Toast } from '@/components/Toast';
import { CommandPalette } from '@/components/CommandPalette';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { VideoTheater } from '@/components/VideoTheater';
import { useOnline } from '@/lib/hooks';
import { useUi, type FontSize, type Theme } from '@/store/ui';
import { OFFICIAL_INDEX_URL, RKDOCUMENTEN_URL } from '@/config';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', key: 'home', Icon: Home, end: true },
  { to: '/learn', key: 'learn', Icon: GraduationCap, end: false },
  { to: '/documents', key: 'documents', Icon: Library, end: false },
  { to: '/claims', key: 'claims', Icon: ListChecks, end: false },
  { to: '/search', key: 'search', Icon: Search, end: false },
] as const;

const primary = [
  { to: '/', key: 'home', end: true },
  { to: '/learn', key: 'learn', end: false },
  { to: '/subjects', key: 'subjects', end: false },
  { to: '/documents', key: 'documents', end: false },
  { to: '/claims', key: 'claims', end: false },
  { to: '/catecheses', key: 'catecheses', end: false },
  { to: '/videos', key: 'videos', end: false },
] as const;

const more = [
  { to: '/timeline', key: 'timeline' },
  { to: '/glossary', key: 'glossary' },
  { to: '/hermeneutics', key: 'hermeneutics' },
  { to: '/about', key: 'about' },
] as const;

const footerLinks = [...primary.slice(1), ...more];

const secondary = [
  { to: '/subjects', key: 'subjects', Icon: GraduationCap },
  { to: '/catecheses', key: 'catecheses', Icon: ScrollText },
  { to: '/videos', key: 'videos', Icon: Film },
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
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-line/70 bg-card p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn('min-h-[40px] rounded-full px-2 text-sm', value === o.value ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg')}
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
    <button type="button" className="icon-btn" onClick={() => setTheme(next)} aria-label={`${t('settings.theme')}: ${t(`settings.${theme}`)}`} title={t(`settings.${theme}`)}>
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}

function LangToggle() {
  const { lang, setLang } = useUi();
  const { t } = useTranslation();
  return (
    <div role="group" aria-label={t('settings.language')} className="flex items-center rounded-full border border-line/70 bg-card p-0.5 text-xs font-semibold">
      {(['nl', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn('min-h-[34px] min-w-[38px] rounded-full px-2 uppercase tracking-wider', lang === l ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg')}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function PaletteButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="hidden h-10 w-64 items-center gap-2 rounded-full border border-line/70 bg-card px-4 text-sm text-muted shadow-card transition hover:shadow-lift xl:flex"
    >
      <Search className="h-4 w-4" aria-hidden />
      <span className="flex-1 text-left">{t('palette.open')}</span>
      <kbd className="rounded-full border border-line px-2 text-[0.65rem]">Ctrl K</kbd>
    </button>
  );
}

function MoreMenu() {
  const { t } = useTranslation();
  const location = useLocation();
  const activeMore = more.some((m) => location.pathname.startsWith(m.to));
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          'flex h-9 items-center gap-1 rounded-full px-4 text-sm font-medium transition-colors',
          activeMore ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg',
        )}
      >
        {t('nav.more')} <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-[12rem] rounded-md border border-line/70 bg-card p-1.5 shadow-lift data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1"
        >
          {more.map((m) => (
            <DropdownMenu.Item key={m.to} asChild>
              <Link to={m.to} className="flex min-h-[40px] items-center rounded-full px-3 text-sm outline-none data-[highlighted]:bg-violet data-[highlighted]:text-violet-fg">
                {t(`nav.${m.key}`)}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function Layout() {
  const { t } = useTranslation();
  const online = useOnline();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global shortcuts: Ctrl/⌘+K anywhere, '/' outside text fields.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navType = useNavigationType();
  const [announce, setAnnounce] = useState('');
  const firstRender = useRef(true);

  // Scroll: remember each history entry's position at the moment the reader leaves it
  // (link click or back/forward, both before React re-renders), restore it on
  // back/forward, and start at the top on new navigation (hash links scroll themselves).
  const keyRef = useRef(location.key);
  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(`scroll:${keyRef.current}`, String(window.scrollY));
      } catch {
        /* storage unavailable */
      }
    };
    window.addEventListener('click', save, true);
    window.addEventListener('popstate', save, true);
    return () => {
      window.removeEventListener('click', save, true);
      window.removeEventListener('popstate', save, true);
    };
  }, []);

  useEffect(() => {
    keyRef.current = location.key;
    setMenuOpen(false);
    if (location.hash) return;
    let saved: number | null = null;
    try {
      const v = sessionStorage.getItem(`scroll:${location.key}`);
      saved = v === null ? null : Number(v);
    } catch {
      saved = null;
    }
    if (navType === 'POP' && saved) {
      // Content loads asynchronously: retry until the page is tall enough.
      let tries = 0;
      const tick = () => {
        if (document.documentElement.scrollHeight - window.innerHeight >= saved! || ++tries > 30) window.scrollTo(0, saved!);
        else requestAnimationFrame(tick);
      };
      tick();
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.key, location.hash, navType]);

  // Accessibility: on route change, move focus to <main> and announce the new page title.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (location.hash) return;
    const id = window.setTimeout(() => {
      document.getElementById('main')?.focus({ preventScroll: true });
      setAnnounce(document.title);
    }, 120);
    return () => window.clearTimeout(id);
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
      <div data-chrome className="hidden bg-ink text-ink-fg lg:block">
        <div className="mx-auto flex h-8 max-w-page items-center justify-between px-8 text-[0.68rem] uppercase tracking-[0.18em]">
          <span className="font-display">Concilium Oecumenicum Vaticanum II · MCMLXII – MCMLXV</span>
          <a href={OFFICIAL_INDEX_URL} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100">
            vatican.va ↗
          </a>
        </div>
      </div>

      <header data-chrome className="sticky top-0 z-30 bg-bg/85 pt-safe backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70">
        <div className="mx-auto flex h-16 max-w-page items-center gap-3 px-4 lg:px-8">
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
            <PaletteButton onOpen={() => setPaletteOpen(true)} />
            <button type="button" className="icon-btn xl:hidden" aria-label={t('palette.open')} onClick={() => setPaletteOpen(true)}>
              <Search className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <div className="hidden items-center gap-1.5 lg:flex">
              <LangToggle />
              <ThemeButton />
            </div>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button type="button" aria-label={t('app.menu')} className="icon-btn lg:hidden">
                  <Menu className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </SheetTrigger>
              <SheetContent side="right" title={t('app.menu')} closeLabel={t('app.close')}>
                <nav aria-label={t('app.menu')} className="mb-6">
                  <ul className="space-y-1">
                    {secondary.map(({ to, key, Icon }) => (
                      <li key={to}>
                        <NavLink
                          to={to}
                          className={({ isActive }) =>
                            cn('flex min-h-[48px] items-center gap-3 rounded-full px-4', isActive ? 'bg-primary font-semibold text-primary-fg' : 'hover:bg-violet/60')
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
        <nav aria-label={t('nav.primary')} className="hidden pb-3 lg:block">
          <ul className="mx-auto flex w-max items-center gap-1 rounded-full border border-line/70 bg-card p-1 shadow-card">
            {primary.map(({ to, key, end }) => (
              <li key={to} className="flex">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200',
                      isActive ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg',
                    )
                  }
                >
                  {t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
            <li className="flex">
              <MoreMenu />
            </li>
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-page flex-1 px-4 pb-16 pt-4 outline-none lg:px-8 lg:pt-8">
        <ErrorBoundary resetKey={location.pathname}>
          <div key={location.pathname} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
            <Outlet />
          </div>
        </ErrorBoundary>
      </main>

      <footer data-chrome className="rounded-t-2xl bg-ink pb-28 text-ink-fg lg:pb-0">
        <div className="mx-auto grid max-w-page gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <p className="font-display text-lg font-bold uppercase tracking-[0.16em]">{t('app.name')}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-fg/80">{t('footer.disclaimer')}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.12em] text-ink-fg/60">{t('footer.unofficial')}</p>
          </div>
          <nav aria-label={t('footer.study')}>
            <p className="font-display text-xs font-semibold uppercase tracking-caps text-[#C9A96E]">{t('footer.study')}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {footerLinks.map(({ to, key }) => (
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

      {/* Mobile: floating ink pill; the active tab expands to show its label. */}
      <nav
        data-chrome
        aria-label={t('nav.primary')}
        className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pointer-events-none lg:hidden"
      >
        <ul className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#18161E]/95 p-1.5 text-white shadow-float ring-1 ring-white/10 backdrop-blur-xl dark:bg-[#2A2633]/95">
          {tabs.map(({ to, key, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                aria-label={t(`nav.${key}`)}
                className={({ isActive }) =>
                  cn(
                    'flex h-12 items-center justify-center gap-2 rounded-full transition-all duration-300 ease-out',
                    isActive ? 'bg-white px-4 text-[#18161E]' : 'w-12 text-white/70 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    {isActive && <span className="text-[0.8rem] font-semibold">{t(`nav.${key}`)}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announce}
      </p>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <VideoTheater />
      <InstallPrompt />
      <Toast />
    </div>
  );
}
