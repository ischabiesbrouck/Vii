import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TabItem<T extends string> = { id: T; label: ReactNode; count?: number };

export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

/**
 * Pill-shaped segmented tabs (WAI-ARIA tabs pattern): arrow keys, Home and End
 * move between tabs; the active tab is the only one in the tab order.
 * Pair each panel with `role="tabpanel"`, `id={panelId(prefix, id)}` and
 * `aria-labelledby={tabId(prefix, id)}`.
 */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  prefix,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  prefix: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const last = items.length - 1;
    const to = e.key === 'ArrowRight' ? (i === last ? 0 : i + 1) : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : -1;
    if (to < 0) return;
    e.preventDefault();
    onChange(items[to]!.id);
    refs.current[to]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line/70 bg-card p-1 shadow-card', className)}>
      {items.map((it, i) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={tabId(prefix, it.id)}
            aria-selected={active}
            aria-controls={panelId(prefix, it.id)}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(it.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors duration-200',
              active ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:text-fg',
            )}
          >
            {it.label}
            {it.count !== undefined && <span className={cn('tabular text-xs', active ? 'opacity-70' : 'opacity-60')}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
