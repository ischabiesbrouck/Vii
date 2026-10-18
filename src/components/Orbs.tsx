import { cn } from '@/lib/utils';

const tones = {
  violet: 'radial-gradient(circle at 32% 28%, #ffffff 0%, #e4dcf7 18%, #a996dc 52%, #6b55a8 82%, #4a3a78 100%)',
  rose: 'radial-gradient(circle at 32% 28%, #ffffff 0%, #f8dfe4 18%, #e3a0ae 52%, #b45a6e 85%, #7a1f30 100%)',
  gold: 'radial-gradient(circle at 32% 28%, #fffaf0 0%, #f1e2bf 20%, #d4b47a 55%, #a07c3e 85%, #6e5528 100%)',
} as const;

type Orb = { tone: keyof typeof tones; size: number; top: string; left: string; delay?: number };

const presets: Record<'card' | 'hero' | 'small', Orb[]> = {
  card: [
    { tone: 'violet', size: 92, top: '-18px', left: '58%' },
    { tone: 'rose', size: 44, top: '62px', left: '84%', delay: 1.2 },
    { tone: 'gold', size: 26, top: '18px', left: '48%', delay: 2.1 },
  ],
  hero: [
    { tone: 'violet', size: 180, top: '-40px', left: '62%' },
    { tone: 'rose', size: 88, top: '120px', left: '86%', delay: 1.4 },
    { tone: 'gold', size: 46, top: '40px', left: '54%', delay: 2.4 },
    { tone: 'violet', size: 30, top: '190px', left: '70%', delay: 0.8 },
  ],
  small: [
    { tone: 'violet', size: 54, top: '-10px', left: '60%' },
    { tone: 'gold', size: 22, top: '34px', left: '82%', delay: 1.6 },
  ],
};

/**
 * Decorative glossy spheres, drawn with CSS gradients only (no images, no
 * network). An abstract nod to the soft 3D forms of contemporary study apps,
 * coloured after the liturgical violet, rose and gold. Hidden from assistive tech.
 */
export function Orbs({ preset = 'card', className }: { preset?: keyof typeof presets; className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {presets[preset].map((o, i) => (
        <span
          key={i}
          className="absolute rounded-full opacity-90 shadow-[inset_-6px_-10px_18px_rgb(0_0_0/0.18),0_14px_30px_-10px_rgb(40_20_80/0.45)] motion-safe:animate-[orb_9s_ease-in-out_infinite] dark:opacity-75"
          style={{ width: o.size, height: o.size, top: o.top, left: o.left, background: tones[o.tone], animationDelay: `${o.delay ?? 0}s` }}
        />
      ))}
    </div>
  );
}
