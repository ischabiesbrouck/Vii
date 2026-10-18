import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { shortCite } from '@/lib/citation';
import { paragraphText, paragraphUrl } from '@/lib/content';
import { useDocuments, useSources } from '@/lib/data';
import { useLang } from '@/lib/hooks';
import type { Paragraph } from '@/types/content';

/** Conciliar text: serif, bordered, light background. Never used for commentary. */
export function ConciliarText({
  paragraph,
  className,
  showLatin = false,
  cite,
}: {
  paragraph: Paragraph;
  className?: string;
  showLatin?: boolean;
  cite?: ReactNode;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const { text, isExcerpt } = paragraphText(paragraph, lang);
  return (
    <figure className={cn('conciliar', className)}>
      <figcaption className="mb-1 flex flex-wrap items-center gap-x-2 font-sans text-xs text-muted">
        <span className="font-semibold text-accent">{cite ?? shortCite(paragraph.id)}</span>
        <span aria-hidden>·</span>
        <span>{t('conciliarText')}</span>
        {isExcerpt && (
          <>
            <span aria-hidden>·</span>
            <span>excerpt</span>
          </>
        )}
        {lang === 'nl' && (
          <>
            <span aria-hidden>·</span>
            <span>{t('para.workingTranslation')}</span>
          </>
        )}
      </figcaption>
      <blockquote lang={lang === 'en' ? 'en' : 'nl'} className="whitespace-pre-line">
        {text}
      </blockquote>
      {showLatin && paragraph.textLa && (
        <p lang="la" className="la mt-2 border-t border-line pt-2 text-[0.92em] text-muted">
          {paragraph.textLa}
        </p>
      )}
    </figure>
  );
}

/** Editorial commentary: sans-serif, dashed border, labelled “Toelichting”. */
export function Commentary({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  const { t } = useTranslation();
  return (
    <aside className={cn('commentary', className)} aria-label={label ?? t('commentary')}>
      <p className="label-eyebrow mb-1">{label ?? t('commentary')}</p>
      <div className="text-fg">{children}</div>
    </aside>
  );
}

/** Inline `LG §8` link to a paragraph. */
export function CiteLink({ id, className }: { id: string; className?: string }) {
  const docs = useDocuments().data ?? [];
  return (
    <Link to={paragraphUrl(id, docs)} className={cn('font-semibold text-accent underline-offset-2 hover:underline', className)}>
      {shortCite(id)}
    </Link>
  );
}

/** Cross-reference: internal paragraph link, or APA citation for an external source. */
export function RefItem({ refId }: { refId: string }) {
  const sources = useSources().data ?? [];
  if (!refId.startsWith('ext:')) return <CiteLink id={refId} />;
  const src = sources.find((s) => s.id === refId);
  if (!src) return <span className="text-muted">{refId}</span>;
  return <Apa citation={src.citation} url={src.url} />;
}

export function Apa({ citation, url }: { citation: string; url?: string | undefined }) {
  return (
    <span className="text-sm">
      {citation}
      {url && (
        <>
          {' '}
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-accent underline underline-offset-2">
            {new URL(url).hostname.replace(/^www\./, '')}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </>
      )}
    </span>
  );
}

export function PageHeader({
  title,
  intro,
  eyebrow,
  children,
}: {
  title: ReactNode;
  intro?: ReactNode;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {eyebrow && <p className="kicker mb-2">{eyebrow}</p>}
      <h1 className="font-serif text-[1.75rem] font-semibold leading-tight sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 max-w-prose text-[1.05rem] leading-relaxed text-muted">{intro}</p>}
      {children}
      <div className="rule-ornament mt-6" aria-hidden>
        <span className="text-[0.55rem]">◆</span>
      </div>
    </header>
  );
}

export function SectionTitle({ children, id, action }: { children: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-2">
      <h2 id={id} className="font-display text-sm font-semibold uppercase tracking-caps text-fg">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Crumbs({ items }: { items: { to?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden className="text-gold">/</span>}
            {it.to ? (
              <Link to={it.to} className="inline-flex min-h-[32px] items-center hover:text-accent">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-fg">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Loading() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('app.loading')} className="space-y-4 py-4">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton h-8 w-3/4" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-5/6" />
      <div className="skeleton mt-6 h-28 w-full" />
      <div className="skeleton h-28 w-full" />
    </div>
  );
}

export function ProgressBar({ value, label, className }: { value: number; label?: string; className?: string }) {
  return (
    <div
      className={cn('h-1 w-full overflow-hidden rounded-full bg-line', className)}
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={label ? Math.round(value * 100) : undefined}
      aria-hidden={label ? undefined : true}
    >
      <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${Math.min(1, value) * 100}%` }} />
    </div>
  );
}
