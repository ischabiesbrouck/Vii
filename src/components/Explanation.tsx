import { useTranslation } from 'react-i18next';
import { Cited } from '@/components/StudyText';
import { useLang } from '@/lib/hooks';
import type { Paragraph, ParagraphExplanation } from '@/types/content';

const KEYS: (keyof ParagraphExplanation)[] = ['what', 'who', 'why', 'how', 'meaning'];

/** Plain-language explanation of a paragraph: what, to whom, why, how, and what is meant. */
export function Explanation({ paragraph }: { paragraph: Paragraph }) {
  const { t } = useTranslation();
  const lang = useLang();
  const ex = paragraph.explain?.[lang];
  if (!ex) return null;
  return (
    <section aria-label={t('explain.title')} className="mt-5">
      <p className="rubric-label mb-2">{t('explain.title')}</p>
      <dl className="divide-y divide-line border-y border-line">
        {KEYS.map((k) => (
          <div key={k} className="grid gap-1 py-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4">
            <dt className="font-title text-[1.02rem] font-medium leading-snug text-accent">{t(`explain.${k}`)}</dt>
            <dd className="font-serif text-[0.98rem] leading-relaxed">
              <Cited text={ex[k]} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">{t('explain.status')}</p>
    </section>
  );
}
