import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 min-h-[44px]',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-fg hover:bg-accent/90',
        outline: 'border border-line bg-card hover:border-gold hover:bg-surface',
        ghost: 'hover:bg-surface',
        link: 'text-accent underline-offset-4 hover:underline min-h-0',
      },
      size: {
        default: 'px-4 py-2',
        sm: 'px-3 text-xs min-h-[36px]',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
