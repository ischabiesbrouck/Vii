import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';
import { SubjectIcon } from '@/components/SubjectIcon';
import { useSubjectProgress } from '@/components/SubjectCard';
import { VerdictBadge } from '@/components/Badges';
import { Apa, Commentary, ConciliarText, Crumbs, Loading, ProgressBar, SectionTitle } from '@/components/TextBlocks';
import { Badge } from '@/components/ui/badge';
import { getClaims, getDocuments, getGlossary, getParagraph, getStudy, getSubjects, getVideos } from '@/lib/content';
import { readingMinutes } from '@/lib/study';
import { VideoCard } from '@/components/VideoCard';
import { shortCite } from '@/lib/citation';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import { useUi } from '@/store/ui';
import type { Subject } from '@/types/content';

function Progress({ subject }: { subject: Subject }) {
  const { t } = useTranslation();
  const { done, total, fraction } = useSubjectProgress(subject);
  return (
    <div>
      <p className="mb-1.5 text-xs tabular text-muted">{t('subjects.progress', { done, total })}</p>
      <ProgressBar value={fraction} label={t('subjects.progress', { done, total })} />
    </div>
  );
}

export function SubjectDetail() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const lang = useLang();
  const studied = useUi((s) => s.studied[id]) ?? [];
  const toggleStudied = useUi((s) => s.toggleStudied);
  const chaptersRead = useUi((s) => s.studyRead[id]) ?? [];

  const { data, loading } = useAsync(async () => {
    const [subjects, claims, glossary, docs, videos, study] = await Promise.all([getSubjects(), getClaims(), getGlossary(), getDocuments(), getVideos(), getStudy(id)]);
    const index = subjects.findIndex((s) => s.id === id);
    const subject = subjects[index];
    if (!subject) return null;
    const steps = await Promise.all(subject.steps.map(async (st) => ({ ...st, resolved: await getParagraph(st.paragraphId) })));
    const docIds = [...new Set(steps.map((s) => s.resolved?.doc.id).filter((x): x is string => !!x))];
    return {
      subject,
      study,
      steps,
      prev: subjects[index - 1],
      next: subjects[index + 1],
      claims: subject.claims.map((c) => claims.find((x) => x.id === c)).filter((x): x is NonNullable<typeof x> => !!x),
      terms: subject.terms.map((term) => glossary.find((g) => g.term === term)).filter((x): x is NonNullable<typeof x> => !!x),
      videos: videos.items.filter((v) => v.subjectIds.includes(subject.id)),
      docs: docIds.map((d) => docs.find((x) => x.id === d)).filter((x): x is NonNullable<typeof x> => !!x),
    };
  }, [id]);

  useDocumentTitle(data ? pick(lang, data.subject.titleNl, data.subject.titleEn) : undefined);

  if (loading) return <Loading />;
  if (!data) return <p className="py-8 text-center">{t('subjects.notFound')}</p>;
  const { subject: s, study, steps, prev, next, claims, terms, docs, videos } = data;
  const nextChapter = study ? (study.chapters.findIndex((_, i) => !chaptersRead.includes(i + 1)) + 1 || 1) : 1;
  const title = pick(lang, s.titleNl, s.titleEn);

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0">
        <Crumbs items={[{ to: '/', label: t('crumbs.home') }, { to: '/subjects', label: t('subjects.title') }, { label: title }]} />

        <header className="mb-8">
          <div className="flex items-start gap-4">
            <span className="mt-1 hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-surface text-gold-text sm:flex">
              <SubjectIcon name={s.icon} className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="kicker">{t(`subjects.level.${s.level}`)}</p>
              <h1 className="mt-1 font-title text-[2.2rem] font-medium leading-[1.08] sm:text-[2.9rem]">{title}</h1>
              <p className="mt-2 text-[1.05rem] text-muted">{pick(lang, s.taglineNl, s.taglineEn)}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> {t('subjects.minutes', { count: s.minutes })}
                </span>
                <span>{t('subjects.steps', { count: s.steps.length })}</span>
              </p>
            </div>
          </div>
          <div className="mt-6 lg:hidden">
            <Progress subject={s} />
          </div>
          <div className="rule-ornament mt-6" aria-hidden>
            <span className="text-[0.55rem]">◆</span>
          </div>
        </header>

        <Commentary className="mb-8">
          <p className="leading-relaxed">{pick(lang, s.introNl, s.introEn)}</p>
        </Commentary>

        {study && (
          <section aria-labelledby="h-study" className="mb-12 border border-line bg-paper">
            <div className="h-[3px] bg-accent" aria-hidden />
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="kicker">Tractatus</p>
                  <h2 id="h-study" className="font-title text-[1.6rem] font-medium">
                    {t('study.title')}
                  </h2>
                </div>
                <p className="text-xs tabular text-muted">
                  {t('study.chapters', { count: study.chapters.length })} · {t('study.minutes', { count: readingMinutes(study, lang) })}
                  {chaptersRead.length > 0 && ` · ${t('study.progress', { done: chaptersRead.length, total: study.chapters.length })}`}
                </p>
              </div>
              <p className="mt-1 max-w-prose text-sm text-muted">{t('study.intro')}</p>
              <ol className="mt-5 divide-y divide-line border-y border-line">
                {study.chapters.map((c, i) => (
                  <li key={c.labelLa}>
                    <Link to={`/subjects/${s.id}/study/${i + 1}`} className="group grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 py-3">
                      <span className="flex items-center gap-1 pt-0.5 font-title text-[0.95rem] text-accent small-caps" lang="la">
                        {c.labelLa}
                        {chaptersRead.includes(i + 1) && <Check className="h-3.5 w-3.5 text-ok" aria-label={t('learn.completed')} />}
                      </span>
                      <span>
                        <span className="block font-title text-[1.2rem] font-medium leading-snug group-hover:text-accent group-hover:underline">{pick(lang, c.titleNl, c.titleEn)}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-muted">{pick(lang, c.summaryNl, c.summaryEn)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              <Link
                to={`/subjects/${s.id}/study/${nextChapter}`}
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-fg hover:bg-primary/90"
              >
                {chaptersRead.length ? t('study.continue', { label: study.chapters[nextChapter - 1]?.labelLa }) : t('study.read')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </section>
        )}

        <section aria-labelledby="h-obj" className="mb-10">
          <SectionTitle id="h-obj">{t('subjects.objectives')}</SectionTitle>
          <ul className="space-y-2">
            {pick(lang, s.objectivesNl, s.objectivesEn).map((o) => (
              <li key={o} className="flex gap-3">
                <Check className="mt-1 h-4 w-4 shrink-0 text-gold-text" aria-hidden />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="h-path" className="mb-12">
          <SectionTitle id="h-path">{t('subjects.path')}</SectionTitle>
          <p className="-mt-1 mb-6 text-sm text-muted">{t('subjects.pathHint')}</p>
          <ol className="relative space-y-8 border-l border-gold/50 pl-6 sm:pl-8">
            {steps.map((st, i) => {
              const isDone = studied.includes(st.paragraphId);
              return (
                <li key={st.paragraphId} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[calc(1.5rem+13px)] top-0 flex h-[26px] w-[26px] items-center justify-center rounded-full border text-xs font-semibold tabular sm:-left-[calc(2rem+13px)]',
                      isDone ? 'border-primary bg-primary text-primary-fg' : 'border-gold bg-paper text-gold-text',
                    )}
                    aria-hidden
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm">
                      <span className="font-semibold text-accent">{shortCite(st.paragraphId)}</span>
                      {st.resolved && (
                        <span className="text-muted">
                          {' '}
                          · <span lang="la" className="la">{st.resolved.doc.titleLa}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="mb-3 text-sm">
                    <span className="kicker mr-2">{t('subjects.focus')}</span>
                    {pick(lang, st.focusNl, st.focusEn)}
                  </p>
                  {st.resolved && <ConciliarText paragraph={st.resolved.paragraph} />}
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        id={`studied-${st.paragraphId}`}
                        checked={isDone}
                        onChange={() => toggleStudied(s.id, st.paragraphId)}
                        className="h-4 w-4 accent-[rgb(var(--accent))]"
                      />
                      {t('subjects.markRead')}
                    </label>
                    {st.resolved && (
                      <Link to={`/documents/${st.resolved.doc.id}#${st.paragraphId}`} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                        {t('subjects.inContext')} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {claims.length > 0 && (
          <section aria-labelledby="h-claims" className="mb-10">
            <SectionTitle id="h-claims">{t('subjects.claims')}</SectionTitle>
            <ul className="divide-y divide-line border-y border-line">
              {claims.map((c) => (
                <li key={c.id}>
                  <Link to={`/claims/${c.id}`} className="flex items-start gap-3 py-4 hover:bg-surface sm:px-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-serif leading-snug">“{pick(lang, c.claim, c.claimEn)}”</p>
                      <div className="mt-2">
                        <VerdictBadge verdict={c.verdict} />
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {terms.length > 0 && (
          <section aria-labelledby="h-terms" className="mb-10">
            <SectionTitle id="h-terms">{t('subjects.terms')}</SectionTitle>
            <dl className="grid gap-3 sm:grid-cols-2">
              {terms.map((g) => (
                <div key={g.term} className="panel p-4">
                  <dt className="flex flex-wrap items-center gap-2 font-serif font-semibold">
                    {pick(lang, g.term, g.termEn)}
                    {g.disputed && <Badge variant="warn">{t('glossary.disputed')}</Badge>}
                  </dt>
                  <dd className="mt-1 text-sm text-muted">{pick(lang, g.definitionNl, g.definitionEn)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {videos.length > 0 && (
          <section aria-labelledby="h-vid" className="mb-10">
            <SectionTitle id="h-vid">{t('video.title')}</SectionTitle>
            <ul className="grid gap-4 sm:grid-cols-2">
              {videos.map((v) => (
                <li key={v.youtubeId}>
                  <VideoCard video={v} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="h-q" className="mb-10">
          <SectionTitle id="h-q">{t('subjects.questions')}</SectionTitle>
          <ol className="list-decimal space-y-2 pl-5 font-serif text-[1.05rem] marker:text-accent">
            {pick(lang, s.questionsNl, s.questionsEn).map((q) => (
              <li key={q} className="pl-1">
                {q}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="h-fr" className="mb-10">
          <SectionTitle id="h-fr">{t('subjects.further')}</SectionTitle>
          <ul className="space-y-2">
            {s.furtherReading.map((r) => (
              <li key={r.citation} className="pl-6 -indent-6">
                <Apa citation={r.citation} url={r.url} />
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label={t('subjects.title')} className="grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
          {prev ? (
            <Link to={`/subjects/${prev.id}`} className="panel-link p-4">
              <span className="kicker inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" aria-hidden /> {t('subjects.prev')}
              </span>
              <span className="mt-1 block font-serif font-semibold">{pick(lang, prev.titleNl, prev.titleEn)}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/subjects/${next.id}`} className="panel-link p-4 text-right">
              <span className="kicker inline-flex items-center gap-1">
                {t('subjects.next')} <ArrowRight className="h-3 w-3" aria-hidden />
              </span>
              <span className="mt-1 block font-serif font-semibold">{pick(lang, next.titleNl, next.titleEn)}</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-6">
          <div className="panel p-5">
            <Progress subject={s} />
          </div>
          <div className="panel p-5">
            <p className="kicker mb-3">{t('subjects.path')}</p>
            <ol className="space-y-1 text-sm">
              {steps.map((st, i) => (
                <li key={st.paragraphId} className="flex items-center gap-2">
                  <span className={cn('w-5 text-right text-xs tabular', studied.includes(st.paragraphId) ? 'text-accent' : 'text-muted')}>
                    {studied.includes(st.paragraphId) ? '✓' : i + 1}
                  </span>
                  <span className="font-medium">{shortCite(st.paragraphId)}</span>
                </li>
              ))}
            </ol>
          </div>
          {docs.length > 0 && (
            <div className="panel p-5">
              <p className="kicker mb-3">{t('subjects.documents')}</p>
              <ul className="space-y-2 text-sm">
                {docs.map((d) => (
                  <li key={d.id}>
                    <Link to={`/documents/${d.id}`} className="hover:text-accent">
                      <span className="mr-2 font-semibold text-accent">{d.abbr}</span>
                      <span lang="la">{d.titleLa}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </article>
  );
}
