import { useTranslation } from 'react-i18next';
import { Apa } from '@/components/TextBlocks';
import { Cited } from '@/components/StudyText';
import { Credit, Photo, useImage } from '@/components/Photo';
import { useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';
import type { DocumentBackground } from '@/types/content';

const loc = (lang: 'nl' | 'en') => (lang === 'nl' ? 'nl-NL' : 'en-GB');
/** "1962-11-20" → "20 november 1962"; "1962-11" → "november 1962". */
function dateLabel(iso: string, lang: 'nl' | 'en') {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1, 12));
  return date.toLocaleDateString(loc(lang), d ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function Figure({ imageId, caption, n }: { imageId: string; caption: string; n: number }) {
  const { t } = useTranslation();
  const im = useImage(imageId);
  return (
    <figure className="my-9">
      <div className="flex min-h-[8rem] justify-center bg-surface">
        {im && <Photo image={im} sizes="(min-width: 768px) 44rem, 100vw" className="h-auto max-h-[70vh] w-auto max-w-full border border-line" />}
      </div>
      <figcaption className="mt-2.5 border-l-2 border-gold/70 pl-3 font-sans text-[0.84rem] leading-snug text-muted">
        <span className="font-semibold text-fg">
          {t('study.figure')} {n}.
        </span>{' '}
        <Cited text={caption} />
        {im && <Credit image={im} className="mt-1 block" />}
      </figcaption>
    </figure>
  );
}

/** History and background of a document: sections with figures, drafting dates, people, literature. */
export function DocumentHistory({ background: b }: { background: DocumentBackground }) {
  const { t } = useTranslation();
  const lang = useLang();
  let figure = 0;
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <article className="min-w-0 max-w-[44rem] font-serif text-[1.06rem] leading-[1.8]">
        {b.sections.map((s, i) => (
          <section key={s.headingNl} aria-labelledby={`hist-${i}`} className="mt-10 first:mt-0">
            <h2 id={`hist-${i}`} className="font-title text-[1.6rem] font-medium leading-snug">
              <span className="mr-2 font-sans text-sm tabular text-gold-text">{i + 1}.</span>
              <Cited text={pick(lang, s.headingNl, s.headingEn)} />
            </h2>
            {(lang === 'nl' ? s.nl : s.en).map((p, k) => (
              <p key={k} className="my-4 hyphens-auto">
                <Cited text={p} />
              </p>
            ))}
            {b.images
              .filter((im) => im.section === i)
              .map((im) => (
                <Figure key={im.imageId} imageId={im.imageId} caption={pick(lang, im.captionNl, im.captionEn)} n={++figure} />
              ))}
          </section>
        ))}
        <p className="mt-10 border-y border-dashed border-line py-2 text-center font-sans text-xs text-muted" data-tts-skip>
          {t('history.status')}
        </p>
      </article>

      <aside className="space-y-8 lg:sticky lg:top-16 lg:self-start">
        {b.timeline.length > 0 && (
          <section aria-labelledby="hist-timeline">
            <h2 id="hist-timeline" className="kicker mb-2">
              {t('history.timeline')}
            </h2>
            <ol className="relative border-l border-gold/60 pl-4">
              {b.timeline.map((e) => (
                <li key={e.date + e.nl} className="relative pb-3 last:pb-0">
                  <span className="absolute -left-[1.32rem] top-[0.45rem] h-2 w-2 rotate-45 bg-accent" aria-hidden />
                  <p className="text-xs font-semibold tabular text-accent">{dateLabel(e.date, lang)}</p>
                  <p className="text-[0.88rem] leading-snug">
                    <Cited text={pick(lang, e.nl, e.en)} />
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}
        {b.people.length > 0 && (
          <section aria-labelledby="hist-people">
            <h2 id="hist-people" className="kicker mb-2">
              {t('history.people')}
            </h2>
            <ul className="divide-y divide-line border-y border-line">
              {b.people.map((p) => (
                <li key={p.name} className="py-2">
                  <p className="font-title text-[1.02rem] font-medium leading-snug">{p.name}</p>
                  <p className="text-[0.82rem] leading-snug text-muted">{pick(lang, p.roleNl, p.roleEn)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {b.sources.length > 0 && (
          <section aria-labelledby="hist-sources">
            <h2 id="hist-sources" className="kicker mb-2">
              {t('history.sources')}
            </h2>
            <ul className="space-y-1.5 text-[0.82rem]">
              {b.sources.map((s) => (
                <li key={s} className="pl-5 -indent-5">
                  <Apa citation={s} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
