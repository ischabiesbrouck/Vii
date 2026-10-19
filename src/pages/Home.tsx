import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, ChevronRight, ExternalLink } from 'lucide-react';
import { VerdictBadge } from '@/components/Badges';
import { CiteLink, Loading, ProgressBar, SectionTitle } from '@/components/TextBlocks';
import { SubjectCard } from '@/components/SubjectCard';
import { Credit, Photo, useImage } from '@/components/Photo';
import { VideoRow } from '@/components/VideoCard';
import { getNthParagraph, getCatecheses, getClaims, getDocuments, getLessons, getShortCatecheses, getSubjects, getVideos, paragraphText, paragraphUrl } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { shortCite } from '@/lib/citation';
import { toRoman } from '@/lib/roman';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import { useUi } from '@/store/ui';
import type { DocType } from '@/types/content';

/** A number that changes once a day (day of the year plus the year). */
function dayIndex() {
  const d = new Date();
  const start = Date.UTC(d.getFullYear(), 0, 0);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86_400_000) + d.getFullYear();
}

const loc = (lang: 'nl' | 'en') => (lang === 'nl' ? 'nl-NL' : 'en-GB');
const longDate = (iso: string, lang: 'nl' | 'en') =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(loc(lang), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (iso: string, lang: 'nl' | 'en') => new Date(`${iso}T12:00:00`).toLocaleDateString(loc(lang), { day: 'numeric', month: 'short', year: 'numeric' });

const docTypes: DocType[] = ['constitution', 'decree', 'declaration'];

/** Plate I: a photograph of the council hall, with caption and credit. */
function Frontispiece() {
  const { t } = useTranslation();
  const image = useImage('council-aula');
  return (
    <figure className="lg:mt-2">
      <div className="aspect-[5/4] overflow-hidden border border-line bg-surface">
        {image && <Photo image={image} priority sizes="(min-width: 1024px) 34rem, 100vw" className="h-full w-full object-cover" />}
      </div>
      <figcaption className="mt-2 font-sans text-[0.84rem] leading-snug text-muted">
        <span className="font-title text-[0.95rem] text-accent small-caps">{t('home.plateLabel')}</span> {t('home.plate')}
        {image && <Credit image={image} className="mt-0.5 block" />}
      </figcaption>
    </figure>
  );
}

/** Ex Concilio: one paragraph a day, vernacular beside the Latin. Loads a single document. */
function TextOfTheDay() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data } = useAsync(() => Promise.all([getNthParagraph(dayIndex()), getDocuments()]), []);
  const [day, docs] = data ?? [];
  return (
    <section aria-labelledby="h-day" className="-mx-4 border-y border-line bg-surface px-4 py-10 lg:-mx-8 lg:px-8 lg:py-12">
      <div className="grid min-h-[14rem] grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[13rem_minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          <p id="h-day" className="kicker">
            Ex Concilio · {t('home.textOfDay')}
          </p>
          {day && docs && (
            <>
              <p className="mt-2 font-display text-[0.85rem] font-semibold uppercase leading-snug tracking-[0.12em]" lang="la">
                {day.doc.titleLa}
              </p>
              <p className="mt-1 text-sm text-muted">{pick(lang, day.doc.titleNl, day.doc.titleEn)}</p>
              <Link
                to={paragraphUrl(day.paragraph.id, docs)}
                className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 border border-fg/25 bg-paper px-3 text-sm font-medium transition-colors hover:border-fg/60"
              >
                {t('home.readInContext')} · {shortCite(day.paragraph.id)} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </>
          )}
        </div>
        {day ? (
          <>
            <blockquote className={cn('font-serif text-[1.18rem] leading-[1.7] lg:text-[1.25rem]', !day.paragraph.textLa && 'max-w-[46rem] lg:col-span-2')}>
              <span className="mr-1.5 font-semibold text-accent">{day.paragraph.number}.</span>
              {paragraphText(day.paragraph, lang).text}
            </blockquote>
            {day.paragraph.textLa ? (
              <div lang="la" className="border-t border-gold/50 pt-4 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <p className="sr-only">{t('home.latinText')}</p>
                <p className="la font-serif text-[1.02rem] leading-[1.7] text-muted">{day.paragraph.textLa}</p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-3 lg:col-span-2" aria-hidden>
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        )}
      </div>
    </section>
  );
}

export function Home() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const progress = useUi((s) => s.progress);
  const bookmarks = useUi((s) => s.bookmarks);
  const lessonState = useUi((s) => s.lessons);
  const [q, setQ] = useState('');
  const { data } = useAsync(
    () => Promise.all([getDocuments(), getSubjects(), getClaims(), getLessons(), getCatecheses(), getVideos(), getShortCatecheses()]),
    [],
  );
  useDocumentTitle(undefined);

  const lessons = data?.[3];
  const lessonsDone = lessons?.filter((l) => lessonState[l.id]?.done).length ?? 0;
  const nextLesson = lessons ? (lessons.find((l) => !lessonState[l.id]?.done) ?? lessons[0]) : undefined;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  // The title page needs no content files, so it paints before any fetch completes.
  const hero = (
    <section aria-labelledby="hero-title" className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
      <div>
        <p className="kicker">
          Concilium Oecumenicum Vaticanum II<span className="hidden sm:inline"> · MCMLXII – MCMLXV</span>
        </p>
        <h1 id="hero-title" className="mt-3 max-w-[20ch] font-title text-[2.45rem] font-medium leading-[1.06] sm:text-[3.4rem] xl:text-[3.7rem]">
          {t('home.heroTitle')}
        </h1>
        <div className="rule-double mt-6 max-w-[14rem]" aria-hidden />
        <p className="mt-6 max-w-prose font-serif text-[1.12rem] leading-relaxed text-fg/85">{t('home.intro')}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to={nextLesson ? `/learn/${nextLesson.id}` : '/learn'}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary/90"
          >
            {lessonsDone === 0 || !nextLesson ? t('learn.start') : t('learn.resume', { n: nextLesson.number })}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link to="/documents" className="inline-flex min-h-[46px] items-center gap-2 rounded-sm border border-fg/25 px-5 text-sm font-medium transition-colors hover:border-fg/60">
            {t('home.docIndex')}
          </Link>
        </div>
        <form role="search" onSubmit={onSearch} className="mt-8 max-w-xl">
          <label htmlFor="home-search" className="kicker mb-1.5 block">
            {t('home.searchLabel')}
          </label>
          <div className="flex">
            <input
              id="home-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              className="min-h-[46px] min-w-0 flex-1 rounded-l-sm border border-r-0 border-fg/25 bg-paper px-3 text-base placeholder:text-muted focus:border-fg/60"
            />
            <button type="submit" className="rounded-r-sm bg-fg px-4 text-sm font-semibold text-bg hover:bg-fg/85">
              {t('home.searchButton')}
            </button>
          </div>
        </form>
      </div>
      <Frontispiece />
    </section>
  );

  if (!data || !lessons || !nextLesson)
    return (
      <div className="space-y-16">
        {hero}
        <TextOfTheDay />
        <Loading />
      </div>
    );
  const [docs, subjects, claims, , cat, videos, shortCats] = data;
  const totalMinutes = lessons.reduce((n, l) => n + l.minutes, 0);
  const todayIso = new Date().toISOString().slice(0, 10);
  const audiences = [...cat.items]
    .filter((c) => c.date <= todayIso)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  const core = subjects.filter((s) => s.level !== 'deeper').slice(0, 6);
  const lectures = videos.items.slice(0, 4);
  const featuredClaims = [claims.find((c) => c.verdict === 'not-in-the-text'), claims.find((c) => c.verdict === 'contested'), claims.find((c) => c.verdict === 'partly')].filter(
    (c): c is NonNullable<typeof c> => !!c,
  );
  const recent = Object.entries(progress)
    .filter(([, p]) => p.fraction > 0.02 || p.lastParagraphId)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)[0];
  const recentDoc = recent && docs.find((d) => d.id === recent[0]);

  return (
    <div className="space-y-16">
      {hero}
      <TextOfTheDay />

      {(recentDoc || bookmarks.length > 0) && (
        <section className="flex flex-col gap-4 border-y border-line py-4 text-sm sm:flex-row sm:items-center sm:gap-8">
          {recent && recentDoc && (
            <Link
              to={`/documents/${recentDoc.id}${recent[1].lastParagraphId ? `#${recent[1].lastParagraphId}` : ''}`}
              className="group flex min-w-0 items-center gap-3"
            >
              <span className="kicker shrink-0">{t('home.continue')}</span>
              <span className="truncate">
                <span className="display-title text-[0.85rem]" lang="la">
                  {recentDoc.titleLa}
                </span>
                {recent[1].lastParagraphId && <span className="text-muted"> · {t('home.continueAt', { cite: shortCite(recent[1].lastParagraphId) })}</span>}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
          {bookmarks.length > 0 && (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="kicker">{t('home.bookmarks')}</span>
              {bookmarks.slice(0, 6).map((b) => (
                <CiteLink key={b} id={b} className="chip min-h-[30px] px-2 no-underline" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Programme of study */}
      <section aria-labelledby="h-programme" className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <p className="kicker">Cursus Concilii</p>
          <h2 id="h-programme" className="mt-2 font-title text-[2rem] font-medium leading-tight">
            {t('home.programme')}
          </h2>
          <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">{t('learn.courseLead')}</p>
          <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
            {[
              [t('home.scope'), t('home.scopeValue', { count: lessons.length })],
              [t('home.workload'), t('home.workloadValue', { hours: Math.round(totalMinutes / 60) })],
              [t('home.assessment'), t('home.assessmentValue')],
              [t('home.languages'), t('home.languagesValue')],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm tabular text-muted">{t('learn.done', { done: lessonsDone, total: lessons.length })}</p>
          <ProgressBar value={lessonsDone / lessons.length} className="mt-2" />
          <Link to="/learn" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            {t('home.allLessons')} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <table className="table-academic">
          <caption className="sr-only">{t('home.programme')}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-14">
                {t('home.colLesson')}
              </th>
              <th scope="col">{t('home.colTopic')}</th>
              <th scope="col" className="w-20 text-right">
                {t('home.colDuration')}
              </th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => {
              const done = lessonState[l.id]?.done;
              const current = l.id === nextLesson.id && !done;
              return (
                <tr key={l.id} className={cn(current && 'bg-surface/70')}>
                  <td className="font-display text-sm font-semibold text-accent">{toRoman(l.number)}</td>
                  <td>
                    <Link to={`/learn/${l.id}`} className="font-serif text-[1.05rem] font-semibold leading-snug hover:text-accent hover:underline">
                      {pick(lang, l.titleNl, l.titleEn)}
                    </Link>
                    <span className="mt-0.5 hidden text-[0.85rem] leading-snug text-muted sm:block">{pick(lang, l.summaryNl, l.summaryEn)}</span>
                  </td>
                  <td className="whitespace-nowrap text-right tabular text-muted">
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-ok">
                        <Check className="h-4 w-4" aria-hidden />
                        <span className="sr-only">{t('learn.completed')}</span>
                      </span>
                    ) : (
                      t('learn.minutes', { count: l.minutes })
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Study paths */}
      <section aria-labelledby="h-subjects">
        <SectionTitle
          id="h-subjects"
          action={
            <Link to="/subjects" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              {t('home.allSubjects')} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        >
          {t('nav.subjects')}
        </SectionTitle>
        <p className="-mt-1 mb-5 max-w-prose text-sm text-muted">{t('home.subjectsLead')}</p>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {core.map((s) => (
            <li key={s.id}>
              <SubjectCard subject={s} />
            </li>
          ))}
        </ul>
      </section>

      {shortCats.length > 0 && (
        <section aria-labelledby="h-sc">
          <SectionTitle
            id="h-sc"
            action={
              <Link to="/catechesis" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                {t('home.allCatechesis')} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            {t('sc.title')}
          </SectionTitle>
          <p className="-mt-1 mb-4 max-w-prose text-sm text-muted">{t('sc.intro')}</p>
          <ol className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {shortCats.map((c) => (
              <li key={c.id} className="border-b border-line">
                <Link to={`/catechesis/${c.id}`} className="group grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2 py-3">
                  <span className="pt-0.5 font-display text-sm font-semibold text-accent">{toRoman(c.number)}</span>
                  <span className="font-title text-[1.12rem] leading-snug group-hover:text-accent group-hover:underline">{pick(lang, c.questionNl, c.questionEn)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="rule-ornament" aria-hidden>
        <span className="text-[0.55rem]">◆</span>
      </div>

      {/* Audiences | Index of documents */}
      <section className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <SectionTitle
            action={
              <Link to="/catecheses" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                {t('home.allCatecheses')} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            {t('home.audiences')}
          </SectionTitle>
          <ol className="divide-y divide-line">
            {audiences.map((c) => (
              <li key={c.date} className="py-4 first:pt-1">
                <p className="rubric-label">
                  Audientia generalis · <span className="font-medium normal-case tracking-normal">{longDate(c.date, lang)}</span>
                </p>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="group mt-1 block">
                  <span className="font-title text-[1.35rem] font-medium leading-snug group-hover:text-accent group-hover:underline">{pick(lang, c.titleNl, c.titleEn)}</span>
                  <ExternalLink className="ml-1.5 inline h-3.5 w-3.5 text-muted" aria-hidden />
                </a>
                {lang === 'nl' && (
                  <p className="mt-0.5 text-sm text-muted">
                    <span lang="en">{c.titleEn}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <SectionTitle
            action={
              <Link to="/documents" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                {t('doc.all')} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            Index documentorum
          </SectionTitle>
          <div className="space-y-6">
            {docTypes.map((type) => (
              <div key={type}>
                <h3 className="kicker mb-1.5">{t(`doc.typePlural.${type}`)}</h3>
                <ul className="divide-y divide-line border-y border-line">
                  {docs
                    .filter((d) => d.type === type)
                    .sort((a, b) => a.promulgated.localeCompare(b.promulgated))
                    .map((d) => (
                      <li key={d.id}>
                        <Link to={`/documents/${d.id}`} className="group flex items-baseline justify-between gap-3 py-2">
                          <span className="min-w-0">
                            <span className="display-title block text-[0.82rem] group-hover:text-accent" lang="la">
                              {d.titleLa}
                            </span>
                            <span className="block truncate text-[0.82rem] text-muted">{pick(lang, d.titleNl, d.titleEn)}</span>
                          </span>
                          <span className="shrink-0 text-xs tabular text-muted">{shortDate(d.promulgated, lang)}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Claim check | video lectures */}
      <section className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-2">
        <div>
          <SectionTitle
            action={
              <Link to="/claims" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                {t('home.allClaims')} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            {t('claims.title')}
          </SectionTitle>
          <p className="-mt-1 mb-3 text-sm text-muted">{t('home.claimsLead')}</p>
          <ul className="divide-y divide-line border-y border-line">
            {featuredClaims.map((c) => (
              <li key={c.id}>
                <Link to={`/claims/${c.id}`} className="group flex items-start gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif leading-snug group-hover:text-accent">“{pick(lang, c.claim, c.claimEn)}”</p>
                    <div className="mt-2">
                      <VerdictBadge verdict={c.verdict} />
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionTitle
            action={
              <Link to="/videos" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                {t('home.allVideos')} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            {t('home.lectures')}
          </SectionTitle>
          <ul className="divide-y divide-line border-y border-line">
            {lectures.map((v) => (
              <li key={v.youtubeId}>
                <VideoRow video={v} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Further study */}
      <section aria-labelledby="h-further">
        <SectionTitle id="h-further">{t('home.further')}</SectionTitle>
        <ul className="grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { to: '/timeline', title: t('nav.timeline'), text: t('home.timelineTeaser') },
            { to: '/glossary', title: t('nav.glossary'), text: t('home.glossaryTeaser') },
            { to: '/hermeneutics', title: t('nav.hermeneutics'), text: t('home.hermeneuticsTeaser') },
          ].map((x) => (
            <li key={x.to} className="sm:px-6 sm:first:pl-0">
              <Link to={x.to} className="group block py-5">
                <span className="block font-title text-[1.3rem] font-medium group-hover:text-accent">{x.title}</span>
                <span className="mt-1 block text-sm text-muted">{x.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
