import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { IS_ARTIFACT_PREVIEW } from '@/config';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { Documents } from '@/pages/Documents';
import { DocumentReader } from '@/pages/DocumentReader';
import { Claims } from '@/pages/Claims';
import { ClaimDetail } from '@/pages/ClaimDetail';
import { SearchPage } from '@/pages/Search';
import { Timeline } from '@/pages/Timeline';
import { Glossary } from '@/pages/Glossary';
import { Hermeneutics } from '@/pages/Hermeneutics';
import { About } from '@/pages/About';
import { NotFound } from '@/pages/NotFound';
import { useThemeEffect } from '@/lib/hooks';
import { getSearchEngine } from '@/lib/search';
import { useEffect } from 'react';

// The artifact preview cannot use history routing inside its sandboxed frame.
const Router = IS_ARTIFACT_PREVIEW ? MemoryRouter : BrowserRouter;

export function App() {
  useThemeEffect();

  // Build (or restore) the offline search index at app init, off the critical path.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    idle(() => void getSearchEngine().catch(() => undefined));
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="documents" element={<Documents />} />
          <Route path="documents/:id" element={<DocumentReader />} />
          <Route path="claims" element={<Claims />} />
          <Route path="claims/:id" element={<ClaimDetail />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="glossary" element={<Glossary />} />
          <Route path="hermeneutics" element={<Hermeneutics />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
