import { useToast } from '@/store/toast';

export function Toast() {
  const message = useToast((s) => s.message);
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 lg:bottom-6 lg:justify-end lg:px-6">
      {message && (
        <div className="max-w-sm rounded-sm border-l-2 border-gold bg-fg px-4 py-2.5 text-sm text-bg shadow-lift animate-in fade-in-0 slide-in-from-bottom-2">
          {message}
        </div>
      )}
    </div>
  );
}
