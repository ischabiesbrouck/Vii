import { ExternalLink } from 'lucide-react';
import { getImages } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useLang } from '@/lib/hooks';
import { cn, pick } from '@/lib/utils';
import type { LicensedImage } from '@/types/content';

const BASE = `${import.meta.env.BASE_URL}images/`;
/** Width of the reduced copies in public/images/640/. */
const SMALL = 640;

export function useImage(id: string | undefined): LicensedImage | undefined {
  const { data } = useAsync(getImages, []);
  return id ? data?.find((x) => x.id === id) : undefined;
}

/**
 * A licensed photograph. Serves the 640 px copy to small screens and the full file
 * (at most 1000 px) to the rest; width and height reserve the space before it loads.
 */
export function Photo({
  image,
  sizes,
  className,
  priority = false,
  focus,
}: {
  image: LicensedImage;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** CSS object-position for cropped placements, e.g. '50% 20%'. */
  focus?: string;
}) {
  const lang = useLang();
  const srcSet = image.width > SMALL ? `${BASE}640/${image.file} ${SMALL}w, ${BASE}${image.file} ${image.width}w` : undefined;
  return (
    <img
      src={`${BASE}${image.file}`}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      width={image.width}
      height={image.height}
      alt={pick(lang, image.altNl, image.altEn)}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      style={focus ? { objectPosition: focus } : undefined}
      // Offline, a full-size file that was never viewed is not cached: use the 640 px copy,
      // which every image has and the service worker always keeps.
      onError={(e) => {
        const img = e.currentTarget;
        if (img.dataset.fallback) return;
        img.dataset.fallback = '1';
        img.removeAttribute('srcset');
        img.src = `${BASE}640/${image.file}`;
      }}
      className={cn('photo bg-surface', className)}
    />
  );
}

/** Author, licence and Commons link, as CC BY and CC BY-SA require. */
export function Credit({ image, className }: { image: LicensedImage; className?: string }) {
  return (
    <span className={cn('text-[0.75rem] text-muted', className)}>
      {image.author} ·{' '}
      {image.licenseUrl ? (
        <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline underline-offset-2 hover:text-fg">
          {image.license}
        </a>
      ) : (
        image.license
      )}{' '}
      ·{' '}
      <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-fg">
        Wikimedia Commons <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    </span>
  );
}
