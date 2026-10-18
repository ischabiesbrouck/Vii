import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/TextBlocks';
import { getSearchEngine, search, type Hit } from '@/lib/search';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';

function snippet(text: string, terms: string[], max = 220) {
  const lower = text.toLowerCase();
  const idx = terms.map((t) => lower.indexOf(t.toLowerCase())).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, idx - 60);
  const s = text.slice(start, start + max);
  return `${start > 0 ? '…' : ''}${s}${start + max < text.length ? '…' : ''}`;
}

export function SearchPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [ready, setReady] = useState(false);
  useDocumentTitle(t('search.title'));

  useEffect(() => {
    void getSearchEngine().then(() => setReady(true));
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setParams(q ? { q } : {}, { replace: true });
      if (!q.trim()) return setHits(null);
      void search(q).then(setHits);
    }, 150);
    return () => clearTimeout(handle);
  }, [q, setParams]);

  return (
    <div>
      <PageHeader title={t('search.title')} intro={t('search.hint')} />
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-5">
        <label htmlFor="q" className="sr-only">
          {t('search.title')}
        </label>
        <Input id="q" type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholder')} />
      </form>

      {!ready && <p className="text-sm text-muted" role="status">{t('search.building')}</p>}

      <div aria-live="polite">
        {hits && (
          <p className="mb-3 text-sm text-muted">
            {hits.length ? t('search.results', { count: hits.length }) : t('search.noResults', { q })}
          </p>
        )}
        <ul className="space-y-2">
          {hits?.map((h) => (
            <li key={h.id}>
              <Link to={h.url} className="block rounded-lg border border-line bg-card p-4 hover:border-accent">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant={h.kind === 'paragraph' ? 'constitution' : h.kind === 'claim' ? 'slate' : 'gold'}>
                    {t(`search.kind.${h.kind}`)}
                  </Badge>
                  {h.kind === 'paragraph' && <span className="font-semibold text-accent">{h.cite.split(' ').slice(0, 2).join(' ')}</span>}
                </div>
                <p className="text-sm font-medium">{pick(lang, h.title, h.titleEn)}</p>
                <p className={h.kind === 'paragraph' ? 'mt-1 font-serif text-sm text-muted' : 'mt-1 text-sm text-muted'}>
                  {snippet(pick(lang, h.snippetNl, h.snippetEn), h.terms)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
