import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { CornerDownLeft, Search } from 'lucide-react';
import { search, type Hit } from '@/lib/search';
import { useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';

const pages = [
  { to: '/', key: 'home' },
  { to: '/learn', key: 'learn' },
  { to: '/subjects', key: 'subjects' },
  { to: '/catecheses', key: 'catecheses' },
  { to: '/videos', key: 'videos' },
  { to: '/documents', key: 'documents' },
  { to: '/claims', key: 'claims' },
  { to: '/timeline', key: 'timeline' },
  { to: '/glossary', key: 'glossary' },
  { to: '/hermeneutics', key: 'hermeneutics' },
  { to: '/about', key: 'about' },
] as const;

type Item = { id: string; label: string; sub?: string; kind: string; to: string };

/** Global quick search (Ctrl/⌘+K or /): pages plus full-text hits, keyboard-driven. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) {
      setQ('');
      setHits([]);
    }
  }, [open]);

  useEffect(() => {
    let alive = true;
    const h = setTimeout(() => {
      if (!q.trim()) return setHits([]);
      void search(q).then((r) => alive && setHits(r.slice(0, 12)));
    }, 90);
    return () => {
      alive = false;
      clearTimeout(h);
    };
  }, [q]);

  const items: Item[] = useMemo(() => {
    const f = q.trim().toLowerCase();
    const pageItems = pages
      .map((p) => ({ id: `page:${p.to}`, label: t(`nav.${p.key}`), kind: t('palette.pages'), to: p.to }))
      .filter((p) => !f || p.label.toLowerCase().includes(f));
    const hitItems = hits.map((h) => ({
      id: h.id,
      label: pick(lang, h.title, h.titleEn),
      sub: h.kind === 'paragraph' ? h.cite.split(' ').slice(0, 2).join(' ') : t(`search.kind.${h.kind}`),
      kind: t('palette.results'),
      to: h.url,
    }));
    return [...pageItems, ...hitItems];
  }, [q, hits, lang, t]);

  useEffect(() => setActive(0), [items.length]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (it: Item | undefined) => {
    if (!it) return;
    onOpenChange(false);
    navigate(it.to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(items[active]);
    }
  };

  let lastGroup = '';
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-[8vh] z-[61] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-paper shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          onKeyDown={onKeyDown}
        >
          <Dialog.Title className="sr-only">{t('palette.open')}</Dialog.Title>
          <Dialog.Description className="sr-only">{t('palette.hint')}</Dialog.Description>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('palette.placeholder')}
              role="combobox"
              aria-expanded
              aria-controls="palette-list"
              aria-activedescendant={items[active] ? `pal-${active}` : undefined}
              className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
            />
            <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[0.65rem] text-muted sm:block">Esc</kbd>
          </div>
          <ul id="palette-list" ref={listRef} role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
            {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">{t('palette.none')}</li>}
            {items.map((it, i) => {
              const header = it.kind !== lastGroup ? it.kind : null;
              lastGroup = it.kind;
              return (
                <li key={it.id} role="presentation">
                  {header && <p className="kicker px-3 pb-1 pt-3">{header}</p>}
                  <div
                    id={`pal-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(it)}
                    className={cn('flex cursor-pointer items-center gap-3 rounded px-3 py-2.5', i === active ? 'bg-surface' : '')}
                  >
                    <span className="min-w-0 flex-1 truncate">{it.label}</span>
                    {it.sub && <span className="shrink-0 text-xs font-medium text-accent">{it.sub}</span>}
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-line px-4 py-2 text-[0.7rem] text-muted">{t('palette.hint')}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
