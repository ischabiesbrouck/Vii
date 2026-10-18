import { useTranslation } from 'react-i18next';
import { Loading, PageHeader, SectionTitle } from '@/components/TextBlocks';
import { SubjectCard } from '@/components/SubjectCard';
import { getSubjects } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle } from '@/lib/hooks';
import type { SubjectLevel } from '@/types/content';

const levels: SubjectLevel[] = ['start', 'core', 'deeper'];

export function Subjects() {
  const { t } = useTranslation();
  const { data: subjects, loading } = useAsync(getSubjects, []);
  useDocumentTitle(t('subjects.title'));
  if (loading || !subjects) return <Loading />;

  return (
    <div>
      <PageHeader eyebrow={t('app.tagline')} title={t('subjects.title')} intro={t('subjects.intro')} />
      <div className="space-y-12">
        {levels.map((level) => {
          const group = subjects.filter((s) => s.level === level);
          if (!group.length) return null;
          return (
            <section key={level} aria-labelledby={`h-${level}`}>
              <SectionTitle id={`h-${level}`}>{t(`subjects.level.${level}`)}</SectionTitle>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((s) => (
                  <li key={s.id}>
                    <SubjectCard subject={s} featured={level === 'start'} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
