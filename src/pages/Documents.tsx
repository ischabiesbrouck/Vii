import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DocTypeBadge, SolemnityBadge } from '@/components/Badges';
import { Loading, PageHeader, ProgressBar, SectionTitle } from '@/components/TextBlocks';
import { getDocuments, getIndex } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';
import { useUi } from '@/store/ui';
import type { DocType } from '@/types/content';

const order: DocType[] = ['constitution', 'decree', 'declaration'];
const sessionOf: Record<string, string> = { '1963': 'II', '1964': 'III', '1965': 'IV' };

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
      <PageHeader eyebrow="Constitutiones · Decreta · Declarationes" title={t('nav.documents')} intro={t('home.intro')} />
      <div className="space-y-12">
        {order.map((type) => {
          const group = docs.filter((d) => d.type === type).sort((a, b) => a.promulgated.localeCompare(b.promulgated));
          return (
            <section key={type} aria-labelledby={`h-${type}`}>
              <SectionTitle id={`h-${type}`}>
                {t(`doc.typePlural.${type}`)} <span className="ml-1 font-sans font-normal normal-case tracking-normal text-muted">({group.length})</span>
              </SectionTitle>
              <ul className="grid gap-4 md:grid-cols-2">
                {group.map((d) => {
                  const seeded = index.available.includes(d.id);
                  const frac = progress[d.id]?.fraction ?? 0;
                  const year = d.promulgated.slice(0, 4);
                  return (
                    <li key={d.id}>
                      <Link to={`/documents/${d.id}`} className="panel-link group flex h-full gap-4 p-5">
                        <span className="w-10 shrink-0 pt-1 font-display text-base font-bold text-accent">{d.abbr}</span>
                        <div className="min-w-0 flex-1">
                          <p className="display-title text-lg leading-tight group-hover:text-accent" lang="la">
                            {d.titleLa}
                          </p>
                          <p className="mt-1 text-sm">{pick(lang, d.titleNl, d.titleEn)}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <DocTypeBadge type={d.type} />
                            <SolemnityBadge solemnity={d.solemnity} />
                          </div>
                          <p className="mt-3 text-xs tabular text-muted">
                            {year} · Sessio {sessionOf[year] ?? '—'} · {d.paragraphCount} § ·{' '}
                            {seeded ? <span className="text-gold-text">{t('doc.excerptCount', { count: index.counts[d.id] ?? 0 })}</span> : t('doc.metadataOnly')}
                          </p>
                          {frac > 0 && <ProgressBar value={frac} className="mt-3" />}
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
    </div>
  );
}
