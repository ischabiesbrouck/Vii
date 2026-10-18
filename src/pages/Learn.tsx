import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpenText, CheckCircle2, Film, GraduationCap, ScrollText } from 'lucide-react';
import { Loading, PageHeader, SectionTitle } from '@/components/TextBlocks';
import { Orbs } from '@/components/Orbs';
import { ProgressRing } from '@/components/ProgressRing';
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
        <div className="relative mb-6 grid gap-6 overflow-hidden rounded-xl bg-violet p-6 sm:p-8 lg:grid-cols-[1fr_16rem] lg:items-center">
          <Orbs preset="hero" className="hidden lg:block" />
          <div className="relative">
            <p className="font-display text-[0.7rem] font-semibold uppercase tracking-caps text-violet-fg">{t('nav.course')}</p>
            <h2 id="h-course" className="mt-2 max-w-[20ch] font-serif text-[1.9rem] font-medium leading-[1.08] sm:text-[2.4rem]">
              {t('learn.courseTitle')}
            </h2>
            <p className="mt-3 max-w-prose text-fg/75">{t('learn.courseLead')}</p>
          </div>
          <div className="relative flex items-center gap-5 rounded-lg bg-card/85 p-5 shadow-card backdrop-blur lg:flex-col lg:items-stretch">
            <ProgressRing value={done / lessons.length} size={88} stroke={8} label={t('learn.done', { done, total: lessons.length })} className="text-violet-fg lg:self-center">
              <span className="font-serif text-xl font-semibold tabular">{Math.round((done / lessons.length) * 100)}%</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-sm tabular text-muted lg:text-center">{t('learn.done', { done, total: lessons.length })}</p>
              <Link
                to={`/learn/${next.id}`}
                className="mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary/90"
              >
                {done === 0 ? t('learn.start') : t('learn.resume', { n: next.number })}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <ol className="grid gap-3 sm:grid-cols-2">
          {lessons.map((l) => {
            const isDone = progress[l.id]?.done;
            return (
              <li key={l.id}>
                <Link to={`/learn/${l.id}`} className="panel-link group flex h-full gap-4 p-4 sm:p-5">
                  <span
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold',
                      isDone ? 'bg-primary text-primary-fg' : 'bg-violet text-violet-fg',
                    )}
                    aria-hidden
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : l.number}
                  </span>
                  <span className="min-w-0">
                    <span className="kicker block">
                      {l.labelLa} · {t('learn.minutes', { count: l.minutes })}
                    </span>
                    <span className="mt-0.5 block font-serif text-lg font-semibold leading-snug">{pick(lang, l.titleNl, l.titleEn)}</span>
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
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet text-violet-fg"><GraduationCap className="h-5 w-5" aria-hidden /></span>
              <span className="mt-3 font-serif text-lg font-semibold">{t('nav.subjects')}</span>
              <span className="mt-1 flex-1 text-sm text-muted">{t('home.subjectsLead')}</span>
              <span className="mt-3 text-xs tabular text-muted">{subjects.length} {t('home.statSubjects')}</span>
            </Link>
          </li>
          <li>
            <Link to="/catecheses" className="panel-link flex h-full flex-col p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose text-rose-fg"><ScrollText className="h-5 w-5" aria-hidden /></span>
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
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand text-sand-fg"><Film className="h-5 w-5" aria-hidden /></span>
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
