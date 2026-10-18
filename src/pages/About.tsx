import { useTranslation } from 'react-i18next';
import { Commentary, PageHeader } from '@/components/TextBlocks';
import { SettingsPanel } from '@/components/Layout';
import { getIndex } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { CONTENT_MODE, OFFICIAL_INDEX_URL, RKDOCUMENTEN_URL } from '@/config';

const bibliography = [
  'Alberigo, G., & Komonchak, J. A. (Eds.). (1995–2006). History of Vatican II (Vols. 1–5). Orbis Books.',
  'Benedict XVI. (2005, December 22). Address to the Roman Curia offering them his Christmas greetings. Libreria Editrice Vaticana.',
  'Congregation for the Doctrine of the Faith. (2007). Responses to some questions regarding certain aspects of the doctrine on the Church. Libreria Editrice Vaticana.',
  'John XXIII. (1962, October 11). Gaudet Mater Ecclesia [Opening address of the Second Vatican Council]. Libreria Editrice Vaticana.',
  "O'Malley, J. W. (2008). What happened at Vatican II. Belknap Press of Harvard University Press.",
  'Second Vatican Council. (1964). Nota explicativa praevia. Libreria Editrice Vaticana.',
  'Synod of Bishops. (1985). The final report of the 1985 Extraordinary Synod. Libreria Editrice Vaticana.',
  'Tanner, N. P. (Ed.). (1990). Decrees of the ecumenical councils (Vol. 2). Georgetown University Press.',
];

