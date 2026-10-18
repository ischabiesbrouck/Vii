import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { HeardFromBadge, VerdictBadge } from '@/components/Badges';
import { Loading, PageHeader } from '@/components/TextBlocks';
import { getClaims } from '@/lib/content';
import { shortCite } from '@/lib/citation';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import type { Verdict } from '@/types/content';

const verdicts: Verdict[] = ['not-in-the-text', 'partly', 'contested', 'supported'];

export function Claims() {
  const { t } = useTranslation();
  const lang = useLang();
  const [params, setParams] = useSearchParams();
  const filter = params.get('verdict') as Verdict | null;
  const { data: claims, loading } = useAsync(getClaims, []);
  useDocumentTitle(t('claims.title'));

  if (loading || !claims) return <Loading />;
  const counts = Object.fromEntries(verdicts.map((v) => [v, claims.filter((c) => c.verdict === v).length]));
  const shown = filter ? claims.filter((c) => c.verdict === filter) : claims;

  const chip = (value: Verdict | null, label: string, count: number) => (
    <button
      key={value ?? 'all'}
      type="button"
      aria-pressed={filter === value}
      onClick={() => setParams(value ? { verdict: value } : {}, { replace: true })}
      className={cn(
        'min-h-[40px] shrink-0 rounded-full border px-3 text-sm',
        filter === value ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-card hover:bg-surface',
      )}
    >
      {label} <span className="opacity-70">({count})</span>
    </button>
  );

  return (
    <div>
      <PageHeader title={t('claims.title')} intro={t('claims.intro')} />
      <div role="group" aria-label={t('claims.filter')} className="mb-5 flex flex-wrap gap-2">
        {chip(null, t('claims.all'), claims.length)}
        {verdicts.filter((v) => counts[v]).map((v) => chip(v, t(`claims.verdict.${v}`), counts[v] ?? 0))}
      </div>
      {shown.length === 0 && <p className="text-muted">{t('claims.empty')}</p>}
      <ul className="space-y-2">
        {shown.map((c) => (
          <li key={c.id}>
            <Link to={`/claims/${c.id}`} className="block rounded-lg border border-line bg-card p-4 hover:border-accent">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">“{pick(lang, c.claim, c.claimEn)}”</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <VerdictBadge verdict={c.verdict} />
                    <HeardFromBadge heardFrom={c.heardFrom} />
                  </div>
                  <p className="mt-2 text-xs text-muted">{c.evidence.map((e) => shortCite(e.paragraphId)).join(' · ')}</p>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted" aria-hidden />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
