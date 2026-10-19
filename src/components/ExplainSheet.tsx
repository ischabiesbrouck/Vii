import { ParagraphSheet } from '@/components/ParagraphSheet';
import { getParagraph } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useExplain } from '@/store/explain';

/** The paragraph panel (excerpt, explanation, citation, references) for any excerpt tapped outside the reader. */
export function ExplainSheet() {
  const id = useExplain((s) => s.id);
  const close = useExplain((s) => s.close);
  const { data } = useAsync(() => (id ? getParagraph(id) : Promise.resolve(null)), [id]);
  if (!data) return null;
  return <ParagraphSheet paragraph={data.paragraph} doc={data.doc} open={!!id} onOpenChange={(o) => !o && close()} />;
}
