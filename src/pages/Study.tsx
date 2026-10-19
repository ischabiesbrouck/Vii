import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, ListTree } from 'lucide-react';
import { Apa, Crumbs, Loading } from '@/components/TextBlocks';
import { StudyBlockView } from '@/components/StudyText';
import { ReadingBar } from '@/components/ReadingBar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { getStudy, getSubjects } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import { useUi } from '@/store/ui';
import type { Study as StudyType } from '@/types/content';

function ChapterIndex({ subjectId, study, current, onPick }: { subjectId: string; study: StudyType; current: number; onPick?: () => void }) {
  const lang = useLang();
  const read = useUi((s) => s.studyRead[subjectId]) ?? [];
  return (
    <ol className="border-l border-line">
      {study.chapters.map((c, i) => {
        const n = i + 1;
        return (
          <li key={c.labelLa}>
            <Link
              to={`/subjects/${subjectId}/study/${n}`}
              onClick={onPick}
              aria-current={n === current ? 'page' : undefined}
              className={cn('-ml-px block border-l-2 py-1.5 pl-3 pr-1', n === current ? 'border-accent bg-surface' : 'border-transparent hover:border-gold')}
            >
              <span className={cn('flex items-center gap-1.5 font-title text-[0.95rem] small-caps', n === current ? 'text-accent' : 'text-gold-text')} lang="la">
                {c.labelLa}
                {read.includes(n) && <Check className="h-3.5 w-3.5 text-ok" aria-label="✓" />}
              </span>
              <span className="block font-serif text-[0.88rem] leading-snug">{pick(lang, c.titleNl, c.titleEn)}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function Study() {
  const { id = '', chapter = '1' } = useParams();
  const { t } = useTranslation();
  const lang = useLang();
  const markChapterRead = useUi((s) => s.markChapterRead);
  const [tocOpen, setTocOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const { data, loading } = useAsync(async () => {
    const [study, subjects] = await Promise.all([getStudy(id), getSubjects()]);
    return { study, subject: subjects.find((s) => s.id === id) };
  }, [id]);
  const n = Number(chapter);
  const ch = data?.study?.chapters[n - 1];
  const subjectTitle = data?.subject ? pick(lang, data.subject.titleNl, data.subject.titleEn) : '';
  useDocumentTitle(ch ? `${pick(lang, ch.titleNl, ch.titleEn)} · ${subjectTitle}` : undefined);

  // A chapter counts as read once its last line has been on screen.
  useEffect(() => {
    const end = document.getElementById('chapter-end');
    if (!end || !ch) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && markChapterRead(id, n), { threshold: 1 });
    io.observe(end);
    return () => io.disconnect();
  }, [id, n, ch, markChapterRead]);

  if (loading || !data) return <Loading />;
  const { study, subject } = data;
  if (!study || !subject) return <p className="py-8 text-center">{t('subjects.notFound')}</p>;
  if (!ch) return <Navigate to={`/subjects/${id}/study/1`} replace />;

  const total = study.chapters.length;
  const prev = study.chapters[n - 2];
  const next = study.chapters[n];
  let figure = 0;

  return (
    <div>
      <Crumbs
        items={[
          { to: '/', label: t('crumbs.home') },
          { to: '/subjects', label: t('nav.subjects') },
          { to: `/subjects/${id}`, label: subjectTitle },
          { label: t('study.title') },
        ]}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label={t('study.contents')}>
          <div className="sticky top-6">
            <p className="kicker">{t('study.title')}</p>
            <p className="mb-4 mt-1 font-title text-[1.15rem] font-medium leading-snug">{subjectTitle}</p>
            <ChapterIndex subjectId={id} study={study} current={n} />
            {n === total && (
              <a href="#bibliography" className="mt-3 block pl-3 text-sm text-accent hover:underline">
                {t('study.bibliography')}
              </a>
            )}
          </div>
        </aside>

        <article ref={articleRef} className="min-w-0 max-w-[44rem]">
          <ReadingBar target={articleRef} />
          {/* Running head, as in a printed book */}
          <div className="mb-8 flex items-center justify-between gap-3 border-b border-line pb-2 text-xs text-muted">
            <span className="truncate font-title text-[0.95rem] italic">{subjectTitle}</span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="tabular">{t('study.page', { n, total })}</span>
              <button type="button" onClick={() => setTocOpen(true)} className="inline-flex min-h-[36px] items-center gap-1 rounded-sm border border-line px-2 text-fg lg:hidden" aria-label={t('study.contents')}>
                <ListTree className="h-4 w-4" aria-hidden /> {t('study.contents')}
              </button>
            </span>
          </div>

          <header className="mb-8 text-center">
            <p className="font-title text-[1.1rem] uppercase tracking-[0.18em] text-accent" lang="la">
              {ch.labelLa}
            </p>
            <h1 className="mx-auto mt-2 max-w-[24ch] font-title text-[2.2rem] font-medium leading-[1.1] sm:text-[2.8rem]">{pick(lang, ch.titleNl, ch.titleEn)}</h1>
            <div className="rule-ornament mx-auto mt-5 max-w-[12rem]" aria-hidden>
              <span className="text-[0.5rem]">◆</span>
            </div>
            <p className="mx-auto mt-5 max-w-prose font-serif text-[1.05rem] italic leading-relaxed text-fg/80">{pick(lang, ch.summaryNl, ch.summaryEn)}</p>
          </header>

          <p className="mb-8 border-y border-dashed border-line py-2 text-center font-sans text-xs text-muted">
            {t('study.editorial')}
            {study.review === 'unverified' && ` · ${t('doc.unverified')}`}
          </p>

          {ch.sections.length > 1 && (
            <nav aria-label={t('study.inChapter')} className="mb-10 font-sans text-sm">
              <p className="kicker mb-1">{t('study.inChapter')}</p>
              <ol>
                {ch.sections.map((s, i) => (
                  <li key={s.headingNl}>
                    <a href={`#sec-${n}-${i + 1}`} className="inline-block py-1.5 hover:text-accent hover:underline">
                      <span className="tabular text-muted">
                        {n}.{i + 1}
                      </span>{' '}
                      {pick(lang, s.headingNl, s.headingEn)}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="font-serif text-[1.08rem] leading-[1.8]">
            {ch.sections.map((s, si) => (
              <section key={s.headingNl} aria-labelledby={`sec-${n}-${si + 1}`} className="mt-10 first:mt-0">
                <h2 id={`sec-${n}-${si + 1}`} className="scroll-mt-24 font-title text-[1.6rem] font-medium leading-snug">
                  <span className="mr-2 font-sans text-sm tabular text-gold-text">
                    {n}.{si + 1}
                  </span>
                  {pick(lang, s.headingNl, s.headingEn)}
                </h2>
                {s.blocks.map((b, bi) => {
                  if (b.type === 'diagram' || b.type === 'image') figure++;
                  const firstP = si === 0 && bi === s.blocks.findIndex((x) => x.type === 'p');
                  return <StudyBlockView key={bi} block={b} figure={figure} first={firstP} />;
                })}
              </section>
            ))}
          </div>
          <div id="chapter-end" className="h-px" aria-hidden />

          {n === total && (
            <section id="bibliography" aria-labelledby="h-bib" className="mt-14 scroll-mt-24">
              <h2 id="h-bib" className="mb-3 border-b border-fg/70 pb-2 font-title text-[1.5rem] font-medium">
                {t('study.bibliography')}
              </h2>
              <ul className="space-y-2">
                {study.bibliography.map((b) => (
                  <li key={b} className="pl-6 -indent-6">
                    <Apa citation={b} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Folio and pager */}
          <p className="mt-12 text-center font-title text-sm text-muted" aria-hidden>
            — {n} —
          </p>
          <nav aria-label={t('study.pager')} className="mt-4 grid gap-3 border-t border-fg/70 pt-6 sm:grid-cols-2">
            {prev ? (
              <Link to={`/subjects/${id}/study/${n - 1}`} className="panel-link p-4">
                <span className="kicker inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" aria-hidden /> {prev.labelLa}
                </span>
                <span className="mt-1 block font-title text-[1.15rem]">{pick(lang, prev.titleNl, prev.titleEn)}</span>
              </Link>
            ) : (
              <Link to={`/subjects/${id}`} className="panel-link p-4">
                <span className="kicker inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" aria-hidden /> {t('study.backToSubject')}
                </span>
                <span className="mt-1 block font-title text-[1.15rem]">{subjectTitle}</span>
              </Link>
            )}
            {next ? (
              <Link to={`/subjects/${id}/study/${n + 1}`} className="panel-link p-4 text-right">
                <span className="kicker inline-flex items-center gap-1">
                  {next.labelLa} <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
                <span className="mt-1 block font-title text-[1.15rem]">{pick(lang, next.titleNl, next.titleEn)}</span>
              </Link>
            ) : (
              <Link to={`/subjects/${id}`} className="panel-link p-4 text-right">
                <span className="kicker inline-flex items-center gap-1">
                  {t('study.toReadingPath')} <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
                <span className="mt-1 block font-title text-[1.15rem]">{subjectTitle}</span>
              </Link>
            )}
          </nav>
        </article>
      </div>

      <Sheet open={tocOpen} onOpenChange={setTocOpen}>
        <SheetContent title={t('study.contents')} description={subjectTitle} closeLabel={t('app.close')}>
          <ChapterIndex subjectId={id} study={study} current={n} onPick={() => setTocOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
