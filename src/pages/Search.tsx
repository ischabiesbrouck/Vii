import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/TextBlocks';
import { getSearchEngine, search, type Hit, type SearchKind } from '@/lib/search';
import { cn } from '@/lib/utils';
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
  const [kind, setKind] = useState<SearchKind | 'all'>('all');
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
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('search.title')} intro={t('search.hint')} />
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-5">
        <label htmlFor="q" className="sr-only">
          {t('search.title')}
        </label>
        <Input id="q" type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholder')} />
      </form>

      <div role="group" aria-label={t('search.title')} className="mb-5 flex flex-wrap gap-2">
        {(['all', 'paragraph', 'lesson', 'subject', 'catechesis', 'claim', 'term'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={cn('min-h-[36px] rounded border px-3 text-sm', kind === k ? 'border-fg bg-fg text-bg' : 'border-line bg-card hover:border-gold')}
          >
            {k === 'all' ? t('search.all') : t(`search.kind.${k}`)}
            {hits && <span className="ml-1 opacity-70">({k === 'all' ? hits.length : hits.filter((h) => h.kind === k).length})</span>}
          </button>
        ))}
      </div>

      {!ready && <p className="text-sm text-muted" role="status">{t('search.building')}</p>}

      <div aria-live="polite">
        {hits && (
          <p className="mb-3 text-sm text-muted">
            {hits.length ? t('search.results', { count: hits.length }) : t('search.noResults', { q })}
          </p>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {hits?.filter((h) => kind === 'all' || h.kind === kind).map((h) => (
            <li key={h.id}>
              <Link to={h.url} className="block py-4 hover:bg-surface sm:px-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant={h.kind === 'paragraph' ? 'constitution' : h.kind === 'claim' ? 'slate' : h.kind === 'subject' || h.kind === 'lesson' ? 'ok' : h.kind === 'catechesis' ? 'decree' : 'gold'}>
                    {t(`search.kind.${h.kind}`)}
                  </Badge>
                  {h.kind === 'paragraph' && <span className="font-semibold text-accent">{h.cite.split(' ').slice(0, 2).join(' ')}</span>}
                </div>
                <p className="font-serif font-semibold">{pick(lang, h.title, h.titleEn)}</p>
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
