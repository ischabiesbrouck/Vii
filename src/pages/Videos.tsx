import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Commentary, Loading, PageHeader } from '@/components/TextBlocks';
import { VideoCard } from '@/components/VideoCard';
import { getVideos } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import type { VideoKind } from '@/types/content';

const kinds: VideoKind[] = ['overview', 'history', 'document', 'interpretation', 'catechesis', 'primary-source'];

export function Videos() {
  const { t } = useTranslation();
  const lang = useLang();
  const [params, setParams] = useSearchParams();
  const filter = params.get('kind') as VideoKind | null;
  const { data, loading } = useAsync(getVideos, []);
  useDocumentTitle(t('video.title'));
  if (loading || !data) return <Loading />;
  const shown = filter ? data.items.filter((v) => v.kind === filter) : data.items;

  const chip = (k: VideoKind | null) => {
    const count = k ? data.items.filter((v) => v.kind === k).length : data.items.length;
    if (!count) return null;
    return (
      <button
        key={k ?? 'all'}
        type="button"
        aria-pressed={filter === k}
        onClick={() => setParams(k ? { kind: k } : {}, { replace: true })}
        className={cn('min-h-[38px] rounded border px-3 text-sm', filter === k ? 'border-fg bg-fg text-bg' : 'border-line bg-card hover:border-gold')}
      >
        {k ? t(`video.kind.${k}`) : t('video.all')} <span className="opacity-70">({count})</span>
      </button>
    );
  };

  return (
    <div>
      <PageHeader eyebrow={t('video.english')} title={t('video.title')} intro={t('video.intro')} />
      <div role="group" aria-label={t('video.title')} className="mb-6 flex flex-wrap gap-2">
        {chip(null)}
        {kinds.map(chip)}
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((v) => (
          <li key={v.youtubeId}>
            <VideoCard video={v} />
          </li>
        ))}
      </ul>
      <Commentary className="mt-10 max-w-3xl">
        <p>{pick(lang, data.noteNl, data.noteEn)}</p>
      </Commentary>
    </div>
  );
}
