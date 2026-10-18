import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, ChevronRight, ExternalLink, GraduationCap, Scale, Search } from 'lucide-react';
import { DocTypeBadge, SolemnityBadge, VerdictBadge } from '@/components/Badges';
import { CiteLink, Loading, ProgressBar, SectionTitle } from '@/components/TextBlocks';
import { SubjectCard } from '@/components/SubjectCard';
import { Button } from '@/components/ui/button';
import { getAllParagraphs, getCatecheses, getClaims, getDocuments, getIndex, getLessons, getSubjects, getVideos } from '@/lib/content';
import { VideoCard } from '@/components/VideoCard';
import { useAsync } from '@/lib/useAsync';
import { shortCite } from '@/lib/citation';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { formatDate, pick } from '@/lib/utils';
import { useUi } from '@/store/ui';

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

const shortDate = (iso: string, lang: 'nl' | 'en') =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short' });

export function Home() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const progress = useUi((s) => s.progress);
  const bookmarks = useUi((s) => s.bookmarks);
  const lessonState = useUi((s) => s.lessons);
  const [q, setQ] = useState('');
  const { data, loading } = useAsync(
    () => Promise.all([getDocuments(), getSubjects(), getClaims(), getIndex(), getAllParagraphs(), getLessons(), getCatecheses(), getVideos()]),
    [],
  );
  useDocumentTitle(undefined);

  if (loading || !data) return <Loading />;
  const [docs, subjects, claims, , paragraphs, lessons, cat, videos] = data;
  const lessonsDone = lessons.filter((l) => lessonState[l.id]?.done).length;
  const nextLesson = lessons.find((l) => !lessonState[l.id]?.done) ?? lessons[0]!;
  const latestCat = [...cat.items].sort((a, b) => b.date.localeCompare(a.date))[0];
  const featured = videos.items.find((v) => v.kind === 'overview') ?? videos.items[0];

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const recent = Object.entries(progress)
    .filter(([, p]) => p.fraction > 0.02 || p.lastParagraphId)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)[0];
  const recentDoc = recent && docs.find((d) => d.id === recent[0]);
  const today = docs[dayIndex(docs.length)];
  const start = subjects.find((s) => s.level === 'start');
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

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div>
          <p className="kicker">{t('home.heroOverline')}</p>
          <h1 className="mt-3 font-serif text-[2rem] font-semibold leading-[1.15] sm:text-5xl">{t('home.heroTitle')}</h1>
          <p className="mt-4 max-w-prose text-[1.05rem] leading-relaxed text-muted">{t('home.intro')}</p>
          <form role="search" onSubmit={onSearch} className="mt-6 flex max-w-xl gap-2">
            <label htmlFor="home-search" className="sr-only">
              {t('search.title')}
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="home-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="min-h-[48px] w-full rounded border border-line bg-paper pl-10 pr-3 text-base placeholder:text-muted"
              />
            </div>
            <Button type="submit" className="min-h-[48px] px-5">
              {t('search.title')}
            </Button>
          </form>
        </div>
        <div className="flex h-full flex-col rounded-md border border-line border-t-[3px] border-t-gold bg-card p-6">
          <p className="kicker">{t('nav.course')}</p>
          <p className="mt-2 font-serif text-xl font-semibold leading-snug">{t('learn.courseTitle')}</p>
          <p className="mt-2 flex-1 text-sm text-muted">{t('learn.courseLead')}</p>
          <p className="mt-4 text-xs tabular text-muted">{t('learn.done', { done: lessonsDone, total: lessons.length })}</p>
          <ProgressBar value={lessonsDone / lessons.length} className="mt-1.5" />
          <Link
            to={`/learn/${nextLesson.id}`}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent/90"
          >
            <GraduationCap className="h-4 w-4" aria-hidden />
            {lessonsDone === 0 ? t('learn.start') : t('learn.resume', { n: nextLesson.number })}
          </Link>
        </div>
      </section>

      {/* Figures */}
      <section aria-label="Concilium">
        <ul className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
          {stats.map((s, i) => (
            <li key={s.label} className={i > 0 ? 'border-line sm:border-l' : ''}>
              <Link to={s.to} className="flex flex-col items-center justify-center py-5 hover:bg-surface">
                <span className="font-serif text-3xl font-semibold tabular text-accent">{s.n}</span>
                <span className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="h-learn" className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionTitle id="h-learn">{t('home.startHere')}</SectionTitle>
          {start && <SubjectCard subject={start} featured />}
        </div>
        {latestCat && (
          <div>
            <SectionTitle
              action={
                <Link to="/catecheses" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                  {t('nav.catecheses')} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              }
            >
              {t('cat.latest')}
            </SectionTitle>
            <div className="panel flex h-[calc(100%-3rem)] flex-col p-5">
              <p className="kicker">Leo PP. XIV · {formatDate(latestCat.date, lang)}</p>
              <p className="mt-2 flex-1 font-serif text-lg font-semibold leading-snug">{pick(lang, latestCat.titleNl, latestCat.titleEn)}</p>
              <a href={latestCat.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                {t('cat.read')} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </div>
        )}
        {featured && (
          <div>
            <SectionTitle
              action={
                <Link to="/videos" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                  {t('nav.videos')} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              }
            >
              {t('video.title')}
            </SectionTitle>
            <VideoCard video={featured} compact />
          </div>
        )}
      </section>

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
                    <CiteLink id={b} className="inline-flex min-h-[40px] items-center rounded border border-line bg-card px-3 no-underline hover:border-gold" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t('home.noBookmarks')}</p>
            )}
          </div>
        </section>
      )}

      {/* Subjects */}
      <section aria-labelledby="h-subjects">
        <SectionTitle
          id="h-subjects"
          action={
            <Link to="/subjects" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
              {t('home.allSubjects')} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        >
          {t('nav.subjects')}
        </SectionTitle>
        <p className="-mt-1 mb-5 text-sm text-muted">{t('home.subjectsLead')}</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {core.map((s) => (
            <li key={s.id}>
              <SubjectCard subject={s} />
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
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
              <Link to="/claims" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                {t('home.allClaims')} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            {t('claims.title')}
          </SectionTitle>
          <p className="-mt-1 mb-4 text-sm text-muted">{t('home.claimsLead')}</p>
          <ul className="divide-y divide-line border-y border-line">
            {featuredClaims.map((c) => (
              <li key={c.id}>
                <Link to={`/claims/${c.id}`} className="flex items-start gap-3 py-4 hover:bg-surface sm:px-2">
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

      {/* Sessions */}
      <section aria-labelledby="h-sessions">
        <SectionTitle
          id="h-sessions"
          action={
            <Link to="/timeline" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
              {t('nav.timeline')} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        >
          {t('home.sessions')}
        </SectionTitle>
        <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
          {sessions.map((s) => (
            <li key={s.n} className="bg-card p-5">
              <p className="font-display text-xs font-semibold uppercase tracking-caps text-gold-text">Sessio</p>
              <p className="font-display text-4xl font-semibold text-accent">{s.n}</p>
              <p className="mt-2 text-sm tabular">
                {shortDate(s.from, lang)} – {shortDate(s.to, lang)} {s.to.slice(0, 4)}
              </p>
              <p className="mt-1 text-xs text-muted">{t('home.statDocs')}: {s.docs}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link to="/glossary" className="panel-link flex items-start gap-4 p-5">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-gold-text" aria-hidden />
          <span>
            <span className="block font-serif text-lg font-semibold">{t('nav.glossary')}</span>
            <span className="block text-sm text-muted">{t('home.glossaryTeaser')}</span>
          </span>
        </Link>
        <Link to="/hermeneutics" className="panel-link flex items-start gap-4 p-5">
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-gold-text" aria-hidden />
          <span>
            <span className="block font-serif text-lg font-semibold">{t('nav.hermeneutics')}</span>
            <span className="block text-sm text-muted">{t('home.hermeneuticsTeaser')}</span>
          </span>
        </Link>
      </section>
    </div>
  );
}
