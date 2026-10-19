import { useEffect, useState } from 'react';

/*
 * Full screen. The installed app opens full screen by itself (manifest display
 * "fullscreen"); in the browser the reader can switch it on where the Fullscreen API
 * exists (Android, desktop, iPad). iPhone Safari has no such API: there the app is
 * full screen once added to the home screen.
 */

type Doc = Document & { webkitFullscreenElement?: Element | null; webkitFullscreenEnabled?: boolean; webkitExitFullscreen?: () => Promise<void> };
type El = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

const doc = () => document as Doc;

export const fullscreenSupported = () => typeof document !== 'undefined' && !!(doc().fullscreenEnabled || doc().webkitFullscreenEnabled);

/** Running as an installed app (home screen), which is already full screen or standalone. */
export const installedDisplay = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

const active = () => !!(doc().fullscreenElement || doc().webkitFullscreenElement);

export async function toggleFullscreen() {
  try {
    if (active()) await (doc().exitFullscreen?.() ?? doc().webkitExitFullscreen?.());
    else {
      const el = document.documentElement as El;
      await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.());
    }
  } catch {
    /* refused by the browser (no user gesture, or a policy): nothing to do */
  }
}

/** [is full screen, can be toggled here]. */
export function useFullscreen(): [boolean, boolean] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const update = () => setOn(active());
    update();
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update);
    return () => {
      document.removeEventListener('fullscreenchange', update);
      document.removeEventListener('webkitfullscreenchange', update);
    };
  }, []);
  return [on, fullscreenSupported() && !installedDisplay()];
}
