import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex min-h-[44px] w-full rounded-md border border-line bg-card px-3 py-2 text-base placeholder:text-muted',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
