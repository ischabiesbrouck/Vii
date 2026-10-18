import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Apa, ConciliarText, CiteLink, Crumbs, Loading, ProgressBar, SectionTitle } from '@/components/TextBlocks';
import { SubjectCard } from '@/components/SubjectCard';
import { VideoCard } from '@/components/VideoCard';
import { Quiz } from '@/components/Quiz';
import { Button } from '@/components/ui/button';
import { getCatecheses, getLessons, getParagraph, getSubjects, getVideos } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { formatDate, pick } from '@/lib/utils';
import { useUi } from '@/store/ui';
import { useToast } from '@/store/toast';

export function Lesson() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const lang = useLang();
  const state = useUi((s) => s.lessons[id]);
  const setLesson = useUi((s) => s.setLesson);
  const allLessons = useUi((s) => s.lessons);
  const show = useToast((s) => s.show);

  const { data, loading } = useAsync(async () => {
    const [lessons, cat, videos, subjects] = await Promise.all([getLessons(), getCatecheses(), getVideos(), getSubjects()]);
    const i = lessons.findIndex((l) => l.id === id);
    const lesson = lessons[i];
    if (!lesson) return null;
    const paragraphs = (await Promise.all(lesson.paragraphs.map((p) => getParagraph(p)))).filter((x): x is NonNullable<typeof x> => !!x);
    return {
      lesson,
      lessons,
      prev: lessons[i - 1],
      next: lessons[i + 1],
      paragraphs,
      catecheses: lesson.catecheses.map((d) => cat.items.find((c) => c.date === d)).filter((x): x is NonNullable<typeof x> => !!x),
      videos: lesson.videos.map((v) => videos.items.find((x) => x.youtubeId === v)).filter((x): x is NonNullable<typeof x> => !!x),
      subjects: lesson.subjects.map((sId) => subjects.find((x) => x.id === sId)).filter((x): x is NonNullable<typeof x> => !!x),
    };
  }, [id]);

  useDocumentTitle(data ? pick(lang, data.lesson.titleNl, data.lesson.titleEn) : undefined);
  if (loading) return <Loading />;
  if (!data) return <p className="py-8 text-center">{t('learn.notFound')}</p>;
  const { lesson: l, lessons, prev, next } = data;
  const title = pick(lang, l.titleNl, l.titleEn);
  const doneCount = lessons.filter((x) => allLessons[x.id]?.done).length;

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0">
        <Crumbs items={[{ to: '/', label: t('crumbs.home') }, { to: '/learn', label: t('learn.title') }, { label: `${t('learn.lesson')} ${l.number}` }]} />
        <header className="mb-8">
          <p className="kicker">
            {l.labelLa} · {t('learn.lesson')} {l.number} / {lessons.length}
          </p>
          <h1 className="mt-2 font-serif text-[1.85rem] font-semibold leading-tight sm:text-[2.6rem]">{title}</h1>
          <p className="mt-3 max-w-prose text-[1.08rem] leading-relaxed text-muted">{pick(lang, l.summaryNl, l.summaryEn)}</p>
          <p className="mt-3 flex items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {t('learn.minutes', { count: l.minutes })}
            </span>
            {state?.done && (
              <span className="inline-flex items-center gap-1 font-semibold text-ok">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {t('learn.completed')}
              </span>
            )}
          </p>
          <div className="rule-ornament mt-6" aria-hidden>
            <span className="text-[0.55rem]">◆</span>
          </div>
        </header>

        {/* Key facts on mobile */}
        <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:hidden">
          {l.facts.map((f) => (
            <div key={f.labelNl} className="bg-card p-3">
              <dt className="kicker">{pick(lang, f.labelNl, f.labelEn)}</dt>
              <dd className="mt-1 text-sm tabular">{pick(lang, f.valueNl, f.valueEn)}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-10">
          {l.sections.map((s, i) => (
            <section key={s.headingNl} aria-labelledby={`sec-${i}`}>
              <h2 id={`sec-${i}`} className="mb-3 flex items-baseline gap-3 font-serif text-[1.45rem] font-semibold leading-snug">
                <span className="font-display text-sm text-gold-text" aria-hidden>
                  {['I', 'II', 'III', 'IV', 'V'][i]}
                </span>
                {pick(lang, s.headingNl, s.headingEn)}
              </h2>
              <p className="max-w-prose text-[1.05rem] leading-[1.75] first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[3.1rem] first-letter:leading-[0.85] first-letter:text-accent">
                {pick(lang, s.bodyNl, s.bodyEn)}
              </p>
              {s.refs.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-2 text-sm">
                  {s.refs.map((r) => (
                    <CiteLink key={r} id={r} className="inline-flex min-h-[32px] items-center rounded border border-line bg-card px-2.5 no-underline hover:border-gold" />
                  ))}
                </p>
              )}
            </section>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted">
          {t('commentary')} · {t('doc.unverified')}
        </p>

        {data.paragraphs.length > 0 && (
          <section aria-labelledby="h-read" className="mt-12">
            <SectionTitle id="h-read">{t('learn.readText')}</SectionTitle>
            <div className="space-y-4">
              {data.paragraphs.map(({ paragraph, doc }) => (
                <div key={paragraph.id}>
                  <p className="mb-1.5 text-xs text-muted">
                    <span lang="la" className="la">
                      {doc.titleLa}
                    </span>
                  </p>
                  <ConciliarText paragraph={paragraph} />
                </div>
              ))}
            </div>
          </section>
        )}

        {data.catecheses.length > 0 && (
          <section aria-labelledby="h-cat" className="mt-12">
            <SectionTitle id="h-cat">{t('learn.catecheses')}</SectionTitle>
            <ul className="divide-y divide-line border-y border-line">
              {data.catecheses.map((c) => (
                <li key={c.date} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                  <span className="min-w-0">
                    <span className="block text-xs text-gold-text tabular">{formatDate(c.date, lang)}</span>
                    <span className="font-serif font-semibold">{pick(lang, c.titleNl, c.titleEn)}</span>
                  </span>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                    vatican.va <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.videos.length > 0 && (
          <section aria-labelledby="h-vid" className="mt-12">
            <SectionTitle id="h-vid">{t('learn.videos')}</SectionTitle>
            <ul className="grid gap-4 sm:grid-cols-2">
              {data.videos.map((v) => (
                <li key={v.youtubeId}>
                  <VideoCard video={v} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="h-quiz" className="mt-12 rounded-md border border-line bg-card p-5 sm:p-6">
          <h2 id="h-quiz" className="font-display text-sm font-semibold uppercase tracking-caps">
            {t('learn.quiz')}
          </h2>
          <p className="mb-5 mt-1 text-sm text-muted">{t('learn.quizHint')}</p>
          <Quiz key={l.id} lesson={l} onScore={(score) => setLesson(l.id, { score })} />
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            variant={state?.done ? 'outline' : 'default'}
            onClick={() => {
              setLesson(l.id, { done: !state?.done });
              if (!state?.done) show(t('learn.marked'));
            }}
            aria-pressed={!!state?.done}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {state?.done ? t('learn.completed') : t('learn.markDone')}
          </Button>
        </div>

        {data.subjects.length > 0 && (
          <section aria-labelledby="h-sub" className="mt-12">
            <SectionTitle id="h-sub">{t('learn.subjects')}</SectionTitle>
            <ul className="grid gap-4 sm:grid-cols-2">
              {data.subjects.map((s) => (
                <li key={s.id}>
                  <SubjectCard subject={s} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="h-src" className="mt-12">
          <SectionTitle id="h-src">{t('learn.sources')}</SectionTitle>
          <ul className="space-y-2">
            {l.sources.map((s) => (
              <li key={s} className="pl-6 -indent-6">
                <Apa citation={s} />
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label={t('nav.course')} className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
          {prev ? (
            <Link to={`/learn/${prev.id}`} className="panel-link p-4">
              <span className="kicker inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" aria-hidden /> {t('learn.prev')}
              </span>
              <span className="mt-1 block font-serif font-semibold">{pick(lang, prev.titleNl, prev.titleEn)}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/learn/${next.id}`} className="panel-link p-4 text-right">
              <span className="kicker inline-flex items-center gap-1">
                {t('learn.next')} <ArrowRight className="h-3 w-3" aria-hidden />
              </span>
              <span className="mt-1 block font-serif font-semibold">{pick(lang, next.titleNl, next.titleEn)}</span>
            </Link>
          )}
        </nav>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-[calc(7.5rem+env(safe-area-inset-top))] space-y-5">
          <div className="panel p-5">
            <p className="kicker mb-3">{t('learn.keyFacts')}</p>
            <dl className="space-y-3">
              {l.facts.map((f) => (
                <div key={f.labelNl}>
                  <dt className="text-xs text-muted">{pick(lang, f.labelNl, f.labelEn)}</dt>
                  <dd className="text-sm font-medium tabular">{pick(lang, f.valueNl, f.valueEn)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="panel p-5">
            <p className="kicker mb-2">{t('nav.course')}</p>
            <p className="mb-2 text-xs tabular text-muted">{t('learn.done', { done: doneCount, total: lessons.length })}</p>
            <ProgressBar value={doneCount / lessons.length} />
            <ol className="mt-4 space-y-1 text-sm">
              {lessons.map((x) => (
                <li key={x.id}>
                  <Link
                    to={`/learn/${x.id}`}
                    aria-current={x.id === l.id ? 'page' : undefined}
                    className={x.id === l.id ? 'flex gap-2 font-semibold text-accent' : 'flex gap-2 hover:text-accent'}
                  >
                    <span className="w-5 shrink-0 text-right text-xs tabular text-muted">{allLessons[x.id]?.done ? '✓' : x.number}</span>
                    <span className="truncate">{pick(lang, x.titleNl, x.titleEn)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>
    </article>
  );
}
