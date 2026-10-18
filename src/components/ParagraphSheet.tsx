import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkCheck, Copy, ExternalLink, Share2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Commentary, ConciliarText, RefItem } from '@/components/TextBlocks';
import { copyText, fullCite } from '@/lib/citation';
import { useLang } from '@/lib/hooks';
import { pick } from '@/lib/utils';
import { useUi } from '@/store/ui';
import { useToast } from '@/store/toast';
import type { CouncilDocument, Paragraph } from '@/types/content';

export async function copyCitation(p: Paragraph, doc: CouncilDocument, lang: 'nl' | 'en', message: string) {
  if (await copyText(fullCite(p.id, doc, lang))) useToast.getState().show(message);
}

export function ParagraphSheet({
  paragraph,
  doc,
  open,
  onOpenChange,
}: {
  paragraph: Paragraph | null;
  doc: CouncilDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const bookmarks = useUi((s) => s.bookmarks);
  const toggleBookmark = useUi((s) => s.toggleBookmark);
  const show = useToast((s) => s.show);
  if (!paragraph) return null;

  const citation = fullCite(paragraph.id, doc, lang);
  const isBookmarked = bookmarks.includes(paragraph.id);
  const note = pick(lang, paragraph.noteNl, paragraph.noteEn);
  const canShare = typeof navigator.share === 'function';

  const share = async () => {
    try {
      await navigator.share({
        title: citation,
        text: `${citation}\n${doc.officialUrl}`,
        url: `${location.origin}/documents/${doc.id}#${paragraph.id}`,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={citation} description={`${doc.titleLa} — ${pick(lang, doc.titleNl, doc.titleEn)}`} closeLabel={t('app.close')}>
        <ConciliarText paragraph={paragraph} showLatin />
        {note && <Commentary className="mt-3">{note}</Commentary>}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => copyCitation(paragraph, doc, lang, t('para.copied'))}>
            <Copy className="h-4 w-4" aria-hidden />
            {t('para.copy')}
          </Button>
          {canShare && (
            <Button variant="outline" size="sm" onClick={share}>
              <Share2 className="h-4 w-4" aria-hidden />
              {t('para.share')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            aria-pressed={isBookmarked}
            onClick={() => {
              toggleBookmark(paragraph.id);
              if (!isBookmarked) show(t('para.bookmarked'));
            }}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-accent" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
            {isBookmarked ? t('para.unbookmark') : t('para.bookmark')}
          </Button>
        </div>

        <section className="mt-5">
          <h3 className="label-eyebrow mb-2">{t('para.crossRefs')}</h3>
          {paragraph.crossRefs.length ? (
            <ul className="space-y-2">
              {paragraph.crossRefs.map((r) => (
                <li key={r} className="leading-snug">
                  <RefItem refId={r} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t('para.noCrossRefs')}</p>
          )}
        </section>

        {paragraph.tags.length > 0 && (
          <section className="mt-5">
            <h3 className="label-eyebrow mb-2">{t('para.tags')}</h3>
            <div className="flex flex-wrap gap-1.5">
              {paragraph.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </section>
        )}

        <a
          href={doc.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-[44px] items-center gap-1 text-sm text-accent underline underline-offset-2"
        >
          {t('doc.fullAt')} — {t('doc.official')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </SheetContent>
    </Sheet>
  );
}
