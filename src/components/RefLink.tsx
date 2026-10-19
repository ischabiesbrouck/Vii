import { Fragment, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ConciliarText } from '@/components/TextBlocks';
import { getParagraph } from '@/lib/content';
import { useDocuments } from '@/lib/data';
import { useAsync } from '@/lib/useAsync';
import { useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';

const CITE = /\b(SC|IM|LG|OE|UR|CD|PC|OT|GE|NA|DV|AA|DH|AG|PO|GS) §(\d+)(?:[–-]\d+)?/g;

function RefPanel({ abbr, n, label }: { abbr: string; n: number; label: string }) {
  const { t } = useTranslation();
  const lang = useLang();
  const docs = useDocuments().data ?? [];
  const doc = docs.find((d) => d.abbr === abbr);
  const { data, loading } = useAsync(() => getParagraph(`${abbr}-${n}`), [abbr, n]);
  if (!doc) return null;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        <span lang="la" className="display-title text-[0.85rem] text-fg">
          {doc.titleLa}
        </span>{' '}
        · {pick(lang, doc.titleNl, doc.titleEn)}
      </p>
      {loading ? (
        <div className="skeleton h-24 w-full" />
      ) : data ? (
        <ConciliarText paragraph={data.paragraph} showLatin cite={label} />
      ) : (
        <p className="border border-dashed border-line px-4 py-3 text-sm text-muted">{t('ref.notSeeded', { cite: label })}</p>
      )}
      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap">
        <Link to={`/documents/${doc.id}${data ? `#${abbr}-${n}` : ''}`} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm border border-fg/25 px-4 hover:border-fg/60">
          {t('ref.reader')} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <a
          href={doc.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm bg-primary px-4 font-semibold text-primary-fg hover:bg-primary/90"
        >
          {t('ref.official')} <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}

/** A reference such as "LG §8" as a link that opens the paragraph on click (no quotation in the running text). */
export function RefLink({ abbr, n, label }: { abbr: string; n: number; label: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const docs = useDocuments().data ?? [];
  const doc = docs.find((d) => d.abbr === abbr);
  const href = `${import.meta.env.BASE_URL}documents/${doc?.id ?? ''}#${abbr}-${n}`;
  return (
    <>
      {/* A real link (inline, so it never breaks away from its brackets): a plain click opens the
          panel; modifier clicks keep the browser's behaviour (new tab, new window). */}
      <a
        href={href}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          setOpen(true);
        }}
        aria-haspopup="dialog"
        className="whitespace-nowrap font-semibold text-accent underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent"
      >
        {label}
      </a>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title={label} description={t('ref.sheet')} closeLabel={t('app.close')}>
          {open && <RefPanel abbr={abbr} n={n} label={label} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Prose in which every conciliar reference becomes a RefLink; *phrases* are set in italics. */
export function LinkedText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  const italics = (s: string, key: string) =>
    s.split(/\*([^*]+)\*/g).map((part, i) => (i % 2 ? <em key={`${key}-${i}`}>{part}</em> : <Fragment key={`${key}-${i}`}>{part}</Fragment>));
  for (const m of text.matchAll(CITE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(...italics(text.slice(last, i), `t${i}`));
    out.push(<RefLink key={`r${i}`} abbr={m[1]!} n={Number(m[2])} label={m[0]} />);
    last = i + m[0].length;
  }
  if (last < text.length) out.push(...italics(text.slice(last), `t${last}`));
  return <>{out}</>;
}
