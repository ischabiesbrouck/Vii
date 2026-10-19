import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  BookOpenText,
  ChevronDown,
  Compass,
  Clock,
  Film,
  GraduationCap,
  Home,
  Info,
  Library,
  ListChecks,
  Maximize,
  Menu,
  Minimize,
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
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePlayer } from '@/store/player';
import { useSpeech } from '@/store/speech';
import { splashDone, useWelcome } from '@/store/welcome';
import { installedDisplay, toggleFullscreen, useFullscreen } from '@/lib/fullscreen';
import { useOnline } from '@/lib/hooks';
import { useUi, type FontSize, type Theme } from '@/store/ui';
import { OFFICIAL_INDEX_URL, RKDOCUMENTEN_URL } from '@/config';
import { cn } from '@/lib/utils';
import { latinDate } from '@/lib/roman';
import { Seal } from '@/components/Seal';

// Loaded on first use: the palette pulls in the search index, the theater the player.
const CommandPalette = lazy(() => import('@/components/CommandPalette').then((m) => ({ default: m.CommandPalette })));
const VideoTheater = lazy(() => import('@/components/VideoTheater').then((m) => ({ default: m.VideoTheater })));
const Welcome = lazy(() => import('@/components/Welcome').then((m) => ({ default: m.Welcome })));
const SpeechBar = lazy(() => import('@/components/ReadAloud').then((m) => ({ default: m.SpeechBar })));
const VoiceSettings = lazy(() => import('@/components/ReadAloud').then((m) => ({ default: m.VoiceSettings })));

/** Stop reading aloud (loads the reader only if it is in use). */
const stopReading = () => {
  if (useSpeech.getState().status !== 'idle') void import('@/lib/readAloud').then((m) => m.stop());
};

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
  { to: '/catechesis', key: 'catechesis', end: false },
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
  { to: '/catechesis', key: 'catechesis', Icon: BookOpenText },
  { to: '/catecheses', key: 'catecheses', Icon: ScrollText },
  { to: '/videos', key: 'videos', Icon: Film },
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
    <fieldset className="mb-5">
      <legend className="kicker mb-2">{label}</legend>
      <div className="grid auto-cols-fr grid-flow-col border border-line bg-card">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn('min-h-[40px] border-l border-line px-2 text-sm first:border-l-0', value === o.value ? 'bg-fg text-bg' : 'text-muted hover:text-fg')}
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
      <ScreenSetting />
      <section aria-label={t('tts.voice')} className="mt-6 border-t border-line pt-5">
        <Suspense fallback={null}>
          <VoiceSettings />
        </Suspense>
      </section>
    </div>
  );
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Full screen: a switch where the browser allows it, otherwise how to get it. */
function ScreenSetting() {
  const { t } = useTranslation();
  const [on, can] = useFullscreen();
  let body;
  if (can)
    body = (
      <button
        type="button"
        aria-pressed={on}
        onClick={() => void toggleFullscreen()}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 border border-line bg-card px-3 text-sm hover:border-fg/40 aria-pressed:bg-fg aria-pressed:text-bg"
      >
        {on ? <Minimize className="h-4 w-4" aria-hidden /> : <Maximize className="h-4 w-4" aria-hidden />}
        {on ? t('fullscreen.exit') : t('fullscreen.enter')}
      </button>
    );
  else if (installedDisplay()) body = <p className="text-sm text-muted">{t('fullscreen.installedHint')}</p>;
  else if (isIos()) body = <p className="text-sm text-muted">{t('fullscreen.iosHint')}</p>;
  else return null;
  return (
    <div className="mb-5">
      <p className="kicker mb-2">{t('fullscreen.title')}</p>
      {body}
    </div>
  );
}

function FullscreenButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [on, can] = useFullscreen();
  if (!can) return null;
  return (
    <button type="button" className={className} onClick={() => void toggleFullscreen()} aria-pressed={on} aria-label={on ? t('fullscreen.exit') : t('fullscreen.enter')} title={on ? t('fullscreen.exit') : t('fullscreen.enter')}>
      {on ? <Minimize className="h-[1.1em] w-[1.1em]" aria-hidden /> : <Maximize className="h-[1.1em] w-[1.1em]" aria-hidden />}
    </button>
  );
}

