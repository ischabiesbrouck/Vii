import { useTranslation } from 'react-i18next';
import { CheckCircle2, ExternalLink, Play, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IS_ARTIFACT_PREVIEW } from '@/config';
import { useLang, useOnline } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import { formatTime, usePlayer, useWatched } from '@/store/player';
import type { Video } from '@/types/content';

const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/**
 * Video card with a local poster: nothing is requested from YouTube until the
 * viewer presses play, which opens the in-app theater (one video at a time).
 * Offline, the card says so; where embedding is impossible it links out.
 */
export function VideoCard({ video, compact = false }: { video: Video; compact?: boolean }) {
  const { t } = useTranslation();
  const lang = useLang();
  const online = useOnline();
  const open = usePlayer((s) => s.open);
  const w = useWatched((s) => s.watched[video.youtubeId]);
  const progress = w?.done ? 1 : w && w.duration ? w.at / w.duration : 0;
  const label = t('video.playLabel', { title: video.title });

  const poster = (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-ink p-4 text-ink-fg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'radial-gradient(120% 90% at 85% 10%, rgb(176 141 79 / 0.38), transparent 60%)', opacity: 0.7 }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-3 rounded-sm border border-[#C9A96E]/25" />
      <span className="relative flex items-center justify-between gap-2 font-display text-[0.62rem] font-semibold uppercase tracking-caps text-[#C9A96E]">
        <span>
          {t(`video.kind.${video.kind}`)} · {t('video.english')}
        </span>
        {w?.done && (
          <span className="inline-flex items-center gap-1 normal-case tracking-normal">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {t('video.watched')}
          </span>
        )}
      </span>
      <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#C9A96E] bg-black/40 shadow-[0_0_0_6px_rgb(0_0_0/0.15)] transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110">
        {online ? <Play className="ml-1 h-6 w-6 fill-current" aria-hidden /> : <WifiOff className="h-6 w-6" aria-hidden />}
      </span>
      <span className="relative line-clamp-2 font-serif text-[0.95rem] font-semibold leading-snug">{video.title}</span>
      {progress > 0 && (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
          <span className="block h-full bg-[#C9A96E]" style={{ width: `${progress * 100}%` }} />
        </span>
      )}
    </div>
  );

  return (
    <article className="group/card flex h-full flex-col overflow-hidden rounded-lg border border-line bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-video w-full">
        {!online ? (
          <div className="h-full w-full" title={t('video.offline')}>
            {poster}
          </div>
        ) : IS_ARTIFACT_PREVIEW ? (
          <a href={watchUrl(video.youtubeId)} target="_blank" rel="noopener noreferrer" className="group block h-full w-full" aria-label={label}>
            {poster}
          </a>
        ) : (
          <button type="button" onClick={() => open(video)} className="group block h-full w-full text-left" aria-label={label} aria-haspopup="dialog">
            {poster}
          </button>
        )}
      </div>
      <div className={cn('flex flex-1 flex-col p-4', compact && 'p-3')}>
        <p className="text-xs text-muted">
          <span className="font-semibold text-fg">{video.channel === '—' ? t('video.unconfirmed') : video.channel}</span>
          {video.channel !== '—' && !video.channelConfirmed && <span> · {t('video.unconfirmed')}</span>}
          {video.length && <span> · {video.length}</span>}
          {w && !w.done && w.at > 5 && <span className="text-gold-text"> · {t('video.resumeAt', { time: formatTime(w.at) })}</span>}
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
          <span className="text-muted">{!online ? t('video.offline') : IS_ARTIFACT_PREVIEW ? '' : t('video.privacy')}</span>
          <a href={watchUrl(video.youtubeId)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
            {t('video.openYt')} <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}
