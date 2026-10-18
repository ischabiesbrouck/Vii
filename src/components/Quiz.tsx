import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CiteLink } from '@/components/TextBlocks';
import { useLang } from '@/lib/hooks';
import { seededOrder } from '@/lib/shuffle';
import { cn, pick } from '@/lib/utils';
import type { Lesson } from '@/types/content';

/** Factual knowledge check. Answers stay local; the best score is saved per lesson. */
export function Quiz({ lesson, onScore }: { lesson: Lesson; onScore: (score: number) => void }) {
  const { t } = useTranslation();
  const lang = useLang();
  const [picked, setPicked] = useState<(number | null)[]>(() => lesson.quiz.map(() => null));
  const [checked, setChecked] = useState(false);
  const score = picked.filter((p, i) => p === lesson.quiz[i]?.answer).length;
  const complete = picked.every((p) => p !== null);

  return (
    <div>
      <ol className="space-y-6">
        {lesson.quiz.map((q, qi) => (
          <li key={qi}>
            <fieldset>
              <legend className="mb-3 font-serif text-[1.05rem] font-semibold">
                <span className="mr-2 text-accent tabular">{qi + 1}.</span>
                {pick(lang, q.questionNl, q.questionEn)}
              </legend>
              <div className="grid gap-2">
                {seededOrder(`${lesson.id}-${qi}`, q.options.length).map((oi) => {
                  const o = q.options[oi]!;
                  const isPicked = picked[qi] === oi;
                  const isRight = oi === q.answer;
                  const id = `q-${lesson.id}-${qi}-${oi}`;
                  return (
                    <label
                      key={oi}
                      htmlFor={id}
                      className={cn(
                        'flex min-h-[44px] cursor-pointer items-center gap-3 rounded border px-3 py-2 text-sm transition-colors',
                        !checked && (isPicked ? 'border-accent bg-surface' : 'border-line bg-card hover:border-gold'),
                        checked && isRight && 'border-ok bg-ok/10',
                        checked && isPicked && !isRight && 'border-bad bg-bad/10',
                        checked && !isPicked && !isRight && 'border-line opacity-70',
                      )}
                    >
                      <input
                        type="radio"
                        id={id}
                        name={`q-${lesson.id}-${qi}`}
                        checked={isPicked}
                        disabled={checked}
                        onChange={() => setPicked((p) => p.map((x, i) => (i === qi ? oi : x)))}
                        className="h-4 w-4 accent-[rgb(var(--accent))]"
                      />
                      <span className="flex-1">{pick(lang, o.nl, o.en)}</span>
                      {checked && isRight && <Check className="h-4 w-4 text-ok" aria-label={t('learn.correct')} />}
                      {checked && isPicked && !isRight && <X className="h-4 w-4 text-bad" aria-label={t('learn.wrong')} />}
                    </label>
                  );
                })}
              </div>
              {checked && (
                <p className="mt-2 text-sm text-muted" role="status">
                  <span className={picked[qi] === q.answer ? 'font-semibold text-ok' : 'font-semibold text-bad'}>
                    {picked[qi] === q.answer ? t('learn.correct') : t('learn.wrong')}.
                  </span>{' '}
                  {pick(lang, q.explainNl, q.explainEn)} {q.ref && <CiteLink id={q.ref} />}
                </p>
              )}
            </fieldset>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!checked ? (
          <Button
            disabled={!complete}
            onClick={() => {
              setChecked(true);
              onScore(score);
            }}
          >
            {t('learn.check')}
          </Button>
        ) : (
          <>
            <p className="font-serif text-lg font-semibold" role="status">
              {t('learn.score', { score, total: lesson.quiz.length })}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setChecked(false);
                setPicked(lesson.quiz.map(() => null));
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> {t('learn.retry')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
