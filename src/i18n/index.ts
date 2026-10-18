import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';
import { useUi } from '@/store/ui';

void i18n.use(initReactI18next).init({
  resources,
  lng: useUi.getState().lang,
  fallbackLng: 'nl',
  interpolation: { escapeValue: false },
  returnNull: false,
});

const applyLang = (lang: string) => {
  document.documentElement.lang = lang === 'en' ? 'en-GB' : 'nl-NL';
};
applyLang(useUi.getState().lang);

useUi.subscribe((s, prev) => {
  if (s.lang !== prev.lang) {
    void i18n.changeLanguage(s.lang);
    applyLang(s.lang);
  }
});

export default i18n;
