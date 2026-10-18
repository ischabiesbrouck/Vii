import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeardFromBadge, VerdictBadge } from '@/components/Badges';
import { Apa, Commentary, ConciliarText, CiteLink, Crumbs, Loading, SectionTitle } from '@/components/TextBlocks';
import { getClaims, getParagraph } from '@/lib/content';
import { shortCite } from '@/lib/citation';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';

const shortClaim = (s: string) => (s.length > 48 ? `${s.slice(0, 46).trimEnd()}…` : s);

export function ClaimDetail() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const lang = useLang();
  const { data, loading } = useAsync(async () => {
    const claim = (await getClaims()).find((c) => c.id === id);
    if (!claim) return null;
    const evidence = await Promise.all(claim.evidence.map(async (e) => ({ ...e, resolved: await getParagraph(e.paragraphId) })));
    return { claim, evidence };
  }, [id]);
  useDocumentTitle(data?.claim ? t('claims.title') : undefined);

  if (loading) return <Loading />;
  if (!data) return <p className="py-8 text-center">{t('claims.notFound')}</p>;
  const { claim, evidence } = data;

  return (
    <article className="mx-auto max-w-4xl">
      <Crumbs items={[{ to: '/', label: t('crumbs.home') }, { to: '/claims', label: t('claims.title') }, { label: shortClaim(pick(lang, claim.claim, claim.claimEn)) }]} />

      <header className="mb-6">
        <p className="kicker mb-2">{t('claims.claim')}</p>
        <h1 className="font-serif text-[1.65rem] font-semibold leading-snug sm:text-3xl">“{pick(lang, claim.claim, claim.claimEn)}”</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <VerdictBadge verdict={claim.verdict} />
          <span className="text-xs text-muted">{t('claims.heard')}</span>
          <HeardFromBadge heardFrom={claim.heardFrom} />
        </div>
      </header>

      <Commentary className="mb-6">{pick(lang, claim.explanationNl, claim.explanationEn)}</Commentary>

      <section aria-labelledby="ev-h" className="mb-8">
        <SectionTitle id="ev-h">{t('claims.evidence')}</SectionTitle>
        <ol className="space-y-5">
          {evidence.map((e) => (
            <li key={e.paragraphId}>
              <p className="mb-2 text-sm">
                <CiteLink id={e.paragraphId} /> — {pick(lang, e.relevance, e.relevanceEn)}
              </p>
              {e.resolved ? (
                <ConciliarText paragraph={e.resolved.paragraph} cite={shortCite(e.paragraphId)} />
              ) : (
                <p className="text-sm text-muted">{shortCite(e.paragraphId)}</p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {claim.positions && claim.positions.length > 0 && (
        <section aria-labelledby="pos-h" className="mb-8">
          <SectionTitle id="pos-h">{t('claims.positions')}</SectionTitle>
          <p className="-mt-1 mb-4 text-sm text-muted">{t('claims.positionsHint')}</p>
          <div className={claim.positions.length >= 3 ? 'grid gap-3 lg:grid-cols-3' : 'grid gap-3 md:grid-cols-2'}>
            {claim.positions.map((p) => (
              <Commentary key={p.labelNl} label={pick(lang, p.labelNl, p.labelEn)}>
                <p>{pick(lang, p.summaryNl, p.summaryEn)}</p>
                <ul className="mt-2 space-y-1 border-t border-line pt-2 text-muted">
                  {p.sources.map((s) => (
                    <li key={s}>
                      <Apa citation={s} />
                    </li>
                  ))}
                </ul>
              </Commentary>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="fr-h">
        <SectionTitle id="fr-h">{t('claims.furtherReading')}</SectionTitle>
        <ul className="space-y-2">
          {claim.furtherReading.map((r) => (
            <li key={r.citation} className="pl-6 -indent-6">
              <Apa citation={r.citation} url={r.url} />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
