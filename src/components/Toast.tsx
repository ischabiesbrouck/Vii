import { useToast } from '@/store/toast';

export function Toast() {
  const message = useToast((s) => s.message);
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      {message && (
        <div className="rounded-full bg-fg px-4 py-2 text-sm text-bg shadow-lg animate-in fade-in-0 slide-in-from-bottom-2">
          {message}
        </div>
      )}
    </div>
  );
}
