import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { HeardFromBadge, VerdictBadge } from '@/components/Badges';
import { Apa, Commentary, ConciliarText, CiteLink, Loading } from '@/components/TextBlocks';
import { getClaims, getParagraph } from '@/lib/content';
import { shortCite } from '@/lib/citation';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';

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
    <article>
      <Link to="/claims" className="mb-4 inline-flex min-h-[44px] items-center gap-1 text-sm text-accent">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('claims.title')}
      </Link>

      <header className="mb-6">
        <p className="label-eyebrow mb-1">{t('claims.claim')}</p>
        <h1 className="font-serif text-2xl font-semibold leading-snug">“{pick(lang, claim.claim, claim.claimEn)}”</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <VerdictBadge verdict={claim.verdict} />
          <span className="text-xs text-muted">{t('claims.heard')}</span>
          <HeardFromBadge heardFrom={claim.heardFrom} />
        </div>
      </header>

      <Commentary className="mb-6">{pick(lang, claim.explanationNl, claim.explanationEn)}</Commentary>

      <section aria-labelledby="ev-h" className="mb-8">
        <h2 id="ev-h" className="mb-3 font-serif text-xl font-semibold">
          {t('claims.evidence')}
        </h2>
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
          <h2 id="pos-h" className="font-serif text-xl font-semibold">
            {t('claims.positions')}
          </h2>
          <p className="mb-3 text-sm text-muted">{t('claims.positionsHint')}</p>
          <div className="grid gap-3 md:grid-cols-2">
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
        <h2 id="fr-h" className="mb-2 font-serif text-xl font-semibold">
          {t('claims.furtherReading')}
        </h2>
        <ul className="list-disc space-y-1.5 pl-5">
          {claim.furtherReading.map((r) => (
            <li key={r.citation}>
              <Apa citation={r.citation} url={r.url} />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
