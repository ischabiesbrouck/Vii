import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUi } from '@/store/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

/** "Installeer app" prompt: dismissible, shown at most once. */
export function InstallPrompt() {
  const { t } = useTranslation();
  const dismissed = useUi((s) => s.installDismissed);
  const dismiss = useUi((s) => s.dismissInstall);
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (dismissed || isStandalone()) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    // iOS Safari has no beforeinstallprompt: show the manual hint instead.
    const iosTimer = isIos() ? setTimeout(() => setShowIos(true), 4000) : undefined;
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(iosTimer);
    };
  }, [dismissed]);

  if (dismissed || (!evt && !showIos)) return null;

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setEvt(null);
    dismiss();
  };

  return (
    <div role="region" aria-label={t('install.title')} className="fixed inset-x-0 bottom-[4.75rem] z-40 mx-auto w-full max-w-2xl px-3 pb-safe">
      <div className="flex items-start gap-3 rounded-xl border border-line bg-card p-3 shadow-lg">
        <Download className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t('install.title')}</p>
          <p className="text-sm text-muted">{evt ? t('install.body') : t('install.ios')}</p>
          {evt && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={install}>
                {t('install.action')}
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                {t('install.dismiss')}
              </Button>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={dismiss} aria-label={t('app.close')}>
          <X className="h-5 w-5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
