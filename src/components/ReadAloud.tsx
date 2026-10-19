import { useEffect, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Headphones, Pause, Play, SkipBack, SkipForward, SlidersHorizontal, Volume2, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { chosenVoice, loadVoices, pause, preview, restartCurrent, resume, skip, speechSupported, start, stop } from '@/lib/readAloud';
import { rankVoices, voiceLabel, type RankedVoice } from '@/lib/speech';
import { useLang } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { RATES, useSpeech } from '@/store/speech';

/** "Voorlezen": reads the element in `target` aloud, starting where the reader is. */
export function ReadAloudButton({ target, className }: { target: RefObject<HTMLElement>; className?: string }) {
  const { t } = useTranslation();
  const status = useSpeech((s) => s.status);
  if (!speechSupported()) return null;
  const reading = status !== 'idle';
  return (
    <button
      type="button"
      data-tts-skip
      onClick={() => (reading ? stop() : target.current && start(target.current))}
      aria-pressed={reading}
      className={cn(
        'inline-flex min-h-[36px] items-center gap-1.5 rounded-sm border px-2.5 text-sm transition-colors',
        reading ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-card hover:border-fg/40',
        className,
      )}
    >
      <Headphones className="h-4 w-4" aria-hidden />
      {reading ? t('tts.stop') : t('tts.listen')}
    </button>
  );
}

/** The device's voices for the current language, best first, and the one chosen (if any). */
function useVoices() {
  const lang = useLang();
  const chosen = useSpeech((s) => s.voice[lang]);
  const [ranked, setRanked] = useState<RankedVoice<SpeechSynthesisVoice>[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      void loadVoices().then((voices) => {
        if (alive) setRanked(rankVoices(voices, lang));
      });
    load();
    if (speechSupported()) speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      alive = false;
      if (speechSupported()) speechSynthesis.removeEventListener('voiceschanged', load);
    };
  }, [lang, chosen]);
  return { ranked, chosen };
}

