import { useTranslation } from 'react-i18next';
import { Apa, Commentary, CiteLink, Loading, PageHeader } from '@/components/TextBlocks';
import { getHermeneutics } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';

export function Hermeneutics() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, loading } = useAsync(getHermeneutics, []);
  useDocumentTitle(t('herm.title'));
  if (loading || !data) return <Loading />;

  return (
    <div>
      <PageHeader eyebrow={t('nav.hermeneutics')} title={t('herm.title')} />
      <Commentary className="mb-6">{pick(lang, data.introNl, data.introEn)}</Commentary>

      <div className="space-y-6">
        {data.positions.map((p) => (
          <section key={p.id} aria-labelledby={`h-${p.id}`} className="rounded-lg border border-line bg-card p-4">
            <h2 id={`h-${p.id}`} className="font-serif text-xl font-semibold">
              {pick(lang, p.labelNl, p.labelEn)}
            </h2>
            <p className="mt-2 text-sm">{pick(lang, p.thesisNl, p.thesisEn)}</p>

            <h3 className="label-eyebrow mb-1 mt-4">{t('herm.appealsTo')}</h3>
            <ul className="space-y-1 text-sm">
              {p.appealsTo.map((a) => (
                <li key={a.paragraphId}>
                  <CiteLink id={a.paragraphId} /> — {pick(lang, a.noteNl, a.noteEn)}
                </li>
              ))}
            </ul>

            <h3 className="label-eyebrow mb-1 mt-4">{t('herm.criticism')}</h3>
            <p className="text-sm">{pick(lang, p.criticismNl, p.criticismEn)}</p>

            <h3 className="label-eyebrow mb-1 mt-4">{t('herm.sources')}</h3>
            <ul className="space-y-1 text-muted">
              {p.sources.map((s) => (
                <li key={s}>
                  <Apa citation={s} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section aria-labelledby="h-principles" className="mt-8">
        <h2 id="h-principles" className="mb-2 font-serif text-xl font-semibold">
          {t('herm.principles')}
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {pick(lang, data.principlesNl, data.principlesEn).map((pr) => (
            <li key={pr}>{pr}</li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted">{data.principlesSource}</p>
      </section>
    </div>
  );
}
