import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConciliarText, RefItem } from '@/components/TextBlocks';
import { Diagram } from '@/components/Diagram';
import { getParagraph } from '@/lib/content';
import { Credit, Photo, useImage } from '@/components/Photo';
import { useDocuments } from '@/lib/data';
import { useAsync } from '@/lib/useAsync';
import { useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import type { StudyBlock } from '@/types/content';

const CITE = /\b(SC|IM|LG|OE|UR|CD|PC|OT|GE|NA|DV|AA|DH|AG|PO|GS) §(\d+)(?:[–-]\d+)?/g;

/** Plain text with "LG §8" citations linked to the reader and *phrases* set in italics. */
export function Cited({ text }: { text: string }) {
  const docs = useDocuments().data ?? [];
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(CITE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(...italics(text.slice(last, i), `t${i}`));
    const doc = docs.find((d) => d.abbr === m[1]);
    out.push(
      doc ? (
        <Link key={`c${i}`} to={`/documents/${doc.id}#${m[1]}-${m[2]}`} className="whitespace-nowrap font-semibold text-accent hover:underline">
          {m[0]}
        </Link>
      ) : (
        m[0]
      ),
    );
    last = i + m[0].length;
  }
  if (last < text.length) out.push(...italics(text.slice(last), `t${last}`));
  return <>{out}</>;
}

function italics(s: string, key: string): ReactNode[] {
  return s.split(/\*([^*]+)\*/g).map((part, i) => (i % 2 ? <em key={`${key}-${i}`}>{part}</em> : <Fragment key={`${key}-${i}`}>{part}</Fragment>));
}

function Quote({ id }: { id: string }) {
  const { data } = useAsync(() => getParagraph(id), [id]);
  if (!data) return <div className="skeleton h-24 w-full" />;
  return (
    <div className="my-6">
      <p className="mb-1.5 text-xs text-muted" data-tts-skip>
        <span lang="la" className="la">
          {data.doc.titleLa}
        </span>{' '}
        ·{' '}
        <Link to={`/documents/${data.doc.id}#${id}`} className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
          {data.doc.abbr} §{data.paragraph.number}
        </Link>
      </p>
      <ConciliarText paragraph={data.paragraph} />
    </div>
  );
}

function Figure({ imageId, caption, n }: { imageId: string; caption: string; n: number }) {
  const { t } = useTranslation();
  const im = useImage(imageId);
  if (!im) return null;
  return (
    <figure className="my-9">
      <Photo image={im} sizes="(min-width: 768px) 44rem, 100vw" className="mx-auto h-auto max-h-[75vh] w-auto max-w-full border border-line" />
      <figcaption className="mt-2.5 border-l-2 border-gold/70 pl-3 font-sans text-[0.84rem] leading-snug text-muted">
        <span className="font-semibold text-fg">
          {t('study.figure')} {n}.
        </span>{' '}
        <Cited text={caption} />
        <Credit image={im} className="mt-1 block" />
      </figcaption>
    </figure>
  );
}

const boxStyle = {
  term: 'border-gold bg-paper',
  note: 'border-accent bg-paper',
  context: 'border-fg/40 bg-surface/60',
} as const;

/** One study block. `figure` numbers figures and diagrams within a chapter. */
export function StudyBlockView({ block: b, figure, first }: { block: StudyBlock; figure: number; first?: boolean }) {
  const lang = useLang();
  const { t } = useTranslation();
  switch (b.type) {
    case 'p':
      return (
        <p className={cn('my-4 hyphens-auto', first && 'first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-title first-letter:text-[3.6em] first-letter:leading-[0.8] first-letter:text-accent')}>
          <Cited text={pick(lang, b.nl, b.en)} />
        </p>
      );
    case 'quote':
      return <Quote id={b.paragraphId} />;
    case 'list':
      return (
        <ul className="my-4 list-none space-y-2 pl-0">
          {(lang === 'nl' ? b.nl : b.en).map((x, i) => (
            <li key={i} className="relative pl-6 before:absolute before:left-0 before:top-[0.62em] before:h-1.5 before:w-1.5 before:rotate-45 before:bg-gold">
              <Cited text={x} />
            </li>
          ))}
        </ul>
      );
    case 'box':
      return (
        <aside className={cn('my-6 border-l-[3px] px-5 py-4 font-sans text-[0.92rem] leading-relaxed', boxStyle[b.kind])} aria-label={pick(lang, b.titleNl, b.titleEn)}>
          <p className="kicker mb-1">
            {t(`study.box.${b.kind}`)} · <span className="text-fg">{pick(lang, b.titleNl, b.titleEn)}</span>
          </p>
          <p>
            <Cited text={pick(lang, b.nl, b.en)} />
          </p>
        </aside>
      );
    case 'positions':
      return (
        <section className="my-8 border-y border-fg/70 py-4 font-sans" aria-label={pick(lang, b.titleNl, b.titleEn)}>
          <p className="rubric-label">{t('study.positions')}</p>
          <p className="mt-1 font-title text-[1.25rem] font-medium">{pick(lang, b.titleNl, b.titleEn)}</p>
          <div className={cn('mt-4 grid gap-px bg-line', b.positions.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
            {b.positions.map((p) => (
              <div key={p.labelNl} className="bg-bg p-4 sm:first:pl-0">
                <p className="font-semibold">{pick(lang, p.labelNl, p.labelEn)}</p>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed">
                  <Cited text={pick(lang, p.nl, p.en)} />
                </p>
                <p className="mt-2 text-xs text-muted" data-tts-skip>
                  {t('study.sources')}:{' '}
                  {p.sources.map((s, i) => (
                    <span key={s}>
                      {i > 0 && '; '}
                      <RefItem refId={s} />
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs italic text-muted" data-tts-skip>
            {t('claims.positionsHint')}
          </p>
        </section>
      );
    case 'diagram':
      return (
        <figure className="my-8 font-sans" data-tts-skip>
          <Diagram id={b.id} />
          <figcaption className="mt-2 text-[0.82rem] leading-snug text-muted">
            <span className="font-semibold text-fg">
              {t('study.figure')} {figure}.
            </span>{' '}
            <Cited text={pick(lang, b.captionNl, b.captionEn)} />
          </figcaption>
        </figure>
      );
    case 'image':
      return <Figure imageId={b.imageId} caption={pick(lang, b.captionNl, b.captionEn)} n={figure} />;
  }
}

