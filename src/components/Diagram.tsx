import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocuments } from '@/lib/data';
import { useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import type { CouncilDocument, DiagramId, DocType } from '@/types/content';

/*
 * Explanatory diagrams for the study texts. They are drawn from the app's own
 * data (dates, votes, chapter outlines) or restate a conciliar paragraph, so they
 * need no image licence. Each renders as plain, readable HTML: it reflows on small
 * screens, follows the theme and is read in order by screen readers.
 */

const L = (lang: 'nl' | 'en', nl: string, en: string) => (lang === 'nl' ? nl : en);
const dateShort = (iso: string, lang: 'nl' | 'en') =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const periods = [
  { n: 'I', from: '1962-10-11', to: '1962-12-08', year: '1962' },
  { n: 'II', from: '1963-09-29', to: '1963-12-04', year: '1963' },
  { n: 'III', from: '1964-09-14', to: '1964-11-21', year: '1964' },
  { n: 'IV', from: '1965-09-14', to: '1965-12-08', year: '1965' },
];

function Sessions({ docs }: { docs: CouncilDocument[] }) {
  const lang = useLang();
  return (
    <ol className="grid gap-px border border-line bg-line sm:grid-cols-4">
      {periods.map((p) => {
        const promulgated = docs.filter((d) => d.promulgated.startsWith(p.year)).sort((a, b) => a.promulgated.localeCompare(b.promulgated));
        return (
          <li key={p.n} className="bg-card p-4">
            <p className="font-display text-xl font-semibold text-accent">{p.n}</p>
            <p className="text-xs tabular text-muted">
              {dateShort(p.from, lang)} – {dateShort(p.to, lang)}
            </p>
            <p className="mt-3 kicker">{L(lang, 'Afgekondigd', 'Promulgated')}</p>
            {promulgated.length ? (
              <ul className="mt-1 space-y-0.5 text-[0.82rem]">
                {promulgated.map((d) => (
                  <li key={d.id}>
                    <Link to={`/documents/${d.id}`} className="hover:text-accent hover:underline" lang="la">
                      {d.titleLa}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[0.82rem] text-muted">{L(lang, 'Geen document', 'No document')}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

const kinds: { type: DocType; la: string }[] = [
  { type: 'constitution', la: 'Constitutiones' },
  { type: 'decree', la: 'Decreta' },
  { type: 'declaration', la: 'Declarationes' },
];

function Documents({ docs }: { docs: CouncilDocument[] }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
      {kinds.map((k) => {
        const list = docs.filter((d) => d.type === k.type).sort((a, b) => a.promulgated.localeCompare(b.promulgated));
        return (
          <div key={k.type} className="bg-card p-4">
            <p className="font-title text-[1.1rem] text-accent small-caps" lang="la">
              {k.la} <span className="font-sans text-xs text-muted">({list.length})</span>
            </p>
            <p className="text-xs text-muted">{t(`doc.typePlural.${k.type}`)}</p>
            <ul className="mt-3 space-y-1.5 text-[0.82rem]">
              {list.map((d) => (
                <li key={d.id} className="flex items-baseline justify-between gap-2">
                  <Link to={`/documents/${d.id}`} className="font-semibold hover:text-accent hover:underline" lang="la">
                    {d.titleLa}
                  </Link>
                  <span className="shrink-0 text-[0.72rem] tabular text-muted">{d.promulgated.slice(0, 4)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Votes({ docs }: { docs: CouncilDocument[] }) {
  const lang = useLang();
  const list = [...docs].filter((d) => d.voteFor !== null).sort((a, b) => a.promulgated.localeCompare(b.promulgated));
  const max = Math.max(...list.map((d) => (d.voteFor ?? 0) + (d.voteAgainst ?? 0)));
  return (
    <div className="border border-line bg-card p-4">
      <p className="mb-3 flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-gold" aria-hidden /> <span lang="la">placet</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-accent" aria-hidden /> <span lang="la">non placet</span>
        </span>
      </p>
      <table className="w-full text-[0.8rem]">
        <caption className="sr-only">{L(lang, 'Eindstemmingen per document', 'Final votes per document')}</caption>
        <thead className="sr-only">
          <tr>
            <th>{L(lang, 'Document', 'Document')}</th>
            <th>placet</th>
            <th>non placet</th>
          </tr>
        </thead>
        <tbody>
          {list.map((d) => (
            <tr key={d.id}>
              <th scope="row" className="w-12 py-1 pr-2 text-left font-semibold">
                {d.abbr}
              </th>
              <td className="py-1">
                <div className="flex h-3 items-stretch" aria-hidden>
                  <span className="bg-gold" style={{ width: `${((d.voteFor ?? 0) / max) * 100}%` }} />
                  <span className="bg-accent" style={{ width: `${((d.voteAgainst ?? 0) / max) * 100}%`, minWidth: 2 }} />
                </div>
              </td>
              <td className="w-28 py-1 pl-2 text-right tabular text-muted">
                {(d.voteFor ?? 0).toLocaleString(lang)} / {(d.voteAgainst ?? 0).toLocaleString(lang)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Outline({ doc }: { doc: CouncilDocument }) {
  const lang = useLang();
  const outline = doc.outline ?? [];
  const total = doc.paragraphCount;
  return (
    <div className="border border-line bg-card p-4">
      <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.1em]" lang="la">
        {doc.titleLa} <span className="font-sans text-xs normal-case tracking-normal text-muted">· §1–{total}</span>
      </p>
      <div className="flex h-3 w-full gap-px" aria-hidden>
        {outline.map((o, i) => (
          <span key={o.labelLa} className={i % 2 ? 'bg-gold/70' : 'bg-accent/80'} style={{ width: `${((o.to - o.from + 1) / total) * 100}%` }} />
        ))}
      </div>
      <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-[0.82rem] sm:grid-cols-2">
        {outline.map((o) => (
          <li key={o.labelLa} className="flex gap-2">
            <span className="w-24 shrink-0 font-title text-[0.95rem] text-accent small-caps" lang="la">
              {o.labelLa}
            </span>
            <span className="min-w-0">
              <Link to={`/documents/${doc.id}#${doc.abbr}-${o.from}`} className="hover:text-accent hover:underline">
                {pick(lang, o.titleNl, o.titleEn)}
              </Link>
              <span className="text-muted tabular">
                {' '}
                · §{o.from}
                {o.to !== o.from && `–${o.to}`}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Transmission() {
  const lang = useLang();
  const box = 'border border-line bg-card p-3 text-center';
  return (
    <div className="border border-line bg-surface/60 p-4">
      <div className="mx-auto max-w-xl border-2 border-accent/70 p-3">
        <p className="text-center font-title text-[0.95rem] text-accent small-caps">
          {L(lang, 'Eén heilig depositum van het woord van God, aan de Kerk toevertrouwd', 'One sacred deposit of the word of God, entrusted to the Church')}{' '}
          <span className="font-sans text-xs normal-case tracking-normal text-muted">(DV §10)</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className={box}>
            <p className="font-title text-lg" lang="la">
              Sacra Traditio
            </p>
            <p className="text-xs text-muted">{L(lang, 'Heilige Overlevering', 'Sacred Tradition')}</p>
          </div>
          <div className={box}>
            <p className="font-title text-lg" lang="la">
              Sacra Scriptura
            </p>
            <p className="text-xs text-muted">{L(lang, 'Heilige Schrift', 'Sacred Scripture')}</p>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          {L(lang, 'nauw met elkaar verbonden, uit dezelfde goddelijke bron (DV §9)', 'closely connected, flowing from the same divine wellspring (DV §9)')}
        </p>
      </div>
      <p className="my-2 text-center text-gold-text" aria-hidden>
        ↓ ↑
      </p>
      <div className={cn(box, 'mx-auto max-w-sm')}>
        <p className="font-title text-lg" lang="la">
          Magisterium
        </p>
        <p className="text-xs text-muted">
          {L(lang, 'het levend leergezag: staat niet boven het woord van God, maar dient het (DV §10)', 'the living teaching office: not above the word of God, but its servant (DV §10)')}
        </p>
      </div>
    </div>
  );
}

function Belonging() {
  const lang = useLang();
  const rings = [
    { ref: 'LG §16', nl: 'Wie het evangelie nog niet heeft ontvangen, is op verschillende wijzen op het volk van God gericht: eerst het Joodse volk, dan de moslims, wie de onbekende God zoeken, en wie zonder eigen schuld God nog niet uitdrukkelijk kent.', en: 'Those who have not yet received the Gospel are related to the People of God in various ways: first the Jewish people, then Muslims, those who seek the unknown God, and those who through no fault of their own do not yet explicitly know God.' },
    { ref: 'LG §15', nl: 'Gedoopten die het christelijk geloof belijden maar niet in volle gemeenschap staan, zijn op vele manieren met de Kerk verbonden.', en: 'The baptised who profess the Christian faith but are not in full communion are joined to the Church in many ways.' },
    { ref: 'LG §14', nl: 'Catechumenen die uitdrukkelijk verlangen opgenomen te worden.', en: 'Catechumens who explicitly desire to be incorporated.' },
    { ref: 'LG §14', nl: 'Volledig ingelijfd: wie, met de Geest van Christus, de hele ordening van de Kerk en haar middelen tot heil aanvaardt en in haar zichtbare verband met Christus verbonden is.', en: 'Fully incorporated: those who, possessing the Spirit of Christ, accept her entire order and means of salvation and are joined to Christ in her visible structure.' },
  ];
  const nest = (i: number): React.ReactNode => {
    const r = rings[i]!;
    return (
      <div className={cn('border p-3', i === rings.length - 1 ? 'border-accent bg-card' : 'border-gold/70 bg-paper/60')}>
        <p className="text-[0.8rem] leading-snug">
          <span className="font-semibold text-accent">{r.ref}</span> · {pick(lang, r.nl, r.en)}
        </p>
        {i < rings.length - 1 && <div className="mt-3">{nest(i + 1)}</div>}
      </div>
    );
  };
  return <div className="bg-surface/60 p-2">{nest(0)}</div>;
}

function People() {
  const lang = useLang();
  const cell = 'border border-line bg-card p-3';
  return (
    <div className="border border-line bg-surface/60 p-4 text-[0.82rem]">
      <div className={cn(cell, 'text-center')}>
        <p className="font-title text-lg">{L(lang, 'Eén volk van God', 'One People of God')}</p>
        <p className="text-xs text-muted">LG §9–17 ({L(lang, 'hoofdstuk II', 'chapter II')})</p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className={cell}>
          <p className="font-semibold">{L(lang, 'Gemeenschappelijk priesterschap van de gelovigen', 'Common priesthood of the faithful')}</p>
          <p className="text-xs text-muted">{L(lang, 'door het doopsel; LG §10–11', 'through baptism; LG §10–11')}</p>
        </div>
        <div className={cell}>
          <p className="font-semibold">{L(lang, 'Ambtelijk of hiërarchisch priesterschap', 'Ministerial or hierarchical priesthood')}</p>
          <p className="text-xs text-muted">{L(lang, 'door de wijding; LG §10, 18–29', 'through ordination; LG §10, 18–29')}</p>
        </div>
      </div>
      <p className="mt-2 text-center text-xs italic text-muted">
        {L(lang, 'Op elkaar betrokken, maar verschillend naar wezen en niet alleen naar graad (LG §10).', 'Ordered to one another, yet differing in essence and not only in degree (LG §10).')}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {[
          [L(lang, 'Hiërarchie', 'Hierarchy'), L(lang, 'bisschoppen, priesters, diakens · hfst. III', 'bishops, priests, deacons · ch. III')],
          [L(lang, 'Leken', 'Laity'), L(lang, 'in de wereld, naar hun eigen roeping · hfst. IV', 'in the world, by their own calling · ch. IV')],
          [L(lang, 'Religieuzen', 'Religious'), L(lang, 'evangelische raden · hfst. VI', 'evangelical counsels · ch. VI')],
        ].map(([a, b]) => (
          <div key={a} className={cell}>
            <p className="font-semibold">{a}</p>
            <p className="text-xs text-muted">{b}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 border-2 border-accent/70 bg-card p-2 text-center">
        <p className="font-semibold">{L(lang, 'Universele roeping tot heiligheid', 'Universal call to holiness')}</p>
        <p className="text-xs text-muted">{L(lang, 'voor alle gelovigen, van welke staat ook · hfst. V, LG §40', 'for all the faithful, of whatever state · ch. V, LG §40')}</p>
      </div>
    </div>
  );
}

export function Diagram({ id }: { id: DiagramId }) {
  const docs = useDocuments().data ?? [];
  if (!docs.length) return <div className="skeleton h-40 w-full" />;
  if (id === 'sessions') return <Sessions docs={docs} />;
  if (id === 'documents') return <Documents docs={docs} />;
  if (id === 'votes') return <Votes docs={docs} />;
  if (id === 'dv-transmission') return <Transmission />;
  if (id === 'lg-belonging') return <Belonging />;
  if (id === 'lg-people') return <People />;
  const doc = docs.find((d) => d.abbr === id.replace('outline-', ''));
  return doc ? <Outline doc={doc} /> : null;
}
