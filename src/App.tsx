import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { IS_ARTIFACT_PREVIEW } from '@/config';
import { Layout } from '@/components/Layout';
import { Loading } from '@/components/TextBlocks';
import { Home } from '@/pages/Home';
import { useThemeEffect } from '@/lib/hooks';

// Route-level code splitting: only Home ships in the entry chunk. All chunks are
// still precached by the service worker, so every route works offline.
const preloaders: (() => Promise<unknown>)[] = [];
const page = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) => {
  preloaders.push(load);
  return lazy(() => load().then((m) => ({ default: m[name] })));
};

const Learn = page(() => import('@/pages/Learn'), 'Learn');
const Lesson = page(() => import('@/pages/Lesson'), 'Lesson');
const Catecheses = page(() => import('@/pages/Catecheses'), 'Catecheses');
const Videos = page(() => import('@/pages/Videos'), 'Videos');
const Subjects = page(() => import('@/pages/Subjects'), 'Subjects');
const SubjectDetail = page(() => import('@/pages/SubjectDetail'), 'SubjectDetail');
const Study = page(() => import('@/pages/Study'), 'Study');
const Catechesis = page(() => import('@/pages/Catechesis'), 'Catechesis');
const CatechesisItem = page(() => import('@/pages/CatechesisItem'), 'CatechesisItem');
const Documents = page(() => import('@/pages/Documents'), 'Documents');
const DocumentReader = page(() => import('@/pages/DocumentReader'), 'DocumentReader');
const Claims = page(() => import('@/pages/Claims'), 'Claims');
const ClaimDetail = page(() => import('@/pages/ClaimDetail'), 'ClaimDetail');
const SearchPage = page(() => import('@/pages/Search'), 'SearchPage');
const Timeline = page(() => import('@/pages/Timeline'), 'Timeline');
const Glossary = page(() => import('@/pages/Glossary'), 'Glossary');
const Hermeneutics = page(() => import('@/pages/Hermeneutics'), 'Hermeneutics');
const About = page(() => import('@/pages/About'), 'About');
const NotFound = page(() => import('@/pages/NotFound'), 'NotFound');

// The artifact preview cannot use history routing inside its sandboxed frame.
const Router = IS_ARTIFACT_PREVIEW ? MemoryRouter : BrowserRouter;
// '/Vii/' on GitHub Pages, '' at a domain root.
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  useThemeEffect();

  // Background work, started only once the first page has settled: warm every page
  // chunk (so later navigation never shows a loader), then build or restore the offline
  // search index. Search loads dynamically, so MiniSearch and Dexie stay out of the entry chunk.
  useEffect(() => {
    const idle = (cb: () => void) => (window.requestIdleCallback ? window.requestIdleCallback(cb, { timeout: 4000 }) : window.setTimeout(cb, 200));
    const t1 = window.setTimeout(() => idle(() => preloaders.forEach((load) => void load().catch(() => undefined))), 2500);
    const t2 = window.setTimeout(() => idle(() => void import('@/lib/search').then((m) => m.getSearchEngine()).catch(() => undefined)), 6000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const s = (el: React.ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

  return (
    <Router basename={IS_ARTIFACT_PREVIEW ? undefined : ROUTER_BASENAME} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="learn" element={s(<Learn />)} />
          <Route path="learn/:id" element={s(<Lesson />)} />
          <Route path="catecheses" element={s(<Catecheses />)} />
          <Route path="catechesis" element={s(<Catechesis />)} />
          <Route path="catechesis/:id" element={s(<CatechesisItem />)} />
          <Route path="videos" element={s(<Videos />)} />
          <Route path="subjects" element={s(<Subjects />)} />
          <Route path="subjects/:id" element={s(<SubjectDetail />)} />
          <Route path="subjects/:id/study/:chapter" element={s(<Study />)} />
          <Route path="documents" element={s(<Documents />)} />
          <Route path="documents/:id" element={s(<DocumentReader />)} />
          <Route path="claims" element={s(<Claims />)} />
          <Route path="claims/:id" element={s(<ClaimDetail />)} />
          <Route path="search" element={s(<SearchPage />)} />
          <Route path="timeline" element={s(<Timeline />)} />
          <Route path="glossary" element={s(<Glossary />)} />
          <Route path="hermeneutics" element={s(<Hermeneutics />)} />
          <Route path="about" element={s(<About />)} />
          <Route path="*" element={s(<NotFound />)} />
        </Route>
      </Routes>
    </Router>
  );
}
