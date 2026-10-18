import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpenText, CheckCircle2, Film, GraduationCap, ScrollText } from 'lucide-react';
import { Loading, PageHeader, ProgressBar, SectionTitle } from '@/components/TextBlocks';
import { toRoman } from '@/lib/roman';
import { getCatecheses, getLessons, getSubjects, getVideos } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { formatDate, pick } from '@/lib/utils';
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
        <div className="mb-8 grid grid-cols-[minmax(0,1fr)] gap-8 border-y border-line py-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="kicker">Cursus Concilii</p>
            <h2 id="h-course" className="mt-1 font-title text-[2rem] font-medium leading-tight">
              {t('learn.courseTitle')}
            </h2>
            <p className="mt-2 max-w-prose text-muted">{t('learn.courseLead')}</p>
          </div>
          <div>
            <p className="mb-2 text-sm tabular text-muted">{t('learn.done', { done, total: lessons.length })}</p>
            <ProgressBar value={done / lessons.length} label={t('learn.done', { done, total: lessons.length })} />
            <Link
              to={`/learn/${next.id}`}
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary/90"
            >
              {done === 0 ? t('learn.start') : t('learn.resume', { n: next.number })}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <table className="table-academic">
          <caption className="sr-only">{t('learn.courseTitle')}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-16">
                {t('home.colLesson')}
              </th>
              <th scope="col">{t('home.colTopic')}</th>
              <th scope="col" className="w-24 text-right">
                {t('home.colDuration')}
              </th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => {
              const isDone = progress[l.id]?.done;
              return (
                <tr key={l.id}>
                  <td className="font-display text-sm font-semibold text-accent">{toRoman(l.number)}</td>
                  <td>
                    <Link to={`/learn/${l.id}`} className="font-title text-[1.3rem] font-medium leading-snug hover:text-accent hover:underline">
                      {pick(lang, l.titleNl, l.titleEn)}
                    </Link>
                    <span className="mt-0.5 block text-sm leading-snug text-muted">{pick(lang, l.summaryNl, l.summaryEn)}</span>
                  </td>
                  <td className="whitespace-nowrap text-right tabular text-muted">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-ok">
                        <CheckCircle2 className="h-4 w-4" aria-hidden /> <span className="sr-only">{t('learn.completed')}</span>
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

      <section aria-labelledby="h-explore">
        <SectionTitle id="h-explore">{t('learn.explore')}</SectionTitle>
        <ul className="grid gap-4 md:grid-cols-3">
          <li>
            <Link to="/subjects" className="panel-link flex h-full flex-col p-5">
              <GraduationCap className="h-6 w-6 text-gold-text" aria-hidden />
              <span className="mt-3 font-title text-[1.35rem] font-medium">{t('nav.subjects')}</span>
              <span className="mt-1 flex-1 text-sm text-muted">{t('home.subjectsLead')}</span>
              <span className="mt-3 text-xs tabular text-muted">{subjects.length} {t('home.statSubjects')}</span>
            </Link>
          </li>
          <li>
            <Link to="/catecheses" className="panel-link flex h-full flex-col p-5">
              <ScrollText className="h-6 w-6 text-gold-text" aria-hidden />
              <span className="mt-3 font-title text-[1.35rem] font-medium">{pick(lang, cat.seriesTitleNl, cat.seriesTitleEn)}</span>
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
              <span className="mt-3 font-title text-[1.35rem] font-medium">{t('video.title')}</span>
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
