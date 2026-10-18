import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, ChevronRight, ExternalLink, Scale, Search } from 'lucide-react';
import { DocTypeBadge, SolemnityBadge, VerdictBadge } from '@/components/Badges';
import { CiteLink, Loading, ProgressBar, SectionTitle } from '@/components/TextBlocks';
import { SubjectCard } from '@/components/SubjectCard';
import { SubjectIcon } from '@/components/SubjectIcon';
import { Orbs } from '@/components/Orbs';
import { ProgressRing } from '@/components/ProgressRing';
import { VideoCard } from '@/components/VideoCard';
import { getAllParagraphs, getCatecheses, getClaims, getDocuments, getLessons, getSubjects, getVideos } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { shortCite } from '@/lib/citation';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import { useUi } from '@/store/ui';
import { useWatched } from '@/store/player';

function dayIndex(n: number) {
  const d = new Date();
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86_400_000);
  return (day + d.getFullYear()) % n;
}

const sessions = [
  { n: 'I', from: '1962-10-11', to: '1962-12-08', docs: 0 },
  { n: 'II', from: '1963-09-29', to: '1963-12-04', docs: 2 },
  { n: 'III', from: '1964-09-14', to: '1964-11-21', docs: 3 },
  { n: 'IV', from: '1965-09-14', to: '1965-12-08', docs: 11 },
];

const loc = (lang: 'nl' | 'en') => (lang === 'nl' ? 'nl-NL' : 'en-GB');
const dateParts = (iso: string, lang: 'nl' | 'en') => {
  const d = new Date(`${iso}T12:00:00`);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString(loc(lang), { month: 'short' }).replace('.', ''),
    weekday: d.toLocaleDateString(loc(lang), { weekday: 'long' }),
    year: d.getFullYear(),
  };
};
const shortDate = (iso: string, lang: 'nl' | 'en') => new Date(`${iso}T12:00:00`).toLocaleDateString(loc(lang), { day: 'numeric', month: 'short' });

function greetingKey() {
  const h = new Date().getHours();
  return h < 12 ? 'home.greeting.morning' : h < 18 ? 'home.greeting.afternoon' : 'home.greeting.evening';
}