function Wordmark() {
  const { t } = useTranslation();
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3 py-1">
      <Seal className="h-11 w-11 text-accent lg:h-14 lg:w-14" />
      <span className="min-w-0 border-l border-line pl-3">
        <span className="block font-display text-[1.12rem] font-bold uppercase leading-none tracking-[0.18em] sm:text-[1.35rem]">{t('app.name')}</span>
        <span className="mt-1.5 block truncate font-title text-[0.95rem] italic leading-none text-muted">{t('app.subtitle')}</span>
      </span>
      <span className="sr-only">, {t('nav.home')}</span>
    </Link>
  );
}

function ThemeButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { theme, setTheme } = useUi();
  const order: Theme[] = ['system', 'light', 'dark'];
  const next = order[(order.indexOf(theme) + 1) % order.length]!;
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return (
    <button
      type="button"
      className={cn('inline-flex h-8 items-center gap-1.5 px-2 hover:text-white', className)}
      onClick={() => setTheme(next)}
      aria-label={`${t('settings.theme')}: ${t(`settings.${theme}`)}`}
      title={t(`settings.${theme}`)}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

/** Language bar in the manner of vatican.va: plain names, the current one marked. */
function LangBar() {
  const { lang, setLang } = useUi();
  const { t } = useTranslation();
  return (
    <div role="group" aria-label={t('settings.language')} className="flex items-center">
      {(
        [
          ['nl', 'Nederlands'],
          ['en', 'English'],
        ] as const
      ).map(([l, name], i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span aria-hidden className="px-1.5 text-ink-fg/40">|</span>}
          <button
            type="button"
            aria-pressed={lang === l}
            lang={l}
            onClick={() => setLang(l)}
            className={cn('h-8 px-1', lang === l ? 'text-[#D9BE85] underline underline-offset-4' : 'text-ink-fg/75 hover:text-white')}
          >
            {name}
          </button>
        </span>
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
      className="hidden h-10 w-72 items-center gap-2 rounded-sm border border-line bg-bg px-3 text-sm text-muted transition-colors hover:border-fg/40 xl:flex"
    >
      <Search className="h-4 w-4" aria-hidden />
      <span className="flex-1 text-left">{t('palette.open')}</span>
      <kbd className="rounded-sm border border-line px-1.5 font-sans text-[0.65rem]">Ctrl K</kbd>
    </button>
  );
}

const navItem = (active: boolean) =>
  cn(
    'relative flex h-full items-center px-3 font-title text-[1.08rem] tracking-[0.06em] transition-colors small-caps',
    'after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:transition-colors',
    active ? 'text-accent after:bg-accent' : 'text-fg/80 after:bg-transparent hover:text-fg hover:after:bg-gold',
  );

function MoreMenu() {
  const { t } = useTranslation();
  const location = useLocation();
  const activeMore = more.some((m) => location.pathname.startsWith(m.to));
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={cn(navItem(activeMore), 'gap-1 outline-none')}>
        {t('nav.more')} <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={0}
          className="z-50 min-w-[13rem] border border-line bg-paper py-1 shadow-lift data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          {more.map((m) => (
            <DropdownMenu.Item key={m.to} asChild>
              <Link to={m.to} className="flex min-h-[40px] items-center border-l-2 border-transparent px-4 text-sm outline-none data-[highlighted]:border-accent data-[highlighted]:bg-surface">
                {t(`nav.${m.key}`)}
              </Link>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item
            onSelect={() => useWelcome.getState().show()}
            className="flex min-h-[40px] cursor-pointer items-center gap-2 border-l-2 border-transparent px-4 text-sm outline-none data-[highlighted]:border-accent data-[highlighted]:bg-surface"
          >
            <Compass className="h-4 w-4 text-gold-text" aria-hidden />
            {t('app.guide')}
          </DropdownMenu.Item>
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
  const paletteUsed = useRef(false);
  if (paletteOpen) paletteUsed.current = true;
  const playerUsed = usePlayer((s) => !!s.current);
  const theaterLoaded = useRef(false);
  if (playerUsed) theaterLoaded.current = true;
  const headerRef = useRef<HTMLElement>(null);
  const speaking = useSpeech((s) => s.status !== 'idle');
  const welcomeOpen = useWelcome((s) => s.open);
  const welcomeLoaded = useRef(false);
  if (welcomeOpen) welcomeLoaded.current = true;

  // First visit: the welcome guide opens once the start-up animation has gone.
  useEffect(() => {
    if (useUi.getState().welcomeSeen) return;
    let alive = true;
    void splashDone().then(() => alive && !useUi.getState().welcomeSeen && useWelcome.getState().show());
    return () => {
      alive = false;
    };
  }, []);
  const lang = useUi((s) => s.lang);

  // Reading aloud belongs to the page it started on.
  useEffect(() => stopReading, [location.pathname, lang]);
  const [stuck, setStuck] = useState(false);

  // The desktop navigation counts as stuck once the masthead is out of view.
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry!.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

      {/* Utility bar: Latin date line, language bar, official source */}
      <div data-chrome className="hidden bg-ink text-ink-fg lg:block">
        <div className="mx-auto flex h-9 max-w-page items-center justify-between gap-6 px-8 text-[0.8rem]">
          <span className="font-title text-[0.95rem] italic text-ink-fg/85">{latinDate(new Date())}</span>
          <div className="flex items-center gap-4">
            <LangBar />
            <span aria-hidden className="h-4 w-px bg-ink-fg/25" />
            <ThemeButton className="text-ink-fg/75" />
            <FullscreenButton className="inline-flex h-8 items-center px-2 text-ink-fg/75 hover:text-white" />
            <span aria-hidden className="h-4 w-px bg-ink-fg/25" />
            <a href={OFFICIAL_INDEX_URL} target="_blank" rel="noopener noreferrer" className="text-ink-fg/75 hover:text-white">
              vatican.va ↗
            </a>
          </div>
        </div>
      </div>

      <header ref={headerRef} data-chrome className="sticky top-0 z-30 border-b border-line bg-paper pt-safe lg:static">
        <div className="h-[3px] bg-gold/80" aria-hidden />
        <div className="mx-auto flex h-16 max-w-page items-center gap-3 px-4 lg:h-24 lg:px-8">
          <Wordmark />
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            {!online && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-line px-2 py-1 text-xs text-muted" title={t('app.offlineHint')} role="status">
                <WifiOff className="h-3.5 w-3.5" aria-hidden />
                {t('app.offline')}
              </span>
            )}
            <PaletteButton onOpen={() => setPaletteOpen(true)} />
            <FullscreenButton className="icon-btn w-9 text-[1.15rem] sm:w-11 lg:hidden" />
            <button type="button" className="icon-btn w-9 sm:w-11 xl:hidden" aria-label={t('palette.open')} onClick={() => setPaletteOpen(true)}>
              <Search className="h-5 w-5" aria-hidden />
            </button>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button type="button" aria-label={t('app.menu')} className="icon-btn w-9 sm:w-11 lg:hidden">
                  <Menu className="h-5 w-5" aria-hidden />
                </button>
              </SheetTrigger>
              <SheetContent side="right" title={t('app.menu')} closeLabel={t('app.close')}>
                <nav aria-label={t('app.menu')} className="mb-6">
                  <ul className="divide-y divide-line border-y border-line">
                    {secondary.map(({ to, key, Icon }) => (
                      <li key={to}>
                        <NavLink
                          to={to}
                          className={({ isActive }) =>
                            cn('flex min-h-[48px] items-center gap-3 border-l-2 px-3', isActive ? 'border-accent bg-surface font-semibold text-accent' : 'border-transparent hover:bg-surface')
                          }
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                          {t(`nav.${key}`)}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      useWelcome.getState().show();
                    }}
                    className="flex min-h-[48px] w-full items-center gap-3 border-b border-l-2 border-line border-l-transparent px-3 text-left hover:bg-surface"
                  >
                    <Compass className="h-5 w-5" aria-hidden />
                    {t('app.guide')}
                  </button>
                </nav>
                <SettingsPanel />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Primary navigation (desktop). Sticks to the top once the masthead has scrolled away,
          and then takes a small wordmark and a search button. */}
      <nav data-chrome aria-label={t('nav.primary')} className={cn('sticky top-0 z-30 hidden border-b border-line bg-paper transition-shadow lg:block', stuck && 'shadow-card')}>
        <div className="mx-auto flex h-12 max-w-page items-stretch px-5">
          <Link
            to="/"
            tabIndex={stuck ? 0 : -1}
            aria-hidden={!stuck}
            className={cn(
              'flex items-center gap-2 overflow-hidden transition-[max-width,opacity,padding] duration-300 ease-out',
              stuck ? 'max-w-[12rem] pr-4 opacity-100' : 'pointer-events-none max-w-0 pr-0 opacity-0',
            )}
          >
            <Seal className="h-7 w-7 text-accent" />
            <span className="font-display text-[0.85rem] font-bold uppercase tracking-[0.18em]">{t('app.name')}</span>
          </Link>
          <ul className="flex items-stretch">
            {primary.map(({ to, key, end }) => (
              <li key={to} className="flex">
                <NavLink to={to} end={end} className={({ isActive }) => navItem(isActive)}>
                  {t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
            <li className="flex">
              <MoreMenu />
            </li>
          </ul>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            tabIndex={stuck ? 0 : -1}
            aria-hidden={!stuck}
            aria-label={t('palette.open')}
            className={cn('icon-btn my-auto ml-auto h-9 w-9 transition-opacity duration-300', stuck ? 'opacity-100' : 'pointer-events-none opacity-0')}
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </nav>

      <main id="main" tabIndex={-1} className="mx-auto min-h-dvh w-full max-w-page flex-1 px-4 pb-16 pt-6 outline-none lg:px-8 lg:pt-10">
        <ErrorBoundary resetKey={location.pathname}>
          <div key={location.pathname} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
            <Outlet />
          </div>
        </ErrorBoundary>
      </main>

      <footer data-chrome className="border-t-[3px] border-gold/80 bg-ink pb-20 text-ink-fg lg:pb-0">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
          <div className="flex gap-5">
            <Seal className="h-20 w-20 text-[#C9A96E]" />
            <div>
              <p className="font-display text-lg font-bold uppercase tracking-[0.16em]">{t('app.name')}</p>
              <p className="font-title text-base italic text-ink-fg/75">{t('app.subtitle')}</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-fg/80">{t('footer.disclaimer')}</p>
            </div>
          </div>
          <nav aria-label={t('footer.study')}>
            <p className="font-title text-[1.05rem] text-[#D9BE85] small-caps">{t('footer.study')}</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {footerLinks.map(({ to, key }) => (
                <li key={to}>
                  <Link to={to} className="text-ink-fg/85 hover:text-white hover:underline">
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="font-title text-[1.05rem] text-[#D9BE85] small-caps">{t('footer.sources')}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <a href={OFFICIAL_INDEX_URL} target="_blank" rel="noopener noreferrer" className="text-ink-fg/85 hover:text-white hover:underline">
                  {t('footer.vatican')} ↗
                </a>
              </li>
              <li>
                <a href={RKDOCUMENTEN_URL} target="_blank" rel="noopener noreferrer" className="text-ink-fg/85 hover:text-white hover:underline">
                  {t('footer.rk')} ↗
                </a>
              </li>
            </ul>
            <button type="button" onClick={() => useWelcome.getState().show()} className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-fg/85 hover:text-white hover:underline">
              <Compass className="h-4 w-4" aria-hidden /> {t('app.guide')}
            </button>
            <p className="mt-6 text-xs text-ink-fg/60">{t('footer.privacy')}</p>
          </div>
        </div>
        <div className="border-t border-ink-fg/15">
          <p className="mx-auto max-w-page px-4 py-4 text-xs leading-relaxed text-ink-fg/60 lg:px-8">
            {t('footer.unofficial')} {t('footer.colophon')}
          </p>
        </div>
      </footer>

      {/* Mobile tab bar */}
      <nav data-chrome aria-label={t('nav.primary')} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper pb-safe lg:hidden">
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {tabs.map(({ to, key, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[0.68rem] tracking-wide',
                    'before:absolute before:inset-x-4 before:top-0 before:h-[2px]',
                    isActive ? 'font-semibold text-accent before:bg-accent' : 'text-muted before:bg-transparent hover:text-fg',
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

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announce}
      </p>
      <Suspense fallback={null}>
        {paletteUsed.current && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />}
        {theaterLoaded.current && <VideoTheater />}
        {speaking && <SpeechBar />}
        {welcomeLoaded.current && <Welcome />}
      </Suspense>
      <InstallPrompt />
      <Toast />
    </div>
  );
}
