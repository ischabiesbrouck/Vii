import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Crumbs, Loading } from '@/components/TextBlocks';
import { LinkedText } from '@/components/RefLink';
import { getShortCatecheses, getSubjects } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { toRoman } from '@/lib/roman';
import { cn, pick } from '@/lib/utils';

export function CatechesisItem() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const lang = useLang();
  const { data, loading } = useAsync(() => Promise.all([getShortCatecheses(), getSubjects()]), []);
  const list = data?.[0] ?? [];
  const i = list.findIndex((c) => c.id === id);
  const c = list[i];
  useDocumentTitle(c ? pick(lang, c.questionNl, c.questionEn) : undefined);
  if (loading || !data) return <Loading />;
  if (!c) return <p className="py-8 text-center">{t('sc.notFound')}</p>;
  const prev = list[i - 1];
  const next = list[i + 1];
  const subjects = c.subjects.map((s) => data[1].find((x) => x.id === s)).filter((x): x is NonNullable<typeof x> => !!x);
  const sections = lang === 'nl' ? c.sections.map((s) => ({ h: s.headingNl, ps: s.nl })) : c.sections.map((s) => ({ h: s.headingEn, ps: s.en }));

  return (
    <article className="mx-auto max-w-[44rem]">
      <Crumbs items={[{ to: '/', label: t('crumbs.home') }, { to: '/catechesis', label: t('sc.title') }, { label: `${toRoman(c.number)}` }]} />

      <header className="mb-8 text-center">
        <p className="font-title text-[1.05rem] uppercase tracking-[0.18em] text-accent" lang="la">
          Catechesis {toRoman(c.number)}
        </p>
        <h1 className="mx-auto mt-3 max-w-[22ch] font-title text-[2.3rem] font-medium leading-[1.08] sm:text-[3rem]">{pick(lang, c.questionNl, c.questionEn)}</h1>
        <p className="mt-3 font-title text-[1.2rem] italic text-fg/80">{pick(lang, c.titleNl, c.titleEn)}</p>
        <div className="rule-ornament mx-auto mt-5 max-w-[12rem]" aria-hidden>
          <span className="text-[0.5rem]">◆</span>
        </div>
        <p className="mt-4 text-xs text-muted">
          {t('learn.minutes', { count: c.minutes })} · {t('sc.refsHint')}
        </p>
      </header>

      <div className="font-serif text-[1.08rem] leading-[1.8]">
        <p className="text-[1.15rem] leading-[1.75] first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-title first-letter:text-[3.6em] first-letter:leading-[0.8] first-letter:text-accent">
          <LinkedText text={pick(lang, c.introNl, c.introEn)} />
        </p>

        {sections.map((s, si) => (
          <section key={s.h} aria-labelledby={`cs-${si}`} className="mt-10">
            <h2 id={`cs-${si}`} className="font-title text-[1.6rem] font-medium leading-snug">
              <span className="mr-2 font-sans text-sm tabular text-gold-text">{si + 1}.</span>
              {s.h}
            </h2>
            {s.ps.map((p, pi) => (
              <p key={pi} className="my-4 hyphens-auto">
                <LinkedText text={p} />
              </p>
            ))}
          </section>
        ))}
      </div>

      <section aria-labelledby="h-brief" className="mt-12 border border-line bg-paper">
        <div className="h-[3px] bg-accent" aria-hidden />
        <div className="p-5 sm:p-6">
          <h2 id="h-brief" className="font-title text-[1.4rem] font-medium">
            {t('sc.inBrief')}
          </h2>
          <ol className="mt-3 space-y-3 font-serif">
            {(lang === 'nl' ? c.inBriefNl : c.inBriefEn).map((b, bi) => (
              <li key={bi} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2">
                <span className="font-display text-sm font-semibold text-accent">{toRoman(bi + 1)}.</span>
                <span>
                  <LinkedText text={b} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="h-reflect" className="mt-10">
        <h2 id="h-reflect" className="mb-3 border-b border-fg/70 pb-2 font-title text-[1.4rem] font-medium">
          {t('sc.reflect')}
        </h2>
        <ul className="space-y-2 font-serif">
          {(lang === 'nl' ? c.reflectNl : c.reflectEn).map((q, qi) => (
            <li key={qi} className="relative pl-6 before:absolute before:left-0 before:top-[0.62em] before:h-1.5 before:w-1.5 before:rotate-45 before:bg-gold">
              <LinkedText text={q} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="h-links" className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 id="h-links" className="kicker mb-1.5">
            {t('sc.links')}
          </h2>
          <ul className="divide-y divide-line border-y border-line text-sm">
            {c.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-h-[42px] items-center justify-between gap-2 py-2 text-accent hover:underline">
                  {pick(lang, l.labelNl, l.labelEn)} <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
        {subjects.length > 0 && (
          <div>
            <h2 className="kicker mb-1.5">{t('sc.deeper')}</h2>
            <ul className="divide-y divide-line border-y border-line text-sm">
              {subjects.map((s) => (
                <li key={s.id}>
                  <Link to={`/subjects/${s.id}`} className="flex min-h-[42px] items-center justify-between gap-2 py-2 hover:text-accent hover:underline">
                    {pick(lang, s.titleNl, s.titleEn)} <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="mt-10 border-y border-dashed border-line py-2 text-center text-xs text-muted">
        {t('sc.editorial')}
        {c.review === 'unverified' && ` · ${t('doc.unverified')}`}
      </p>

      <nav aria-label={t('sc.title')} className="mt-8 grid gap-3 border-t border-fg/70 pt-6 sm:grid-cols-2">
        {prev ? (
          <Link to={`/catechesis/${prev.id}`} className="panel-link p-4">
            <span className="kicker inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" aria-hidden /> {toRoman(prev.number)}
            </span>
            <span className="mt-1 block font-title text-[1.15rem]">{pick(lang, prev.questionNl, prev.questionEn)}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/catechesis/${next.id}`} className={cn('panel-link p-4 text-right')}>
            <span className="kicker inline-flex items-center gap-1">
              {toRoman(next.number)} <ArrowRight className="h-3 w-3" aria-hidden />
            </span>
            <span className="mt-1 block font-title text-[1.15rem]">{pick(lang, next.questionNl, next.questionEn)}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
