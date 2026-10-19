import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2, ExternalLink, RotateCcw, X } from 'lucide-react';
import { useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';
import { formatTime, usePlayer, useWatched } from '@/store/player';

const EMBED_HOST = 'https://www.youtube-nocookie.com';
const PLAYER_ORIGINS = ['https://www.youtube-nocookie.com', 'https://www.youtube.com'];

type Phase = 'playing' | 'ended';

/**
 * In-app video theater. One player at a time, privacy-enhanced embed, and no
 * "next video": when playback ends the iframe is removed and replaced by our own
 * end card, so YouTube's end-screen recommendations and autoplay never appear.
 *
 * Talks to the embed through the documented postMessage bridge of the IFrame
 * Player (enablejsapi=1) without loading YouTube's external API script.
 */
export function VideoTheater() {
  const { t } = useTranslation();
  const lang = useLang();
  const video = usePlayer((s) => s.current);
  const close = usePlayer((s) => s.close);
  const record = useWatched((s) => s.record);
  const watched = useWatched((s) => (video ? s.watched[video.youtubeId] : undefined));
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [phase, setPhase] = useState<Phase>('playing');
  const [start, setStart] = useState(0);
  const last = useRef({ at: 0, duration: 0 });

  // Resume where the viewer left off (unless finished or within the last 10 s).
  useEffect(() => {
    if (!video) return;
    setPhase('playing');
    const w = useWatched.getState().watched[video.youtubeId];
    const resume = w && !w.done && w.at > 5 && w.at < (w.duration || Infinity) - 10 ? Math.floor(w.at) : 0;
    setStart(resume);
    last.current = { at: resume, duration: w?.duration ?? 0 };
  }, [video]);

  const post = useCallback((msg: object) => {
    frameRef.current?.contentWindow?.postMessage(JSON.stringify(msg), EMBED_HOST);
  }, []);

  // Subscribe to player events; the embed only reports after it receives 'listening'.
  useEffect(() => {
    if (!video || phase !== 'playing') return;
    let subscribed = false;
    let tries = 0;
    const hello = window.setInterval(() => {
      if (subscribed || ++tries > 60) return window.clearInterval(hello);
      post({ event: 'listening', id: video.youtubeId, channel: 'widget' });
    }, 250);

    const onMessage = (e: MessageEvent) => {
      if (!PLAYER_ORIGINS.includes(e.origin) || e.source !== frameRef.current?.contentWindow) return;
      let data: { event?: string; info?: unknown };
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      subscribed = true;
      const info = (data.info ?? {}) as { playerState?: number; currentTime?: number; duration?: number };
      if (typeof info.currentTime === 'number') last.current.at = info.currentTime;
      if (typeof info.duration === 'number' && info.duration > 0) last.current.duration = info.duration;
      const ended = (data.event === 'onStateChange' && data.info === 0) || (data.event === 'infoDelivery' && info.playerState === 0);
      if (ended) {
        record(video.youtubeId, 0, last.current.duration, true);
        setPhase('ended'); // unmounts the iframe: no end screen, no next video
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.clearInterval(hello);
      window.removeEventListener('message', onMessage);
    };
  }, [video, phase, post, record]);

  const onOpenChange = (open: boolean) => {
    if (open || !video) return;
    if (phase === 'playing' && last.current.at > 0) record(video.youtubeId, last.current.at, last.current.duration);
    close();
  };

  const src = video
    ? `${EMBED_HOST}/embed/${video.youtubeId}?autoplay=1&rel=0&playsinline=1&iv_load_policy=3&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}${start ? `&start=${start}` : ''}`
    : '';

  return (
    <Dialog.Root open={!!video} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-0 z-[81] flex flex-col items-center justify-center p-0 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:p-6"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {video && (
            <div className="flex w-full max-w-5xl flex-col overflow-hidden bg-[#0d0c0b] text-[#ECE6DA] shadow-2xl sm:rounded-lg sm:border sm:border-white/10">
              <div className="flex items-start gap-3 border-b border-white/10 px-4 py-3 pt-safe sm:pt-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[0.65rem] font-semibold uppercase tracking-caps text-[#C9A96E]">
                    {t(`video.kind.${video.kind}`)} · {video.channel === '—' ? t('video.unconfirmed') : video.channel}
                    {video.length && ` · ${video.length}`}
                  </p>
                  <Dialog.Title className="mt-0.5 truncate font-serif text-base font-semibold sm:text-lg">{video.title}</Dialog.Title>
                  <Dialog.Description className="sr-only">{pick(lang, video.whyNl, video.whyEn)}</Dialog.Description>
                </div>
                <Dialog.Close className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10" aria-label={t('app.close')}>
                  <X className="h-5 w-5" aria-hidden />
                </Dialog.Close>
              </div>

              <div className="relative aspect-video w-full bg-black">
                {phase === 'playing' ? (
                  <iframe
                    ref={frameRef}
                    key={`${video.youtubeId}-${start}`}
                    className="absolute inset-0 h-full w-full"
                    src={src}
                    title={video.title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center" role="status">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{ background: 'radial-gradient(70% 60% at 50% 40%, rgb(176 141 79 / 0.22), transparent 70%)' }}
                    />
                    <CheckCircle2 className="relative h-10 w-10 text-[#C9A96E]" aria-hidden />
                    <p className="relative font-serif text-xl font-semibold">{t('video.ended')}</p>
                    <div className="relative flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStart(0);
                          setPhase('playing');
                        }}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#C9A96E]/60 px-5 text-sm hover:bg-white/10"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden /> {t('video.replay')}
                      </button>
                      <Dialog.Close className="inline-flex min-h-[44px] items-center rounded-full bg-[#ECE6DA] px-5 text-sm font-medium text-[#0d0c0b] hover:bg-white">
                        {t('video.back')}
                      </Dialog.Close>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 px-4 py-3 pb-safe text-sm sm:flex-row sm:items-center sm:justify-between sm:pb-3">
                <p className="max-w-2xl text-[#ECE6DA]/80">{pick(lang, video.whyNl, video.whyEn)}</p>
                <div className="flex shrink-0 items-center gap-4 text-xs text-[#ECE6DA]/70">
                  {start > 0 && phase === 'playing' && <span>{t('video.resumed', { time: formatTime(start) })}</span>}
                  {watched?.done && (
                    <span className="inline-flex items-center gap-1 text-[#C9A96E]">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {t('video.watched')}
                    </span>
                  )}
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-white"
                  >
                    YouTube <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
