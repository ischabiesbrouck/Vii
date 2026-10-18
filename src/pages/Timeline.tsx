import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loading, PageHeader } from '@/components/TextBlocks';
import { getDocuments, getTimeline } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, formatDate, pick } from '@/lib/utils';
import type { TimelineEvent } from '@/types/content';

export function Timeline() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, loading } = useAsync(() => Promise.all([getTimeline(), getDocuments()]), []);
  useDocumentTitle(t('timeline.title'));
  if (loading || !data) return <Loading />;
  const [events, docs] = data;

  const phase = (e: TimelineEvent, i: number) => {
    if (e.sessionNumber) return t('timeline.session', { n: e.sessionNumber });
    return events.slice(0, i).some((x) => x.sessionNumber) ? t('timeline.interim') : t('timeline.preparation');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="MCMLIX – MCMLXV" title={t('timeline.title')} intro={t('timeline.intro')} />
      <ol className="relative border-l border-gold/60 pl-6">
        {events.map((e, i) => {
          const label = phase(e, i);
          const showPhase = i === 0 || label !== phase(events[i - 1]!, i - 1);
          return (
            <li key={`${e.date}-${i}`} className="mb-9">
              {showPhase && (
                <p className={cn('-ml-5 mb-4 pl-5 font-display text-sm font-semibold uppercase tracking-caps', e.sessionNumber ? 'text-accent' : 'text-gold-text')}>
                  {e.sessionNumber ? `Sessio ${['I', 'II', 'III', 'IV'][e.sessionNumber - 1]} · ${label}` : label}
                </p>
              )}
              <span
                className={cn(
                  'absolute -left-[6.5px] mt-1.5 h-3 w-3 rotate-45 border-2 border-bg',
                  e.docIds?.length ? 'bg-accent' : e.sessionNumber ? 'bg-gold' : 'bg-line',
                )}
                aria-hidden
              />
              <time dateTime={e.date} className="text-sm font-semibold text-gold-text">
                {formatDate(e.date, lang)}
              </time>
              <h2 className="mt-0.5 font-serif text-xl font-semibold leading-snug">{pick(lang, e.titleNl, e.titleEn)}</h2>
              <p className="mt-1 text-sm">{pick(lang, e.bodyNl, e.bodyEn)}</p>
              {e.docIds && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {e.docIds.map((id) => {
                    const d = docs.find((x) => x.id === id);
                    return d ? (
                      <li key={id}>
                        <Link to={`/documents/${id}`} className="inline-flex min-h-[36px] items-center rounded border border-line bg-card px-3 text-sm hover:border-gold">
                          <span className="mr-1 font-semibold text-accent">{d.abbr}</span>
                          <span lang="la">{d.titleLa}</span>
                        </Link>
                      </li>
                    ) : null;
                  })}
                </ul>
              )}
              <p className="mt-1 text-xs text-muted">
                {t('timeline.source')}: {e.sourceCitation}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