export function About() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: index } = useAsync(getIndex, []);
  useDocumentTitle(t('about.title'));
  const nl = lang === 'nl';

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <PageHeader title={t('about.title')} intro={t('app.tagline')} />
      <p className="text-sm font-medium">{t('footer.unofficial')}</p>

      <Commentary label={nl ? 'Disclaimer' : 'Disclaimer'}>
        <p>
          {nl
            ? 'Concilium is een studiehulp, geen leergezag. Het spreekt niet namens de Kerk. Bij twijfel geldt de officiële tekst, gepubliceerd door de Heilige Stoel op '
            : 'Concilium is a study aid, not the magisterium. It does not speak for the Church. In case of doubt the official text governs, as published by the Holy See on '}
          <a href={OFFICIAL_INDEX_URL} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
            vatican.va
          </a>
          .
        </p>
      </Commentary>

      <section>
        <h2 className="mb-3 border-b border-line pb-2 font-display text-sm font-semibold uppercase tracking-caps">{nl ? 'Methode' : 'Method'}</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          {(nl
            ? [
                'Tekst eerst: elke leerstellige bewering in de app verwijst naar een paragraaf (bv. LG §8).',
                'Conciliaire tekst (schreef, omkaderd) is visueel gescheiden van redactioneel commentaar (schreefloos, gemarkeerd als “Toelichting”).',
                'Alle inhoud is statisch, geversioneerd en in de repository te controleren. Er wordt niets tijdens gebruik gegenereerd.',
                'Waar geleerden en magisteriële lezingen werkelijk verschillen, staan de posities met bronnen naast elkaar; de app beslist het geschil niet.',
                'Bij het bouwen controleert een script dat iedere verwijzing naar een bestaande paragraaf of geregistreerde bron leidt.',
              ]
            : [
                'Text first: every doctrinal assertion in the app links to a paragraph (e.g. LG §8).',
                'Conciliar text (serif, bordered) is visually separated from editorial commentary (sans-serif, labelled “Commentary”).',
                'All content is static, versioned and reviewable in the repository. Nothing is generated at runtime.',
                'Where scholars and magisterial readings genuinely differ, the positions are set side by side with sources; the app does not resolve the dispute.',
                'At build time a script checks that every reference resolves to an existing paragraph or registered source.',
              ]
          ).map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 border-b border-line pb-2 font-display text-sm font-semibold uppercase tracking-caps">{nl ? 'Inhoudsstatus' : 'Content status'}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-gold-text">CONTENT_MODE</dt>
          <dd>
            <code>{CONTENT_MODE}</code>
          </dd>
          <dt className="text-gold-text">{nl ? 'Versie' : 'Version'}</dt>
          <dd>
            <code>{index?.version ?? '…'}</code>
          </dd>
          <dt className="text-gold-text">{nl ? 'Documenten met tekst' : 'Documents with text'}</dt>
          <dd>{index ? `${index.available.length} / 16` : '…'}</dd>
          <dt className="text-gold-text">{nl ? 'Controle' : 'Review'}</dt>
          <dd>{index?.review === 'verified' ? (nl ? 'Geverifieerd' : 'Verified') : t('doc.unverified')}</dd>
        </dl>
        <p className="mt-3 text-sm">
          {nl
            ? 'Transparantie (AI-verordening): de excerpten, werkvertalingen, samenvattingen en Claim Checks in deze versie zijn opgesteld met hulp van een AI-systeem en zijn nog niet regel voor regel door een menselijke redacteur tegen de officiële teksten gecontroleerd. Fouten zijn mogelijk; controleer de feiten.'
            : 'Transparency (EU AI Act): the excerpts, working translations, summaries and Claim Checks in this version were drafted with the help of an AI system and have not yet been checked line by line against the official texts by a human editor. Errors are possible; verify the facts.'}
        </p>
      </section>

      <section>
        <h2 className="mb-3 border-b border-line pb-2 font-display text-sm font-semibold uppercase tracking-caps">{nl ? 'Licenties' : 'Licensing'}</h2>
        <div className="space-y-2 text-sm">
          <p>
            {nl
              ? 'De conciliedocumenten en hun moderne vertalingen vallen onder auteursrecht van de Libreria Editrice Vaticana en, voor het Nederlands, van de betreffende vertalers. Zolang er geen toestemming is, toont Concilium alleen korte excerpten per paragraaf, voor studie, commentaar en kritiek (citaatrecht), met directe links naar de volledige tekst.'
              : 'The conciliar documents and their modern translations are under copyright held by Libreria Editrice Vaticana and, for Dutch, by the respective translators. Until permission is granted, Concilium shows only short paragraph-level excerpts for study, commentary and criticism (right of quotation), with direct links to the full text.'}
          </p>
          <p>
            {nl
              ? 'De Nederlandse teksten in deze app zijn redactionele werkvertalingen van de excerpten, niet de officiële Nederlandse vertaling. Die vindt u via '
              : 'The Dutch texts in this app are editorial working translations of the excerpts, not the official Dutch translation. That can be found via '}
            <a href={RKDOCUMENTEN_URL} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
              rkdocumenten.nl
            </a>
            .
          </p>
          <p>
            {nl
              ? 'Lettertypen: Source Serif 4 en Inter, SIL Open Font License 1.1. Broncode van de app: zie repository.'
              : 'Fonts: Source Serif 4 and Inter, SIL Open Font License 1.1. App source code: see repository.'}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 border-b border-line pb-2 font-display text-sm font-semibold uppercase tracking-caps">{nl ? 'Privacy' : 'Privacy'}</h2>
        <p className="text-sm">
          {nl
            ? 'Geen account, geen analytics. Leesvoortgang, bladwijzers, lesvoortgang en instellingen blijven op uw apparaat (localStorage); de zoekindex staat in IndexedDB. De enige externe verbinding is een video die u zelf start: die wordt pas na uw klik geladen via youtube-nocookie.com. Links naar vatican.va openen in een nieuw tabblad.'
            : 'No account, no analytics. Reading progress, bookmarks, lesson progress and settings stay on your device (localStorage); the search index is kept in IndexedDB. The only external connection is a video you start yourself: it loads only after your click, via youtube-nocookie.com. Links to vatican.va open in a new tab.'}
        </p>
      </section>

      <section>
        <h2 className="mb-3 border-b border-line pb-2 font-display text-sm font-semibold uppercase tracking-caps">{nl ? 'Belangrijkste bronnen' : 'Principal sources'}</h2>
        <ul className="space-y-1.5 text-sm">
          {bibliography.map((b) => (
            <li key={b} className="pl-6 -indent-6">
              {b}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 border-b border-line pb-2 font-display text-sm font-semibold uppercase tracking-caps">{nl ? 'Instellingen' : 'Settings'}</h2>
        <SettingsPanel />
      </section>
    </div>
  );
}
