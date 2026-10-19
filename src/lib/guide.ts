import type { Lang } from '@/types/content';
import type { Platform } from '@/store/install';

/*
 * Text of the welcome guide. Kept here rather than in the i18n resources because it
 * is running prose with structure (sections, steps), in two languages.
 */

export type GuideIcon = 'documents' | 'course' | 'subjects' | 'catechesis' | 'claims' | 'reference' | 'offline' | 'search' | 'reader' | 'listen' | 'display' | 'progress' | 'update';

export interface GuideItem {
  icon: GuideIcon;
  title: string;
  text: string;
  /** Optional in-app link. */
  to?: string;
  link?: string;
}

interface Guide {
  kicker: string;
  title: string;
  welcome: string[];
  tabs: { content: string; tech: string; install: string };
  content: GuideItem[];
  startTitle: string;
  start: { to: string; label: string }[];
  status: string;
  tech: GuideItem[];
  installIntro: string;
  installBenefits: string[];
  platforms: Record<Platform, { name: string; steps: string[] }>;
  yourDevice: string;
  installNow: string;
  installed: string;
  begin: string;
  later: string;
}

const nl: Guide = {
  kicker: 'Salve',
  title: 'Welkom bij Concilium',
  welcome: [
    'Concilium is een studie-uitgave van de zestien documenten van het Tweede Vaticaans Concilie (1962–1965). U leest de teksten zelf, paragraaf voor paragraaf, met de geschiedenis, de begrippen en de discussies erbij.',
    'Hieronder vindt u wat de app bevat, hoe ze werkt en hoe u haar installeert, zodat ze ook zonder verbinding werkt. Deze gids blijft bereikbaar via het menu.',
  ],
  tabs: { content: 'Inhoud', tech: 'Werking', install: 'Installeren' },
  content: [
    { icon: 'documents', title: 'De zestien documenten', text: 'Vier constituties, negen decreten en drie verklaringen, met paragraafnummers. Bij elk excerpt een uitleg: wat er staat, tot wie, waarom, hoe en wat bedoeld wordt. Per document ook de geschiedenis van het ontstaan, met foto’s; de officiële tekst staat op vatican.va.', to: '/documents', link: 'Naar de documenten' },
    { icon: 'course', title: 'Cursus in tien lectiones', text: 'Van de aankondiging in 1959 tot de receptie vandaag. Elke les sluit af met een korte kennischeck op feiten, niet op overtuiging.', to: '/learn', link: 'Naar de cursus' },
    { icon: 'subjects', title: 'Zestien onderwerpen', text: 'Studiepaden langs de kernparagrafen, elk met een doorlopende studietekst in hoofdstukken, met schema’s, afbeeldingen en literatuur.', to: '/subjects', link: 'Naar de onderwerpen' },
    { icon: 'catechesis', title: 'Catecheses', text: 'Twaalf korte catecheses die bij een vraag beginnen, en het register van de audiënties van paus Leo XIV over het Concilie.', to: '/catechesis', link: 'Naar de catecheses' },
    { icon: 'claims', title: 'Claim Check', text: 'Gangbare beweringen over het Concilie, getoetst aan de tekst. Waar de uitleg werkelijk omstreden is, staan de posities naast elkaar, elk met bronnen.', to: '/claims', link: 'Naar Claim Check' },
    { icon: 'reference', title: 'Naslag', text: 'Tijdlijn, begrippen, de hermeneutiek van het Concilie en een selectie video’s.', to: '/timeline', link: 'Naar de tijdlijn' },
  ],
  startTitle: 'Waar te beginnen',
  start: [
    { to: '/subjects/reading-the-council', label: 'Hoe lees je een concilie?' },
    { to: '/learn/why-a-council', label: 'Lectio I: Waarom een concilie?' },
    { to: '/documents/lumen-gentium', label: 'Lumen Gentium lezen' },
  ],
  status:
    'Concilium is een studiehulp, geen leergezag, en spreekt niet namens de Kerk. De excerpten, vertalingen en studieteksten zijn met hulp van AI opgesteld en nog niet regel voor regel gecontroleerd. Bij twijfel geldt de officiële tekst op vatican.va.',
  tech: [
    { icon: 'offline', title: 'Offline en privé', text: 'Na het eerste bezoek staan teksten, zoekindex en afbeeldingen op uw apparaat. Er is geen account en geen tracking. Alleen een video die u zelf start, of een online voorleesstem, maakt verbinding.' },
    { icon: 'search', title: 'Zoeken', text: 'Snel zoeken opent met Ctrl K (⌘ K op een Mac), met / of via het vergrootglas. De zoekpagina doorzoekt alle paragrafen, studieteksten, catecheses, claims en begrippen, ook offline.' },
    { icon: 'reader', title: 'De lezer', text: 'Tik op een excerpt, waar ook in de app, of op de knop Uitleg, voor de uitleg, citatie, bladwijzer en verwijzingen. Lang indrukken kopieert de citatie. In de werkbalk: inhoud, sprong naar een paragraaf, focusmodus en lettergrootte.' },
    { icon: 'listen', title: 'Voorlezen', text: 'Studieteksten, catecheses en documenten hebben een knop Voorlezen. De app kiest de beste mannenstem op uw apparaat; stem en snelheid wijzigt u in de spelerbalk of bij Instellingen. Spatie pauzeert, Esc stopt.' },
    { icon: 'display', title: 'Weergave', text: 'Licht of donker, Nederlands of Engels, lettergrootte en volledig scherm vindt u bij Instellingen in het menu, en op de computer in de bovenste balk.' },
    { icon: 'progress', title: 'Voortgang', text: 'Gelezen hoofdstukken, afgeronde lessen en bladwijzers worden alleen op dit apparaat bewaard. Wist u de websitegegevens van de browser, dan verdwijnen ze.' },
    { icon: 'update', title: 'Updates', text: 'Een nieuwe versie wordt op de achtergrond opgehaald en is actief bij de volgende start.' },
  ],
  installIntro: 'Geïnstalleerd staat Concilium als app op uw beginscherm of bureaublad.',
  installBenefits: ['opent schermvullend, zonder browserbalken', 'werkt volledig zonder verbinding', 'start vanaf het beginscherm, zoals elke andere app', 'werkt zichzelf bij als er verbinding is'],
  platforms: {
    ios: { name: 'iPhone en iPad (Safari)', steps: ['Open deze pagina in Safari.', 'Tik op de knop Deel (het vierkant met de pijl omhoog).', 'Kies Zet op beginscherm en tik op Voeg toe.', 'Open Concilium voortaan via het pictogram op het beginscherm.'] },
    android: { name: 'Android (Chrome, Edge, Samsung Internet)', steps: ['Tik op Installeer hieronder, als die knop zichtbaar is.', 'Of open het browsermenu (⋮) en kies App installeren of Toevoegen aan startscherm.', 'Bevestig met Installeren.', 'Concilium staat nu tussen uw apps en opent schermvullend.'] },
    desktop: { name: 'Computer (Chrome of Edge)', steps: ['Klik op Installeer hieronder, als die knop zichtbaar is.', 'Of klik op het installatiepictogram rechts in de adresbalk, of kies in het menu Apps › Concilium installeren.', 'Concilium opent dan in een eigen venster en staat in het startmenu of het Dock.', 'Safari op de Mac: Archief › Voeg toe aan Dock.'] },
  },
  yourDevice: 'uw apparaat',
  installNow: 'Installeer Concilium',
  installed: 'Concilium is op dit apparaat geïnstalleerd.',
  begin: 'Begin met lezen',
  later: 'Sluiten',
};

