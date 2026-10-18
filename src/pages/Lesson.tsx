import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, ExternalLink, Share2 } from 'lucide-react';
import { Apa, ConciliarText, CiteLink, Crumbs, Loading, ProgressBar, SectionTitle } from '@/components/TextBlocks';
import { SubjectCard } from '@/components/SubjectCard';
import { VideoRow } from '@/components/VideoCard';
import { Quiz } from '@/components/Quiz';
import { SegmentedTabs, panelId, tabId } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getCatecheses, getLessons, getParagraph, getSubjects, getVideos } from '@/lib/content';
import { copyText, shortCite } from '@/lib/citation';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import { toRoman } from '@/lib/roman';
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
    <div className="border border-line bg-paper">
      <div className="h-[3px] bg-accent" aria-hidden />
      <div className="p-5">
        <p className="kicker">{t('learn.yourProgress')}</p>
        <p className="mt-2 text-sm tabular">{t('learn.done', { done: doneCount, total: lessons.length })}</p>
        <ProgressBar value={doneCount / lessons.length} className="mt-2" label={t('learn.done', { done: doneCount, total: lessons.length })} />
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t('learn.quiz')}</dt>
            <dd className="tabular">{state?.score != null ? `${state.score} / ${l.quiz.length}` : '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t('learn.lesson')}</dt>
            <dd>{state?.done ? <span className="font-semibold text-ok">{t('learn.completed')}</span> : '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="min-w-0">
        <div className="mb-2 flex items-start justify-between gap-3">
          <Crumbs items={[{ to: '/', label: t('crumbs.home') }, { to: '/learn', label: t('learn.title') }, { label: `${t('learn.lesson')} ${l.number}` }]} />
          <button type="button" className="inline-flex min-h-[32px] shrink-0 items-center gap-1.5 text-xs text-muted hover:text-accent" onClick={share}>
            <Share2 className="h-3.5 w-3.5" aria-hidden /> {t('learn.share')}
          </button>
        </div>

        <header className="mb-10">
          <p className="kicker">
            Lectio {toRoman(l.number)} · {t('learn.lessonOf', { n: l.number, total: lessons.length })}
          </p>
          <h1 className="mt-2 font-title text-[2.3rem] font-medium leading-[1.06] sm:text-[3.1rem]">{title}</h1>
          <div className="rule-double mt-5 max-w-[12rem]" aria-hidden />
          <p className="mt-5 max-w-prose font-serif text-[1.1rem] leading-relaxed text-fg/80">{pick(lang, l.summaryNl, l.summaryEn)}</p>
          <dl className="mt-6 grid max-w-xl grid-cols-3 divide-x divide-line border-y border-line text-sm">
            {[
              [t('home.colDuration'), t('learn.minutes', { count: l.minutes })],
              [t('learn.tabTexts'), String(data.paragraphs.length)],
              [t('learn.quiz'), String(l.quiz.length)],
            ].map(([k, v]) => (
              <div key={k} className="px-3 py-2 first:pl-0">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-0.5 font-medium tabular">{v}</dd>
              </div>
            ))}
          </dl>
          {state?.done && (
            <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ok">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> {t('learn.completed')}
            </p>
          )}
        </header>

        {/* Lesson material: pill tabs with list rows (texts, videos, catecheses) */}
        <section aria-labelledby="h-material" className="mb-10">
          <h2 id="h-material" className="kicker mb-1">
            {t('learn.materials')}
          </h2>
          <SegmentedTabs items={tabs} value={tab} onChange={setTab} label={t('learn.materials')} prefix="lesson" />
          <div role="tabpanel" id={panelId('lesson', tab)} aria-labelledby={tabId('lesson', tab)} tabIndex={0} className="outline-none">
            {tab === 'texts' &&
              (data.paragraphs.length ? (
                <ul className="divide-y divide-line border-b border-line">
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
                        className="group flex items-center gap-4 py-3 transition-colors hover:bg-surface/60"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-line font-serif text-base font-semibold text-accent">§</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-serif font-semibold group-hover:text-accent">{shortCite(paragraph.id)}</span>
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
                <p className="py-4 text-sm text-muted">{t('learn.noMaterial')}</p>
              ))}
            {tab === 'videos' &&
              (data.videos.length ? (
                <ul className="divide-y divide-line border-b border-line">
                  {data.videos.map((v) => (
                    <li key={v.youtubeId}>
                      <VideoRow video={v} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-sm text-muted">{t('learn.noMaterial')}</p>
              ))}
            {tab === 'catecheses' &&
              (data.catecheses.length ? (
                <ul className="divide-y divide-line border-b border-line">
                  {data.catecheses.map((c) => {
                    const d = dateParts(c.date, lang);
                    return (
                      <li key={c.date}>
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-3 transition-colors hover:bg-surface/60">
                          <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center border border-line text-accent">
                            <span className="font-serif text-base font-semibold leading-none tabular">{d.day}</span>
                            <span className="text-[0.6rem] uppercase">{d.month}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 font-serif font-semibold leading-snug group-hover:text-accent">{pick(lang, c.titleNl, c.titleEn)}</span>
                            <span className="block text-xs text-muted">Leo PP. XIV · Audientia generalis · vatican.va</span>
                          </span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-4 text-sm text-muted">{t('learn.noMaterial')}</p>
              ))}
          </div>
        </section>

        <div className="mb-8 lg:hidden">{progressCard}</div>

        {/* Key facts on mobile */}
        <dl className="mb-10 grid grid-cols-2 gap-px border border-line bg-line lg:hidden">
          {l.facts.map((f) => (
            <div key={f.labelNl} className="bg-card p-3">
              <dt className="text-xs text-muted">{pick(lang, f.labelNl, f.labelEn)}</dt>
              <dd className="mt-1 text-sm font-medium tabular">{pick(lang, f.valueNl, f.valueEn)}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-10">
          {l.sections.map((s, i) => (
            <section key={s.headingNl} aria-labelledby={`sec-${i}`}>
              <h2 id={`sec-${i}`} className="mb-3 flex items-baseline gap-3 font-title text-[1.6rem] font-medium leading-snug">
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
                    <CiteLink key={r} id={r} className="chip min-h-[32px] px-2.5 no-underline" />
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
          <h2 id="h-quiz" className="font-title text-[1.5rem] font-medium">
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
        <div className="sticky top-6 space-y-5">
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
                    className={cn('flex gap-2 border-l-2 py-1.5 pl-2', x.id === l.id ? 'border-accent bg-surface font-semibold text-accent' : 'border-transparent hover:text-accent')}
                  >
                    <span className="w-7 shrink-0 font-display text-xs leading-5 text-gold-text">{allLessons[x.id]?.done ? '✓' : toRoman(x.number)}</span>
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
