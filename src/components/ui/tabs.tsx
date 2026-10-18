import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TabItem<T extends string> = { id: T; label: ReactNode; count?: number };

export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

/**
 * Underlined tabs (WAI-ARIA tabs pattern): arrow keys, Home and End
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
    <div role="tablist" aria-label={label} className={cn('flex max-w-full overflow-x-auto border-b border-line', className)}>
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
              '-mb-px inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 font-title text-[1.08rem] tracking-[0.04em] transition-colors duration-200 small-caps',
              active ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg',
            )}
          >
            {it.label}
            {it.count !== undefined && <span className="font-sans text-xs tabular opacity-70">({it.count})</span>}
          </button>
        );
      })}
    </div>
  );
}
