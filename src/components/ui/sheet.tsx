import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof Dialog.Content> {
  side?: 'bottom' | 'right';
  title: string;
  closeLabel: string;
  description?: string;
}

/** Bottom sheet (mobile) built on Radix Dialog: focus trap, Esc, aria wiring. */
export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, children, side = 'bottom', title, description, closeLabel, ...props }, ref) => (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <Dialog.Content
        ref={ref}
        className={cn(
          'fixed z-50 flex flex-col bg-bg text-fg shadow-xl outline-none',
          side === 'bottom' &&
            'inset-x-0 bottom-0 mx-auto max-h-[85dvh] w-full max-w-2xl rounded-t-2xl border-t border-line pb-safe data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom',
          side === 'right' &&
            'inset-y-0 right-0 h-full w-[min(20rem,85vw)] border-l border-line pt-safe data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-2">
          <div className="min-w-0 py-2">
            <Dialog.Title className="font-semibold">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="text-sm text-muted">{description}</Dialog.Description>
            ) : (
              <Dialog.Description className="sr-only">{title}</Dialog.Description>
            )}
          </div>
          <Dialog.Close className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-surface" aria-label={closeLabel}>
            <X className="h-5 w-5" aria-hidden />
          </Dialog.Close>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  ),
);
SheetContent.displayName = 'SheetContent';
