import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronRight, Clock, ListChecks, Scale, Search } from 'lucide-react';
import { DocTypeBadge, SolemnityBadge } from '@/components/Badges';
import { CiteLink, Loading } from '@/components/TextBlocks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/lib/data';
import { shortCite } from '@/lib/citation';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';
import { useUi } from '@/store/ui';

function dayIndex(n: number) {
  const d = new Date();
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86_400_000);
  return (day + d.getFullYear()) % n;
}

export function Home() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const { data: docs, loading } = useDocuments();
  const progress = useUi((s) => s.progress);
  const bookmarks = useUi((s) => s.bookmarks);
  const [q, setQ] = useState('');
  useDocumentTitle(undefined);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const recent = Object.entries(progress)
    .filter(([, p]) => p.fraction > 0.02 || p.lastParagraphId)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)[0];
  const recentDoc = recent && docs?.find((d) => d.id === recent[0]);
  const today = docs?.[dayIndex(docs.length)];

  const explore = [
    { to: '/claims', Icon: ListChecks, title: t('nav.claims'), body: t('home.claimsTeaser') },
    { to: '/timeline', Icon: Clock, title: t('nav.timeline'), body: t('home.timelineTeaser') },
    { to: '/glossary', Icon: BookOpen, title: t('nav.glossary'), body: t('home.glossaryTeaser') },
    { to: '/hermeneutics', Icon: Scale, title: t('nav.hermeneutics'), body: t('home.hermeneuticsTeaser') },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-serif text-3xl font-semibold leading-tight">
          <span lang="la">Concilium</span>
        </h1>
        <p className="mt-2 text-muted">{t('home.intro')}</p>
        <form role="search" onSubmit={onSearch} className="mt-4 flex gap-2">
          <label htmlFor="home-search" className="sr-only">
            {t('search.title')}
          </label>
          <Input id="home-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.searchPlaceholder')} />
          <Button type="submit" size="icon" aria-label={t('search.title')}>
            <Search className="h-5 w-5" aria-hidden />
          </Button>
        </form>
      </section>

      {loading && <Loading />}

      {recent && recentDoc && (
        <section aria-labelledby="continue-h">
          <h2 id="continue-h" className="label-eyebrow mb-2">
            {t('home.continue')}
          </h2>
          <Link
            to={`/documents/${recentDoc.id}${recent[1].lastParagraphId ? `#${recent[1].lastParagraphId}` : ''}`}
            className="block rounded-lg border border-line bg-card p-4 hover:border-accent"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-serif text-lg font-semibold" lang="la">
                  {recentDoc.titleLa}
                </p>
                <p className="text-sm text-muted">
                  {recentDoc.abbr}
                  {recent[1].lastParagraphId && ` · ${t('home.continueAt', { cite: shortCite(recent[1].lastParagraphId) })}`}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
              <div className="h-full bg-accent" style={{ width: `${recent[1].fraction * 100}%` }} />
            </div>
          </Link>
        </section>
      )}

      {today && (
        <section aria-labelledby="dotd-h">
          <h2 id="dotd-h" className="label-eyebrow mb-2">
            {t('home.docOfDay')}
          </h2>
          <Link to={`/documents/${today.id}`} className="block rounded-lg border border-line bg-card p-4 hover:border-accent">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <DocTypeBadge type={today.type} />
              <SolemnityBadge solemnity={today.solemnity} />
            </div>
            <p className="font-serif text-xl font-semibold" lang="la">
              {today.titleLa}
            </p>
            <p className="text-sm">{pick(lang, today.titleNl, today.titleEn)}</p>
            <p className="mt-2 line-clamp-3 text-sm text-muted">{pick(lang, today.summaryNl, today.summaryEn)}</p>
          </Link>
        </section>
      )}

      <section aria-labelledby="explore-h">
        <h2 id="explore-h" className="label-eyebrow mb-2">
          {t('home.explore')}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {explore.map(({ to, Icon, title, body }) => (
            <li key={to}>
              <Link to={to} className="flex h-full items-start gap-3 rounded-lg border border-line bg-card p-4 hover:border-accent">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted">{body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="bm-h">
        <h2 id="bm-h" className="label-eyebrow mb-2">
          {t('home.bookmarks')}
        </h2>
        {bookmarks.length ? (
          <ul className="flex flex-wrap gap-2">
            {bookmarks.map((b) => (
              <li key={b}>
                <CiteLink id={b} className="inline-flex min-h-[40px] items-center rounded-full border border-line bg-card px-3 no-underline" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t('home.noBookmarks')}</p>
        )}
      </section>
    </div>
  );
}
