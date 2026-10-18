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
        <p lang="la" className="mt-2 border-t border-line pt-2 text-[0.92em] text-muted">
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

export function PageHeader({ title, intro, eyebrow }: { title: string; intro?: string; eyebrow?: string }) {
  return (
    <header className="mb-6">
      {eyebrow && <p className="label-eyebrow mb-1">{eyebrow}</p>}
      <h1 className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
      {intro && <p className="mt-2 text-muted">{intro}</p>}
    </header>
  );
}

export function Loading() {
  const { t } = useTranslation();
  return (
    <p className="py-8 text-center text-muted" role="status">
      {t('app.loading')}
    </p>
  );
}
