import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Clock, ExternalLink, Share2 } from 'lucide-react';
import { Apa, ConciliarText, CiteLink, Loading, ProgressBar, SectionTitle } from '@/components/TextBlocks';
import { SubjectCard } from '@/components/SubjectCard';
import { VideoRow } from '@/components/VideoCard';
import { Quiz } from '@/components/Quiz';
import { ProgressRing } from '@/components/ProgressRing';
import { Orbs } from '@/components/Orbs';
import { SegmentedTabs, panelId, tabId } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getCatecheses, getLessons, getParagraph, getSubjects, getVideos } from '@/lib/content';
import { copyText, shortCite } from '@/lib/citation';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import { useUi } from '@/store/ui';
import { useToast } from '@/store/toast';

type Tab = 'texts' | 'videos' | 'catecheses';

const dateParts = (iso: string, lang: 'nl' | 'en') => {
  const d = new Date(`${iso}T12:00:00`);
  return { day: d.getDate(), month: d.toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { month: 'short' }).replace('.', '') };
};

export function Lesson() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const lang = useLang();
  const state = useUi((s) => s.lessons[id]);
  const setLesson = useUi((s) => s.setLesson);
  const allLessons = useUi((s) => s.lessons);
  const show = useToast((s) => s.show);
  const [tab, setTab] = useState<Tab>('texts');

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

  const share = async () => {
    const url = new URL(`${import.meta.env.BASE_URL}learn/${l.id}`, location.origin).href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
    } else if (await copyText(url)) {
      show(t('learn.linkCopied'));
    }
  };

  const tabs = [
    { id: 'texts' as const, label: t('learn.tabTexts'), count: data.paragraphs.length },
    { id: 'videos' as const, label: t('learn.tabVideos'), count: data.videos.length },
    { id: 'catecheses' as const, label: t('learn.tabCatecheses'), count: data.catecheses.length },
  ];

  const progressCard = (
    <div className="relative overflow-hidden rounded-xl bg-violet p-5">
      <Orbs preset="small" />
      <p className="relative font-display text-[0.68rem] font-semibold uppercase tracking-caps text-violet-fg">{t('learn.yourProgress')}</p>
      <div className="relative mt-3 flex items-center gap-4">
        <ProgressRing value={doneCount / lessons.length} size={84} stroke={8} label={t('learn.done', { done: doneCount, total: lessons.length })} className="text-violet-fg">
          <span className="font-serif text-xl font-semibold tabular">{Math.round((doneCount / lessons.length) * 100)}%</span>
        </ProgressRing>
        <div className="min-w-0 text-sm">
          <p className="tabular">{t('learn.done', { done: doneCount, total: lessons.length })}</p>
          <p className="mt-1 text-fg/70">
            {state?.score != null ? t('learn.quizDone', { score: state.score, total: l.quiz.length }) : t('learn.quizTodo')}
          </p>
          {state?.done && (
            <p className="mt-1 inline-flex items-center gap-1 font-semibold text-violet-fg">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> {t('learn.completed')}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="min-w-0">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/learn" className="icon-btn" aria-label={t('learn.back')}>
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <span className="rounded-full border border-line/70 bg-card px-3 py-1.5 text-xs tabular text-muted shadow-card">
            {t('learn.lessonOf', { n: l.number, total: lessons.length })}
          </span>
          <button type="button" className="icon-btn" onClick={share} aria-label={t('learn.share')}>
            <Share2 className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>

        <header className="mb-8">
          <p className="kicker">{l.labelLa}</p>
          <h1 className="mt-3 font-serif text-[2.4rem] font-medium leading-[1.04] tracking-[-0.015em] sm:text-[3.4rem]">{title}</h1>
          <p className="mt-4 max-w-prose text-[1.08rem] leading-relaxed text-muted">{pick(lang, l.summaryNl, l.summaryEn)}</p>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1.5 shadow-card">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {t('learn.minutes', { count: l.minutes })}
            </span>
            {state?.done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sage px-3 py-1.5 font-semibold text-sage-fg">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {t('learn.completed')}
              </span>
            )}
          </p>
        </header>

        {/* Lesson material: pill tabs with list rows (texts, videos, catecheses) */}
        <section aria-labelledby="h-material" className="panel mb-6 p-4 sm:p-5">
          <h2 id="h-material" className="sr-only">
            {t('learn.materials')}
          </h2>
          <SegmentedTabs items={tabs} value={tab} onChange={setTab} label={t('learn.materials')} prefix="lesson" className="w-full sm:w-auto" />
          <div role="tabpanel" id={panelId('lesson', tab)} aria-labelledby={tabId('lesson', tab)} tabIndex={0} className="mt-3 rounded-lg outline-none">
            {tab === 'texts' &&
              (data.paragraphs.length ? (
                <ul className="space-y-1">
                  {data.paragraphs.map(({ paragraph, doc }) => (
                    <li key={paragraph.id}>
                      <a
                        href={`#read-${paragraph.id}`}
                        onClick={(e) => {
                          // Scroll within the page without a router navigation.
                          e.preventDefault();
                          const el = document.getElementById(`read-${paragraph.id}`);
                          el?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
                          el?.focus({ preventScroll: true });
                        }}
                        className="group flex items-center gap-4 rounded-lg p-2 transition hover:bg-violet/50"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-bg font-serif text-sm font-semibold text-accent">§</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{shortCite(paragraph.id)}</span>
                          <span className="block truncate text-xs text-muted" lang="la">
                            {doc.titleLa}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-3 text-sm text-muted">{t('learn.noMaterial')}</p>
              ))}
            {tab === 'videos' &&
              (data.videos.length ? (
                <ul className="space-y-1">
                  {data.videos.map((v) => (
                    <li key={v.youtubeId}>
                      <VideoRow video={v} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-3 text-sm text-muted">{t('learn.noMaterial')}</p>
              ))}
            {tab === 'catecheses' &&
              (data.catecheses.length ? (
                <ul className="space-y-1">
                  {data.catecheses.map((c) => {
                    const d = dateParts(c.date, lang);
                    return (
                      <li key={c.date}>
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-lg p-2 transition hover:bg-rose/60">
                          <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full bg-rose text-rose-fg">
                            <span className="font-serif text-base font-semibold leading-none tabular">{d.day}</span>
                            <span className="text-[0.6rem] uppercase">{d.month}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 font-medium leading-snug">{pick(lang, c.titleNl, c.titleEn)}</span>
                            <span className="block text-xs text-muted">Leo PP. XIV · vatican.va</span>
                          </span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="p-3 text-sm text-muted">{t('learn.noMaterial')}</p>
              ))}
          </div>
        </section>

        <div className="mb-8 lg:hidden">{progressCard}</div>

        {/* Key facts on mobile */}
        <dl className="mb-10 grid grid-cols-2 gap-3 lg:hidden">
          {l.facts.map((f) => (
            <div key={f.labelNl} className="rounded-lg bg-card p-4 shadow-card">
              <dt className="text-xs text-muted">{pick(lang, f.labelNl, f.labelEn)}</dt>
              <dd className="mt-1 text-sm font-medium tabular">{pick(lang, f.valueNl, f.valueEn)}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-10">
          {l.sections.map((s, i) => (
            <section key={s.headingNl} aria-labelledby={`sec-${i}`}>
              <h2 id={`sec-${i}`} className="mb-3 flex items-baseline gap-3 font-serif text-[1.5rem] font-semibold leading-snug">
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
                    <CiteLink key={r} id={r} className="chip min-h-[34px] px-3 no-underline" />
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
                <div key={paragraph.id} id={`read-${paragraph.id}`} tabIndex={-1} className="scroll-mt-28 rounded-md outline-none">
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

        <section aria-labelledby="h-quiz" className="panel mt-12 p-5 sm:p-7">
          <h2 id="h-quiz" className="font-serif text-[1.4rem] font-semibold">
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

        <nav aria-label={t('nav.course')} className="mt-12 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link to={`/learn/${prev.id}`} className="panel-link p-5">
              <span className="kicker inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" aria-hidden /> {t('learn.prev')}
              </span>
              <span className="mt-1 block font-serif font-semibold">{pick(lang, prev.titleNl, prev.titleEn)}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/learn/${next.id}`} className="panel-link p-5 text-right">
              <span className="kicker inline-flex items-center gap-1">
                {t('learn.next')} <ArrowRight className="h-3 w-3" aria-hidden />
              </span>
              <span className="mt-1 block font-serif font-semibold">{pick(lang, next.titleNl, next.titleEn)}</span>
            </Link>
          )}
        </nav>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-[calc(8.5rem+env(safe-area-inset-top))] space-y-5">
          {progressCard}
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
            <ProgressBar value={doneCount / lessons.length} />
            <ol className="mt-4 space-y-0.5 text-sm">
              {lessons.map((x) => (
                <li key={x.id}>
                  <Link
                    to={`/learn/${x.id}`}
                    aria-current={x.id === l.id ? 'page' : undefined}
                    className={cn('flex gap-2 rounded-full px-2 py-1.5', x.id === l.id ? 'bg-primary font-semibold text-primary-fg' : 'hover:bg-violet/60')}
                  >
                    <span className="w-5 shrink-0 text-right text-xs tabular opacity-70">{allLessons[x.id]?.done ? '✓' : x.number}</span>
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