export function Home() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const progress = useUi((s) => s.progress);
  const bookmarks = useUi((s) => s.bookmarks);
  const lessonState = useUi((s) => s.lessons);
  const studied = useUi((s) => s.studied);
  const watched = useWatched((s) => s.watched);
  const [q, setQ] = useState('');
  const { data, loading } = useAsync(
    () => Promise.all([getDocuments(), getSubjects(), getClaims(), getAllParagraphs(), getLessons(), getCatecheses(), getVideos()]),
    [],
  );
  useDocumentTitle(undefined);

  if (loading || !data) return <Loading />;
  const [docs, subjects, claims, paragraphs, lessons, cat, videos] = data;
  const lessonsDone = lessons.filter((l) => lessonState[l.id]?.done).length;
  const nextIndex = Math.max(0, lessons.findIndex((l) => !lessonState[l.id]?.done));
  const nextLesson = lessons[nextIndex]!;
  const upNext = lessons.slice(nextIndex + 1, nextIndex + 4);
  const todayIso = new Date().toISOString().slice(0, 10);
  const byDate = [...cat.items].sort((a, b) => b.date.localeCompare(a.date));
  const latestCat = byDate.find((c) => c.date <= todayIso) ?? byDate[0];
  const featured = videos.items.find((v) => v.kind === 'overview') ?? videos.items[0];
  const studiedCount = Object.values(studied).reduce((n, ids) => n + ids.length, 0);
  const watchedCount = Object.values(watched).filter((w) => w.done).length;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const recent = Object.entries(progress)
    .filter(([, p]) => p.fraction > 0.02 || p.lastParagraphId)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)[0];
  const recentDoc = recent && docs.find((d) => d.id === recent[0]);
  const today = docs[dayIndex(docs.length)];
  const chips = subjects.filter((s) => s.level !== 'deeper');
  const core = subjects.filter((s) => s.level === 'core').slice(0, 6);
  const featuredClaims = [claims.find((c) => c.verdict === 'not-in-the-text'), claims.find((c) => c.verdict === 'contested'), claims.find((c) => c.verdict === 'partly')].filter(
    (c): c is NonNullable<typeof c> => !!c,
  );

  const stats = [
    { n: docs.length, label: t('home.statDocs'), to: '/documents' },
    { n: paragraphs.length, label: t('home.statExcerpts'), to: '/search' },
    { n: subjects.length, label: t('home.statSubjects'), to: '/subjects' },
    { n: claims.length, label: t('home.statClaims'), to: '/claims' },
  ];
  const pct = Math.round((lessonsDone / lessons.length) * 100);
  const lessonTitle = pick(lang, nextLesson.titleNl, nextLesson.titleEn);

  return (
    <div className="space-y-12">
      {/* Greeting, title, search and topic chips | progress */}
      <section aria-labelledby="hero-title" className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-card py-1.5 pl-2 pr-4 text-sm shadow-card">
            <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-medium">{t(greetingKey())}</span>
            <span className="text-muted">· {new Date().toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </p>
          <h1 id="hero-title" className="mt-5 max-w-[16ch] font-serif text-[2.6rem] font-medium leading-[1.02] tracking-[-0.015em] sm:text-[3.8rem]">
            {t('home.syllabus')}
          </h1>
          <p className="mt-4 max-w-prose text-[1.05rem] leading-relaxed text-muted">{t('home.heroTitle')}</p>
          <form role="search" onSubmit={onSearch} className="mt-6 max-w-xl">
            <label htmlFor="home-search" className="sr-only">
              {t('search.title')}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="home-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="min-h-[54px] w-full rounded-full border border-line/70 bg-card pl-12 pr-4 text-base shadow-card placeholder:text-muted focus:border-fg/30"
              />
            </div>
          </form>
          <nav aria-label={t('nav.subjects')} className="mt-5">
            <ul className="scroll-x">
              {chips.map((s) => (
                <li key={s.id}>
                  <Link to={`/subjects/${s.id}`} className="chip">
                    <SubjectIcon name={s.icon} className="h-4 w-4 text-gold-text" />
                    {pick(lang, s.titleNl, s.titleEn)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="panel relative overflow-hidden p-6">
          <p className="kicker">{t('home.progress')}</p>
          <div className="mt-4 flex items-center gap-5">
            <ProgressRing value={lessonsDone / lessons.length} size={104} stroke={9} label={t('learn.done', { done: lessonsDone, total: lessons.length })} className="text-violet-fg">
              <span className="font-serif text-2xl font-semibold tabular text-fg">{pct}%</span>
            </ProgressRing>
            <dl className="min-w-0 space-y-2 text-sm">
              <div>
                <dt className="sr-only">{t('nav.course')}</dt>
                <dd className="tabular">{t('learn.done', { done: lessonsDone, total: lessons.length })}</dd>
              </div>
              <div>
                <dt className="sr-only">{t('nav.subjects')}</dt>
                <dd className="tabular text-muted">{t('home.studied', { count: studiedCount })}</dd>
              </div>
              <div>
                <dt className="sr-only">{t('nav.videos')}</dt>
                <dd className="tabular text-muted">{t('home.watched', { count: watchedCount })}</dd>
              </div>
            </dl>
          </div>
          <Link
            to={`/learn/${nextLesson.id}`}
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-fg transition hover:bg-primary/90"
          >
            {lessonsDone === 0 ? t('learn.start') : t('learn.resume', { n: nextLesson.number })}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Featured lesson | latest catechesis + video */}
      <section aria-labelledby="h-lesson" className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
        <Link
          to={`/learn/${nextLesson.id}`}
          className="group relative flex min-h-[20rem] flex-col overflow-hidden rounded-xl bg-violet p-6 transition duration-300 ease-out hover:shadow-lift sm:p-8 lg:col-span-2"
        >
          <Orbs preset="hero" className="hidden sm:block" />
          <Orbs preset="small" className="sm:hidden" />
          <div className="relative max-w-[34rem]">
            <p className="font-display text-[0.7rem] font-semibold uppercase tracking-caps text-violet-fg">
              {nextLesson.labelLa} · {t('learn.lesson')} {nextLesson.number} / {lessons.length}
            </p>
            <h2 id="h-lesson" className="mt-3 max-w-[18ch] font-serif text-[1.9rem] font-medium leading-[1.08] sm:text-[2.5rem]">
              {lessonTitle}
            </h2>
            <p className="mt-3 line-clamp-3 max-w-prose text-[0.98rem] leading-relaxed text-fg/75">{pick(lang, nextLesson.summaryNl, nextLesson.summaryEn)}</p>
          </div>
          <div className="relative mt-auto flex items-end justify-between gap-4 pt-8">
            <dl className="flex gap-6 sm:gap-8">
              {[
                { n: nextLesson.minutes, label: t('home.minutesLabel') },
                { n: nextLesson.paragraphs.length, label: t('home.textsLabel') },
                { n: nextLesson.quiz.length, label: t('home.questionsLabel') },
              ].map((x) => (
                <div key={x.label} className="flex flex-col-reverse">
                  <dt className="mt-1.5 text-xs text-fg/65">{x.label}</dt>
                  <dd className="font-serif text-[2.1rem] font-medium leading-none tabular sm:text-[2.6rem]">{x.n}</dd>
                </div>
              ))}
            </dl>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lift transition-transform duration-300 group-hover:rotate-45" aria-hidden>
              <ArrowUpRight className="h-6 w-6" />
            </span>
          </div>
        </Link>

        <div className="grid gap-5">
          {latestCat && (
            <a
              href={latestCat.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 rounded-xl bg-rose p-5 transition duration-300 hover:shadow-lift"
            >
              {(() => {
                const d = dateParts(latestCat.date, lang);
                return (
                  <span className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-card py-2 shadow-card">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-rose-fg">{d.month}</span>
                    <span className="font-serif text-[1.9rem] font-semibold leading-none tabular">{d.day}</span>
                    <span className="mt-0.5 text-[0.6rem] text-muted tabular">{d.year}</span>
                  </span>
                );
              })()}
              <span className="min-w-0">
                <span className="font-display text-[0.65rem] font-semibold uppercase tracking-caps text-rose-fg">
                  {t('cat.latest')} · Leo PP. XIV
                </span>
                <span className="mt-1 block font-serif text-[1.08rem] font-semibold leading-snug">{pick(lang, latestCat.titleNl, latestCat.titleEn)}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-rose-fg">
                  {t('cat.read')} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </span>
              </span>
            </a>
          )}
          {featured && <VideoCard video={featured} compact />}
        </div>
      </section>

      {/* Up next | sessions */}
      <section className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <div className="panel p-5 sm:p-6">
          <SectionTitle
            action={
              <Link to="/learn" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                {t('home.allLessons')} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            {t('home.upNext')}
          </SectionTitle>
          <ol className="space-y-2">
            {(upNext.length ? upNext : lessons.slice(0, 3)).map((l) => {
              const done = lessonState[l.id]?.done;
              return (
                <li key={l.id}>
                  <Link to={`/learn/${l.id}`} className="group flex items-center gap-4 rounded-lg p-2 transition hover:bg-violet/50">
                    <span
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold',
                        done ? 'bg-primary text-primary-fg' : 'border border-line bg-bg text-violet-fg',
                      )}
                      aria-hidden
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : l.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{pick(lang, l.titleNl, l.titleEn)}</span>
                      <span className="block truncate text-sm text-muted">{pick(lang, l.summaryNl, l.summaryEn)}</span>
                    </span>
                    <span className="shrink-0 text-sm tabular text-muted">{t('learn.minutes', { count: l.minutes })}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-xl bg-sand p-5 sm:p-6">
          <h2 className="font-serif text-[1.4rem] font-semibold leading-tight">{t('home.sessions')}</h2>
          <ol className="mt-4 grid grid-cols-2 gap-3">
            {sessions.map((se) => (
              <li key={se.n} className="rounded-lg bg-card/80 p-4 shadow-card">
                <span className="block font-display text-2xl font-semibold text-sand-fg">{se.n}</span>
                <span className="mt-1 block text-sm tabular">
                  {shortDate(se.from, lang)} – {shortDate(se.to, lang)}
                </span>
                <span className="block text-xs tabular text-muted">
                  {se.to.slice(0, 4)} · {t('home.promulgated', { count: se.docs })}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((st) => (
          <li key={st.label}>
            <Link to={st.to} className="panel-link flex flex-col items-start p-5">
              <span className="font-serif text-[2.2rem] font-medium leading-none tabular">{st.n}</span>
              <span className="mt-2 text-sm text-muted">{st.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {(recentDoc || bookmarks.length > 0) && (
        <section className="grid gap-6 md:grid-cols-2">
          {recent && recentDoc && (
            <div>
              <SectionTitle>{t('home.continue')}</SectionTitle>
              <Link
                to={`/documents/${recentDoc.id}${recent[1].lastParagraphId ? `#${recent[1].lastParagraphId}` : ''}`}
                className="panel-link block p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="display-title text-lg" lang="la">
                      {recentDoc.titleLa}
                    </p>
                    <p className="text-sm text-muted">
                      {pick(lang, recentDoc.titleNl, recentDoc.titleEn)}
                      {recent[1].lastParagraphId && ` · ${t('home.continueAt', { cite: shortCite(recent[1].lastParagraphId) })}`}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />
                </div>
                <ProgressBar value={recent[1].fraction} className="mt-4" />
              </Link>
            </div>
          )}
          <div>
            <SectionTitle>{t('home.bookmarks')}</SectionTitle>
            {bookmarks.length ? (
              <ul className="flex flex-wrap gap-2">
                {bookmarks.map((b) => (
                  <li key={b}>
                    <CiteLink id={b} className="chip no-underline" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t('home.noBookmarks')}</p>
            )}
          </div>
        </section>
      )}

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
        <p className="-mt-2 mb-5 text-sm text-muted">{t('home.subjectsLead')}</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {core.map((s) => (
            <li key={s.id}>
              <SubjectCard subject={s} />
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        {today && (
          <div>
            <SectionTitle>{t('home.docOfDay')}</SectionTitle>
            <Link to={`/documents/${today.id}`} className="panel-link block p-6">
              <div className="mb-3 flex flex-wrap gap-1.5">
                <DocTypeBadge type={today.type} />
                <SolemnityBadge solemnity={today.solemnity} />
              </div>
              <p className="display-title text-2xl" lang="la">
                {today.titleLa}
              </p>
              <p className="mt-1">{pick(lang, today.titleNl, today.titleEn)}</p>
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted">{pick(lang, today.summaryNl, today.summaryEn)}</p>
            </Link>
          </div>
        )}
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
          <p className="-mt-2 mb-4 text-sm text-muted">{t('home.claimsLead')}</p>
          <ul className="space-y-2">
            {featuredClaims.map((c) => (
              <li key={c.id}>
                <Link to={`/claims/${c.id}`} className="panel-link flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif leading-snug">“{pick(lang, c.claim, c.claimEn)}”</p>
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
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link to="/glossary" className="panel-link flex items-start gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage text-sage-fg">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-serif text-lg font-semibold">{t('nav.glossary')}</span>
            <span className="block text-sm text-muted">{t('home.glossaryTeaser')}</span>
          </span>
        </Link>
        <Link to="/hermeneutics" className="panel-link flex items-start gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet text-violet-fg">
            <Scale className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-serif text-lg font-semibold">{t('nav.hermeneutics')}</span>
            <span className="block text-sm text-muted">{t('home.hermeneuticsTeaser')}</span>
          </span>
        </Link>
      </section>
    </div>
  );
}
