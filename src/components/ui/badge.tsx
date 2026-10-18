import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5',
  {
    variants: {
      variant: {
        constitution: 'border-transparent bg-[#7A1F1F] text-[#FAF8F3]',
        decree: 'border-transparent bg-[#B08D4F] text-[#1A1A1A]',
        declaration: 'border-transparent bg-[#475569] text-white',
        outline: 'border-line text-muted',
        ok: 'border-ok/40 text-ok bg-ok/10',
        bad: 'border-bad/40 text-bad bg-bad/10',
        warn: 'border-warn/40 text-warn bg-warn/10',
        slate: 'border-slate/40 text-slate bg-slate/10',
        gold: 'border-gold/60 text-gold-text',
      },
    },
    defaultVariants: { variant: 'outline' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
