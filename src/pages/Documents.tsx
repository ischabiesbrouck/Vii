import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { DocTypeBadge, SolemnityBadge } from '@/components/Badges';
import { Loading, PageHeader } from '@/components/TextBlocks';
import { getDocuments, getIndex } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';
import { useUi } from '@/store/ui';
import type { DocType } from '@/types/content';

const order: DocType[] = ['constitution', 'decree', 'declaration'];

export function Documents() {
  const { t } = useTranslation();
  const lang = useLang();
  const progress = useUi((s) => s.progress);
  const { data, loading } = useAsync(() => Promise.all([getDocuments(), getIndex()]), []);
  useDocumentTitle(t('nav.documents'));

  if (loading || !data) return <Loading />;
  const [docs, index] = data;

  return (
    <div>
      <PageHeader title={t('nav.documents')} intro={t('home.intro')} />
      {order.map((type) => {
        const group = docs.filter((d) => d.type === type).sort((a, b) => a.promulgated.localeCompare(b.promulgated));
        return (
          <section key={type} aria-labelledby={`h-${type}`} className="mb-8">
            <h2 id={`h-${type}`} className="mb-3 flex items-baseline gap-2 font-serif text-xl font-semibold">
              {t(`doc.typePlural.${type}`)}
              <span className="font-sans text-sm font-normal text-muted">({group.length})</span>
            </h2>
            <ul className="space-y-2">
              {group.map((d) => {
                const seeded = index.available.includes(d.id);
                const frac = progress[d.id]?.fraction ?? 0;
                return (
                  <li key={d.id}>
                    <Link to={`/documents/${d.id}`} className="block rounded-lg border border-line bg-card p-4 hover:border-accent">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 w-9 shrink-0 font-sans text-sm font-bold text-accent">{d.abbr}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-lg font-semibold leading-snug" lang="la">
                            {d.titleLa}
                          </p>
                          <p className="text-sm">{pick(lang, d.titleNl, d.titleEn)}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <DocTypeBadge type={d.type} />
                            <SolemnityBadge solemnity={d.solemnity} />
                            <span className="text-xs text-muted">
                              {d.promulgated.slice(0, 4)} · {seeded ? t('doc.paragraphs', { count: d.paragraphCount }) : t('doc.metadataOnly')}
                            </span>
                          </div>
                          {frac > 0 && (
                            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
                              <div className="h-full bg-accent" style={{ width: `${frac * 100}%` }} />
                            </div>
                          )}
                        </div>
                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted" aria-hidden />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