/** Voice and speed: used in the player's sheet and on the settings panel. */
export function VoiceSettings() {
  const { t } = useTranslation();
  const lang = useLang();
  const { ranked, chosen } = useVoices();
  const setVoice = useSpeech((s) => s.setVoice);
  const rate = useSpeech((s) => s.rate);
  const setRate = useSpeech((s) => s.setRate);
  if (!speechSupported()) return <p className="text-sm text-muted">{t('tts.unsupported')}</p>;
  const anyMale = ranked.some((r) => r.male);
  const best = ranked[0];

  const choose = (uri: string | undefined) => {
    setVoice(lang, uri);
    restartCurrent();
  };

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="kicker mb-2">{t('tts.speed')}</legend>
        <div className="grid grid-cols-6 border border-line bg-card">
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={rate === r}
              onClick={() => {
                setRate(r);
                restartCurrent();
              }}
              className={cn('min-h-[40px] border-l border-line text-sm tabular first:border-l-0', rate === r ? 'bg-fg text-bg' : 'text-muted hover:text-fg')}
            >
              {r.toLocaleString(lang)}×
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="kicker mb-2">{t('tts.voice')}</legend>
        {ranked.length === 0 ? (
          <p className="text-sm text-muted">{t('tts.none')}</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line" role="radiogroup" aria-label={t('tts.voice')}>
            <li>
              <VoiceRow
                label={t('tts.auto')}
                detail={best ? voiceLabel(best.voice.name) : ''}
                selected={!chosen}
                onSelect={() => choose(undefined)}
                onPreview={best ? () => preview(best.voice, t('tts.sample')) : undefined}
              />
            </li>
            {ranked.map((r) => (
              <li key={r.voice.voiceURI}>
                <VoiceRow
                  label={voiceLabel(r.voice.name)}
                  detail={r.voice.lang}
                  male={r.male}
                  online={r.online}
                  selected={chosen === r.voice.voiceURI}
                  onSelect={() => choose(r.voice.voiceURI)}
                  onPreview={() => preview(r.voice, t('tts.sample'))}
                />
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {ranked.some((r) => r.online) && <p className="text-xs leading-relaxed text-muted">{t('tts.onlineNote')}</p>}
      {!anyMale && ranked.length > 0 && (
        <div className="commentary space-y-1.5 text-xs">
          <p className="font-semibold">{t('tts.noMale')}</p>
          <p>{t('tts.howIos')}</p>
          <p>{t('tts.howAndroid')}</p>
          <p>{t('tts.howWindows')}</p>
        </div>
      )}
    </div>
  );
}

function VoiceRow({
  label,
  detail,
  male,
  online,
  selected,
  onSelect,
  onPreview,
}: {
  label: string;
  detail: string;
  male?: boolean;
  online?: boolean;
  selected: boolean;
  onSelect: () => void;
  onPreview?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 py-2 text-left">
        <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', selected ? 'border-accent bg-accent text-accent-fg' : 'border-line')}>
          {selected && <Check className="h-3 w-3" aria-hidden />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{label}</span>
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            {detail}
            {male && <span className="rounded-sm border border-gold/60 px-1 text-[0.68rem] text-gold-text">{t('tts.male')}</span>}
            {online && <span className="rounded-sm border border-line px-1 text-[0.68rem]">{t('tts.online')}</span>}
          </span>
        </span>
      </button>
      {onPreview && (
        <button type="button" onClick={onPreview} className="icon-btn h-10 w-10" aria-label={`${t('tts.test')}: ${label}`} title={t('tts.test')}>
          <Volume2 className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Player bar, shown while a page is being read: previous, play/pause, next, voice, stop. */
export function SpeechBar() {
  const { t } = useTranslation();
  const lang = useLang();
  const { status, index, total, rate } = useSpeech();
  const [open, setOpen] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const chosen = useSpeech((s) => s.voice[lang]);
  useEffect(() => {
    if (status === 'idle') return;
    void chosenVoice(lang).then((v) => setVoiceName(v ? voiceLabel(v.name) : ''));
  }, [status, lang, chosen]);

  // Space toggles, Escape stops, while no text field has focus.
  useEffect(() => {
    if (status === 'idle') return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName))) return;
      if (e.key === 'Escape') stop();
      else if (e.key === ' ') {
        e.preventDefault();
        if (useSpeech.getState().status === 'playing') pause();
        else resume();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status]);

  if (status === 'idle') return null;
  const playing = status === 'playing';
  return (
    <>
      <div
        role="region"
        aria-label={t('tts.player')}
        className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 mx-auto w-[min(36rem,calc(100%-1rem))] animate-in fade-in-0 slide-in-from-bottom-2 lg:bottom-6"
      >
        <div className="border border-line border-t-[3px] border-t-accent bg-paper shadow-lift">
          <div className="h-[2px] bg-line" aria-hidden>
            <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${((index + 1) / Math.max(1, total)) * 100}%` }} />
          </div>
          <div className="flex items-center gap-1 px-2 py-1.5">
            <div className="min-w-0 flex-1 pl-1">
              <p className="flex items-center gap-1.5 text-[0.8rem] font-semibold">
                <Headphones className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                <span className="truncate">{voiceName || t('tts.listen')}</span>
              </p>
              <p className="text-[0.72rem] tabular text-muted" aria-live="polite">
                {t('tts.progress', { n: index + 1, total })} · {rate.toLocaleString(lang)}×
              </p>
            </div>
            <button type="button" className="icon-btn" onClick={() => skip(-1)} disabled={index === 0} aria-label={t('tts.prev')}>
              <SkipBack className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => (playing ? pause() : resume())}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg transition-colors hover:bg-primary/90"
              aria-label={playing ? t('tts.pause') : t('tts.play')}
            >
              {playing ? <Pause className="h-5 w-5 fill-current" aria-hidden /> : <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />}
            </button>
            <button type="button" className="icon-btn" onClick={() => skip(1)} disabled={index >= total - 1} aria-label={t('tts.next')}>
              <SkipForward className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label={t('tts.voiceAndSpeed')} aria-haspopup="dialog">
              <SlidersHorizontal className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" className="icon-btn" onClick={stop} aria-label={t('tts.stop')}>
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title={t('tts.voiceAndSpeed')} closeLabel={t('app.close')}>
          <VoiceSettings />
        </SheetContent>
      </Sheet>
    </>
  );
}
