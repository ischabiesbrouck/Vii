import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowRight,
  BookOpen,
  BookOpenText,
  Check,
  CloudOff,
  Download,
  GraduationCap,
  Headphones,
  History,
  Library,
  ListChecks,
  MousePointerClick,
  RefreshCw,
  Search,
  SunMoon,
  X,
} from 'lucide-react';
import { Seal } from '@/components/Seal';
import { SegmentedTabs, panelId, tabId } from '@/components/ui/tabs';
import { guide, type GuideIcon, type GuideItem } from '@/lib/guide';
import { installedDisplay } from '@/lib/fullscreen';
import { useLang } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { platform, promptInstall, useInstall, type Platform } from '@/store/install';
import { useUi } from '@/store/ui';
import { useWelcome } from '@/store/welcome';

const icons: Record<GuideIcon, ComponentType<{ className?: string }>> = {
  documents: Library,
  course: GraduationCap,
  subjects: BookOpen,
  catechesis: BookOpenText,
  claims: ListChecks,
  reference: History,
  offline: CloudOff,
  search: Search,
  reader: MousePointerClick,
  listen: Headphones,
  display: SunMoon,
  progress: Check,
  update: RefreshCw,
};

function Items({ items, onNavigate }: { items: GuideItem[]; onNavigate: () => void }) {
  return (
    <ul className="divide-y divide-line border-b border-line">
      {items.map((it) => {
        const Icon = icons[it.icon];
        return (
          <li key={it.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 py-3.5">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center border border-gold/60 text-gold-text">
              <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden />
            </span>
            <div>
              <p className="font-title text-[1.15rem] font-medium leading-snug">{it.title}</p>
              <p className="mt-0.5 text-[0.9rem] leading-relaxed text-muted">{it.text}</p>
              {it.to && (
                <Link to={it.to} onClick={onNavigate} className="mt-1 inline-flex min-h-[32px] items-center gap-1 text-sm font-medium text-accent hover:underline">
                  {it.link} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function InstallGuide() {
  const lang = useLang();
  const g = guide(lang);
  const event = useInstall((s) => s.event);
  const installed = useInstall((s) => s.installed) || installedDisplay();
  const mine = platform();
  const order: Platform[] = [mine, ...(['ios', 'android', 'desktop'] as Platform[]).filter((p) => p !== mine)];
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[0.95rem] leading-relaxed">{g.installIntro}</p>
        <ul className="mt-2 grid gap-x-6 gap-y-1 text-[0.9rem] text-muted sm:grid-cols-2">
          {g.installBenefits.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden />
              {b}
            </li>
          ))}
        </ul>
      </div>
      {installed ? (
        <p className="flex items-center gap-2 border border-ok/40 bg-ok/5 px-3 py-2.5 text-sm font-medium text-ok">
          <Check className="h-4 w-4" aria-hidden /> {g.installed}
        </p>
      ) : (
        event && (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-fg hover:bg-primary/90"
          >
            <Download className="h-4 w-4" aria-hidden /> {g.installNow}
          </button>
        )
      )}
      {order.map((p, i) => (
        <section key={p} aria-label={g.platforms[p].name} className={cn('border border-line', i === 0 ? 'border-t-[3px] border-t-accent bg-paper' : 'bg-card')}>
          <p className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-2.5">
            <span className="font-title text-[1.15rem] font-medium">{g.platforms[p].name}</span>
            {i === 0 && <span className="kicker">{g.yourDevice}</span>}
          </p>
          <ol className="space-y-1.5 px-4 py-3 text-[0.9rem] leading-relaxed">
            {g.platforms[p].steps.map((s, k) => (
              <li key={s} className="grid grid-cols-[1.5rem_minmax(0,1fr)]">
                <span className="font-semibold tabular text-accent">{k + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** Welcome message with a guide to the contents, how the app works, and how to install it. */
export function Welcome() {
  const lang = useLang();
  const g = guide(lang);
  const { open, tab, hide } = useWelcome();
  const [current, setCurrent] = useState(tab);
  const seen = useUi((s) => s.setWelcomeSeen);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => setCurrent(tab), [tab, open]);

  const close = () => {
    seen();
    hide();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          ref={contentRef}
          tabIndex={-1}
          // Focus the dialog itself (its title is announced), not the close button.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            contentRef.current?.focus();
          }}
          className={cn(
            'fixed inset-0 z-[61] flex flex-col bg-paper outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88vh] sm:w-[min(44rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border sm:border-line sm:shadow-2xl sm:data-[state=open]:zoom-in-95',
          )}
        >
          <div className="h-[3px] shrink-0 bg-gold/80" aria-hidden />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-safe">
            <header className="relative px-5 pb-5 pt-6 text-center sm:px-8 sm:pt-8">
              <Dialog.Close className="icon-btn absolute right-2 top-2" aria-label={g.later}>
                <X className="h-5 w-5" aria-hidden />
              </Dialog.Close>
              <Seal className="mx-auto h-20 w-20 text-accent motion-safe:animate-in motion-safe:spin-in-12 motion-safe:duration-700" />
              <p className="kicker mt-4" lang="la">
                {g.kicker}
              </p>
              <Dialog.Title className="mt-1 font-title text-[2rem] font-medium leading-tight sm:text-[2.3rem]">{g.title}</Dialog.Title>
              <div className="rule-ornament mx-auto mt-4 max-w-[10rem]" aria-hidden>
                <span className="text-[0.45rem]">◆</span>
              </div>
              <Dialog.Description asChild>
                <div className="mx-auto mt-4 max-w-prose space-y-2 text-left font-serif text-[1.02rem] leading-relaxed text-fg/85 sm:text-center">
                  {g.welcome.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </Dialog.Description>
            </header>

            <div className="px-5 pb-6 sm:px-8">
              <SegmentedTabs
                prefix="guide"
                label={g.title}
                value={current}
                onChange={setCurrent}
                items={[
                  { id: 'content', label: g.tabs.content },
                  { id: 'tech', label: g.tabs.tech },
                  { id: 'install', label: g.tabs.install },
                ]}
                className="mb-4"
              />
              <div role="tabpanel" id={panelId('guide', current)} aria-labelledby={tabId('guide', current)} tabIndex={0} className="outline-none">
                {current === 'content' && (
                  <div className="space-y-6">
                    <Items items={g.content} onNavigate={close} />
                    <div>
                      <p className="kicker mb-2">{g.startTitle}</p>
                      <ul className="grid gap-2 sm:grid-cols-3">
                        {g.start.map((s) => (
                          <li key={s.to}>
                            <Link to={s.to} onClick={close} className="panel-link flex h-full min-h-[48px] items-center justify-between gap-2 px-3 py-2 text-sm font-medium">
                              {s.label} <ArrowRight className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="commentary text-[0.82rem]">{g.status}</p>
                  </div>
                )}
                {current === 'tech' && <Items items={g.tech} onNavigate={close} />}
                {current === 'install' && <InstallGuide />}
              </div>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-paper px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8">
            <button type="button" onClick={close} className="inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-fg hover:bg-primary/90">
              {g.begin} <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
