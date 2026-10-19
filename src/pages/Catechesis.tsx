import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loading, PageHeader } from '@/components/TextBlocks';
import { SubjectIcon } from '@/components/SubjectIcon';
import { getShortCatecheses } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { toRoman } from '@/lib/roman';
import { pick } from '@/lib/utils';

/** The series of short catecheses, as a numbered table of questions. */
export function Catechesis() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, loading } = useAsync(getShortCatecheses, []);
  useDocumentTitle(t('sc.title'));
  if (loading || !data) return <Loading />;
  return (
    <div>
      <PageHeader eyebrow={`Catechesis brevis · ${toRoman(data.length)}`} title={t('sc.title')} intro={t('sc.intro')}>
        <p className="mt-3 text-xs text-muted">{t('sc.refsHint')}</p>
      </PageHeader>
      <ol className="grid border-t border-fg/70 lg:grid-cols-2 lg:gap-x-12">
        {data.map((c) => (
          <li key={c.id} className="border-b border-line">
            <Link to={`/catechesis/${c.id}`} className="group grid grid-cols-[3rem_minmax(0,1fr)] gap-3 py-5">
              <span className="pt-1 font-display text-base font-semibold text-accent">{toRoman(c.number)}</span>
              <span className="min-w-0">
                <span className="block font-title text-[1.4rem] font-medium leading-snug group-hover:text-accent group-hover:underline">{pick(lang, c.questionNl, c.questionEn)}</span>
                <span className="mt-1 flex items-center gap-2 text-sm text-muted">
                  <SubjectIcon name={c.icon} className="h-4 w-4 shrink-0 text-gold-text" />
                  <span className="truncate">{pick(lang, c.titleNl, c.titleEn)}</span>
                  <span className="shrink-0 tabular">· {t('learn.minutes', { count: c.minutes })}</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
