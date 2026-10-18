import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { SubjectIcon } from '@/components/SubjectIcon';
import { ProgressBar } from '@/components/TextBlocks';
import { useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import { useUi } from '@/store/ui';
import type { Subject } from '@/types/content';

export function useSubjectProgress(s: Subject) {
  const studied = useUi((st) => st.studied[s.id]) ?? [];
  const done = s.steps.filter((x) => studied.includes(x.paragraphId)).length;
  return { done, total: s.steps.length, fraction: done / s.steps.length };
}

export function SubjectCard({ subject: s, featured = false }: { subject: Subject; featured?: boolean }) {
  const { t } = useTranslation();
  const lang = useLang();
  const { done, total, fraction } = useSubjectProgress(s);
  return (
    <Link
      to={`/subjects/${s.id}`}
      className={cn(
        'group flex h-full flex-col rounded-lg p-5 shadow-card transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0',
        featured ? 'bg-violet' : 'border border-line/70 bg-card',
      )}
    >
      <div className="flex items-start gap-4">
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', featured ? 'bg-card text-violet-fg' : 'bg-violet text-violet-fg')}>
          <SubjectIcon name={s.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="kicker">{t(`subjects.level.${s.level}`)}</p>
          <h3 className="mt-1 font-serif text-lg font-semibold leading-snug">{pick(lang, s.titleNl, s.titleEn)}</h3>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{pick(lang, s.taglineNl, s.taglineEn)}</p>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted">
        <span className="tabular">
          {t('subjects.minutes', { count: s.minutes })} · {t('subjects.steps', { count: total })}
        </span>
        {done === total ? (
          <span className="inline-flex items-center gap-1 font-semibold text-ok">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            {t('subjects.done')}
          </span>
        ) : done > 0 ? (
          <span className="tabular">{t('subjects.progress', { done, total })}</span>
        ) : null}
      </div>
      {done > 0 && <ProgressBar value={fraction} className="mt-2" />}
    </Link>
  );
}
