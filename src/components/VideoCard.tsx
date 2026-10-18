import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Play, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IS_ARTIFACT_PREVIEW } from '@/config';
import { useLang, useOnline } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import type { Video } from '@/types/content';

const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/**
 * Click-to-load video facade. Nothing is requested from YouTube until the viewer
 * presses play; the embed then uses youtube-nocookie.com. Offline, the card says so
 * instead of failing. Where embedding is impossible (artifact preview) it links out.
 */
export function VideoCard({ video, compact = false }: { video: Video; compact?: boolean }) {
  const { t } = useTranslation();
  const lang = useLang();
  const online = useOnline();
  const [playing, setPlaying] = useState(false);
  const canEmbed = online && !IS_ARTIFACT_PREVIEW;

  const poster = (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-ink p-4 text-ink-fg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: 'radial-gradient(120% 90% at 85% 10%, rgb(176 141 79 / 0.35), transparent 60%)' }}
      />
      <span className="relative font-display text-[0.65rem] font-semibold uppercase tracking-caps text-[#C9A96E]">
        {t(`video.kind.${video.kind}`)} · {t('video.english')}
      </span>
      <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#C9A96E] bg-black/30 transition-transform group-hover:scale-105">
        {online ? <Play className="ml-1 h-6 w-6 fill-current" aria-hidden /> : <WifiOff className="h-6 w-6" aria-hidden />}
      </span>
      <span className="relative line-clamp-2 font-serif text-[0.95rem] font-semibold leading-snug">{video.title}</span>
    </div>
  );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-line bg-card">
      <div className="aspect-video w-full">
        {playing ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : canEmbed ? (
          <button type="button" onClick={() => setPlaying(true)} className="group block h-full w-full text-left" aria-label={t('video.playLabel', { title: video.title })}>
            {poster}
          </button>
        ) : online ? (
          <a href={watchUrl(video.youtubeId)} target="_blank" rel="noopener noreferrer" className="group block h-full w-full" aria-label={t('video.playLabel', { title: video.title })}>
            {poster}
          </a>
        ) : (
          <div className="h-full w-full" title={t('video.offline')}>
            {poster}
          </div>
        )}
      </div>
      <div className={cn('flex flex-1 flex-col p-4', compact && 'p-3')}>
        <p className="text-xs text-muted">
          <span className="font-semibold text-fg">{video.channel === '—' ? t('video.unconfirmed') : video.channel}</span>
          {video.channel !== '—' && !video.channelConfirmed && <span> · {t('video.unconfirmed')}</span>}
          {video.length && <span> · {video.length}</span>}
        </p>
        {!compact && <p className="mt-2 flex-1 text-sm leading-relaxed">{pick(lang, video.whyNl, video.whyEn)}</p>}
        {!compact && video.perspectiveNl && (
          <p className="mt-2 text-xs text-muted">
            <Badge variant="outline" className="mr-1.5">
              {t('video.perspective')}
            </Badge>
            {pick(lang, video.perspectiveNl, video.perspectiveEn)}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          {!online ? (
            <span className="text-muted">{t('video.offline')}</span>
          ) : (
            <span className="text-muted">{IS_ARTIFACT_PREVIEW ? '' : t('video.privacy')}</span>
          )}
          <a href={watchUrl(video.youtubeId)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
            {t('video.openYt')} <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}
