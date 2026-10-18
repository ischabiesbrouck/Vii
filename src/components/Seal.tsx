import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * The app's own seal, in the manner of academic and curial seals: a Latin legend
 * around a double ring, and an open book under a cross at the centre. It is not
 * modelled on any official emblem of the Holy See (no keys, no tiara, no arms).
 */
export function Seal({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  const r = 43;
  const circumference = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className={cn('shrink-0', className)} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <path id={`seal-${id}`} d={`M 60 ${60 - r} a ${r} ${r} 0 1 1 -0.01 0`} />
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="53.5" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <text fill="currentColor" fontFamily='"Cinzel Variable", Georgia, serif' fontSize="7.4" fontWeight="600" letterSpacing="0.6">
        <textPath href={`#seal-${id}`} textLength={circumference - 2} lengthAdjust="spacing">
          STVDIVM · CONCILII · VATICANI · II · MCMLXII · MCMLXV ·
        </textPath>
      </text>
      {/* cross */}
      <path d="M60 33.5v15M54.5 38.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="square" fill="none" />
      {/* open book */}
      <path
        d="M60 57c-6-3.2-13-3.6-19-2.2v19.4c6-1.4 13-1 19 2.2 6-3.2 13-3.6 19-2.2V54.8c-6-1.4-13-1-19 2.2zM60 57v19.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M45 60.5c3.6-.6 7.6-.3 11 1M45 65c3.6-.6 7.6-.3 11 1M64 61.5c3.4-1.3 7.4-1.6 11-1M64 66c3.4-1.3 7.4-1.6 11-1" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <text x="60" y="87" textAnchor="middle" fill="currentColor" fontFamily='"Cinzel Variable", Georgia, serif' fontSize="7" fontWeight="700" letterSpacing="1.2">
        II
      </text>
    </svg>
  );
}
