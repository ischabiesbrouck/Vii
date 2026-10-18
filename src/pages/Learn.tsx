import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpenText, CheckCircle2, Film, GraduationCap, ScrollText } from 'lucide-react';
import { Loading, PageHeader, ProgressBar, SectionTitle } from '@/components/TextBlocks';
import { getCatecheses, getLessons, getSubjects, getVideos } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, formatDate, pick } from '@/lib/utils';
import { useUi } from '@/store/ui';

export function Learn() {
  const { t } = useTranslation();
  const lang = useLang();
  const progress = useUi((s) => s.lessons);
  const { data, loading } = useAsync(() => Promise.all([getLessons(), getSubjects(), getCatecheses(), getVideos()]), []);
  useDocumentTitle(t('learn.title'));
  if (loading || !data) return <Loading />;
  const [lessons, subjects, cat, videos] = data;
  const done = lessons.filter((l) => progress[l.id]?.done).length;
  const next = lessons.find((l) => !progress[l.id]?.done) ?? lessons[0]!;
  const latest = [...cat.items].sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <div>
      <PageHeader eyebrow="Schola Concilii" title={t('learn.title')} intro={t('learn.intro')} />

      <section aria-labelledby="h-course" className="mb-14">
        <div className="mb-6 grid gap-6 rounded-md border border-line bg-card p-6 lg:grid-cols-[1fr_18rem] lg:items-center">
          <div>
            <p className="kicker">{t('nav.course')}</p>
            <h2 id="h-course" className="mt-1 font-serif text-2xl font-semibold">
              {t('learn.courseTitle')}
            </h2>
            <p className="mt-2 max-w-prose text-muted">{t('learn.courseLead')}</p>
          </div>
          <div>
            <p className="mb-2 text-sm tabular text-muted">{t('learn.done', { done, total: lessons.length })}</p>
            <ProgressBar value={done / lessons.length} label={t('learn.done', { done, total: lessons.length })} />
            <Link
              to={`/learn/${next.id}`}
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent/90"
            >
              {done === 0 ? t('learn.start') : t('learn.resume', { n: next.number })}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <ol className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
          {lessons.map((l) => {
            const isDone = progress[l.id]?.done;
            return (
              <li key={l.id} className="bg-card">
                <Link to={`/learn/${l.id}`} className="group flex h-full gap-4 p-5 hover:bg-surface">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-display text-sm font-semibold',
                      isDone ? 'border-accent bg-accent text-accent-fg' : 'border-gold text-gold-text',
                    )}
                    aria-hidden
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : l.number}
                  </span>
                  <span className="min-w-0">
                    <span className="kicker block">
                      {l.labelLa} · {t('learn.minutes', { count: l.minutes })}
                    </span>
                    <span className="mt-0.5 block font-serif text-lg font-semibold leading-snug group-hover:text-accent">{pick(lang, l.titleNl, l.titleEn)}</span>
                    <span className="mt-1 block text-sm text-muted">{pick(lang, l.summaryNl, l.summaryEn)}</span>
                    {isDone && <span className="sr-only">{t('learn.completed')}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="h-explore">
        <SectionTitle id="h-explore">{t('learn.explore')}</SectionTitle>
        <ul className="grid gap-4 md:grid-cols-3">
          <li>
            <Link to="/subjects" className="panel-link flex h-full flex-col p-5">
              <GraduationCap className="h-6 w-6 text-gold-text" aria-hidden />
              <span className="mt-3 font-serif text-lg font-semibold">{t('nav.subjects')}</span>
              <span className="mt-1 flex-1 text-sm text-muted">{t('home.subjectsLead')}</span>
              <span className="mt-3 text-xs tabular text-muted">{subjects.length} {t('home.statSubjects')}</span>
            </Link>
          </li>
          <li>
            <Link to="/catecheses" className="panel-link flex h-full flex-col p-5">
              <ScrollText className="h-6 w-6 text-gold-text" aria-hidden />
              <span className="mt-3 font-serif text-lg font-semibold">{pick(lang, cat.seriesTitleNl, cat.seriesTitleEn)}</span>
              <span className="mt-1 flex-1 text-sm text-muted">{t('cat.count', { count: cat.items.length })}</span>
              {latest && (
                <span className="mt-3 text-xs text-muted">
                  {t('cat.latest')}: {formatDate(latest.date, lang)}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/videos" className="panel-link flex h-full flex-col p-5">
              <Film className="h-6 w-6 text-gold-text" aria-hidden />
              <span className="mt-3 font-serif text-lg font-semibold">{t('video.title')}</span>
              <span className="mt-1 flex-1 text-sm text-muted">{t('video.intro')}</span>
              <span className="mt-3 text-xs tabular text-muted">{videos.items.length} · {t('video.english')}</span>
            </Link>
          </li>
        </ul>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted">
          <BookOpenText className="h-4 w-4" aria-hidden />
          <Link to="/documents" className="link">
            {t('doc.all')}
          </Link>
        </p>
      </section>
    </div>
  );
}