const en: Guide = {
  kicker: 'Salve',
  title: 'Welcome to Concilium',
  welcome: [
    'Concilium is a study edition of the sixteen documents of the Second Vatican Council (1962–1965). You read the texts themselves, paragraph by paragraph, with the history, the terms and the debates alongside.',
    'Below you will find what the app contains, how it works and how to install it so that it also works without a connection. This guide stays available from the menu.',
  ],
  tabs: { content: 'Contents', tech: 'How it works', install: 'Install' },
  content: [
    { icon: 'documents', title: 'The sixteen documents', text: 'Four constitutions, nine decrees and three declarations, with paragraph numbers. Every excerpt has an explanation: what it says, to whom, why, how and what is meant. Each document also has the history of how it came about, with photographs; the official text is on vatican.va.', to: '/documents', link: 'To the documents' },
    { icon: 'course', title: 'A course in ten lectiones', text: 'From the announcement in 1959 to the reception today. Each lesson ends with a short knowledge check on facts, not on belief.', to: '/learn', link: 'To the course' },
    { icon: 'subjects', title: 'Sixteen subjects', text: 'Study paths through the key paragraphs, each with a continuous study text in chapters, with diagrams, images and literature.', to: '/subjects', link: 'To the subjects' },
    { icon: 'catechesis', title: 'Catecheses', text: 'Twelve short catecheses that begin with a question, and the register of Pope Leo XIV’s general audiences on the Council.', to: '/catechesis', link: 'To the catecheses' },
    { icon: 'claims', title: 'Claim Check', text: 'Common claims about the Council, tested against the text. Where the reading is genuinely disputed, the positions stand side by side, each with sources.', to: '/claims', link: 'To Claim Check' },
    { icon: 'reference', title: 'Reference', text: 'Timeline, terms, the hermeneutics of the Council and a selection of videos.', to: '/timeline', link: 'To the timeline' },
  ],
  startTitle: 'Where to begin',
  start: [
    { to: '/subjects/reading-the-council', label: 'How do you read a council?' },
    { to: '/learn/why-a-council', label: 'Lectio I: Why a council?' },
    { to: '/documents/lumen-gentium', label: 'Read Lumen Gentium' },
  ],
  status:
    'Concilium is a study aid, not the magisterium, and does not speak for the Church. The excerpts, translations and study texts were prepared with the help of AI and have not yet been checked line by line. In case of doubt the official text on vatican.va governs.',
  tech: [
    { icon: 'offline', title: 'Offline and private', text: 'After the first visit the texts, search index and images are on your device. There is no account and no tracking. Only a video you start yourself, or an online reading voice, uses the network.' },
    { icon: 'search', title: 'Search', text: 'Quick search opens with Ctrl K (⌘ K on a Mac), with / or from the magnifying glass. The search page covers every paragraph, study text, catechesis, claim and term, offline too.' },
    { icon: 'reader', title: 'The reader', text: 'Tap an excerpt anywhere in the app, or the Explain button, for the explanation, citation, bookmark and cross-references. A long press copies the citation. The toolbar has contents, jump to paragraph, focus mode and text size.' },
    { icon: 'listen', title: 'Read aloud', text: 'Study texts, catecheses and documents have a Listen button. The app picks the best male voice on your device; change voice and speed in the player bar or under Settings. Space pauses, Esc stops.' },
    { icon: 'display', title: 'Display', text: 'Light or dark, Dutch or English, text size and full screen are under Settings in the menu, and on a computer in the top bar.' },
    { icon: 'progress', title: 'Progress', text: 'Chapters read, lessons completed and bookmarks are kept on this device only. Clearing the browser’s site data removes them.' },
    { icon: 'update', title: 'Updates', text: 'A new version is fetched in the background and takes effect at the next start.' },
  ],
  installIntro: 'Installed, Concilium sits as an app on your home screen or desktop.',
  installBenefits: ['opens full screen, without browser bars', 'works entirely without a connection', 'starts from the home screen like any other app', 'updates itself when online'],
  platforms: {
    ios: { name: 'iPhone and iPad (Safari)', steps: ['Open this page in Safari.', 'Tap the Share button (the square with the arrow pointing up).', 'Choose Add to Home Screen and tap Add.', 'From then on, open Concilium from its icon on the home screen.'] },
    android: { name: 'Android (Chrome, Edge, Samsung Internet)', steps: ['Tap Install below, if the button is shown.', 'Or open the browser menu (⋮) and choose Install app or Add to Home screen.', 'Confirm with Install.', 'Concilium is now among your apps and opens full screen.'] },
    desktop: { name: 'Computer (Chrome or Edge)', steps: ['Click Install below, if the button is shown.', 'Or click the install icon at the right of the address bar, or choose Apps › Install Concilium in the menu.', 'Concilium then opens in its own window and appears in the Start menu or the Dock.', 'Safari on the Mac: File › Add to Dock.'] },
  },
  yourDevice: 'your device',
  installNow: 'Install Concilium',
  installed: 'Concilium is installed on this device.',
  begin: 'Start reading',
  later: 'Close',
};

export const guide = (lang: Lang): Guide => (lang === 'en' ? en : nl);
