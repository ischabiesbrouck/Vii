import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CiteLink, Loading, PageHeader } from '@/components/TextBlocks';
import { getGlossary } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function Glossary() {
  const { t } = useTranslation();
  const lang = useLang();
  const location = useLocation();
  const { data: terms, loading } = useAsync(getGlossary, []);
  const [q, setQ] = useState('');
  const [onlyDisputed, setOnlyDisputed] = useState(false);
  useDocumentTitle(t('glossary.title'));

  const shown = useMemo(() => {
    const f = fold(q);
    return (terms ?? [])
      .filter((g) => !onlyDisputed || g.disputed)
      .filter((g) => !f || fold([g.term, g.termEn, g.definitionNl, g.definitionEn].join(' ')).includes(f))
      .sort((a, b) => pick(lang, a.term, a.termEn).localeCompare(pick(lang, b.term, b.termEn), lang));
  }, [terms, q, onlyDisputed, lang]);

  useEffect(() => {
    if (!location.hash || !terms) return;
    document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'start' });
  }, [location.hash, terms]);

  if (loading || !terms) return <Loading />;

  return (
    <div>
      <PageHeader title={t('glossary.title')} intro={t('home.glossaryTeaser')} />
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="gq" className="sr-only">
          {t('glossary.filter')}
        </label>
        <Input id="gq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('glossary.filter')} />
        <label className="flex min-h-[44px] shrink-0 items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyDisputed} onChange={(e) => setOnlyDisputed(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
          {t('glossary.onlyDisputed')}
        </label>
      </div>
      {shown.length === 0 && <p className="text-muted">{t('glossary.empty')}</p>}
      <dl className="space-y-3">
        {shown.map((g) => (
          <div key={g.term} id={g.term} className="scroll-mt-20 rounded-lg border border-line bg-card p-4">
            <dt className="flex flex-wrap items-center gap-2">
              <span className="font-serif text-lg font-semibold">{pick(lang, g.term, g.termEn)}</span>
              {g.disputed && (
                <Badge variant="warn">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  {t('glossary.disputed')}
                </Badge>
              )}
            </dt>
            <dd className="mt-1 text-sm">
              <p>{pick(lang, g.definitionNl, g.definitionEn)}</p>
              <p className="mt-2 text-xs text-muted">
                {t('glossary.firstUse')}: {g.firstUse ? <CiteLink id={g.firstUse} /> : t('glossary.notInTexts')}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
