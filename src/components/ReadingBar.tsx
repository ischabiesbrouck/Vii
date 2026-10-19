import { useEffect, useState, type RefObject } from 'react';

/** Hairline at the top of the viewport showing how far the reader is through `target`. */
export function ReadingBar({ target }: { target: RefObject<HTMLElement> }) {
  const [fraction, setFraction] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = target.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setFraction(total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target]);
  return <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px] origin-left bg-accent" style={{ transform: `scaleX(${fraction})` }} />;
}
